const { query } = require('../config/db');

// Standard daily slots for booking
const DEFAULT_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM'
];

// GET /api/patient/doctors
// Public or Patient: Browse approved & available doctors with filtering
async function getDoctors(req, res, next) {
  try {
    const { specialization, search } = req.query;

    let sql = `
      SELECT 
        d.id,
        d.user_id,
        u.name,
        u.email,
        u.phone,
        d.specialization,
        d.degree,
        d.experience,
        d.about,
        d.fees,
        d.address_line1,
        d.address_line2,
        d.image,
        d.available,
        d.is_approved
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.is_approved = 1
    `;

    const params = [];

    if (specialization && specialization !== 'All') {
      sql += ` AND LOWER(d.specialization) = LOWER(?)`;
      params.push(specialization.trim());
    }

    if (search && search.trim()) {
      sql += ` AND (LOWER(u.name) LIKE LOWER(?) OR LOWER(d.specialization) LIKE LOWER(?) OR LOWER(d.about) LIKE LOWER(?))`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY d.available DESC, d.id ASC`;

    const [doctors] = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/patient/doctors/:id
// Get details of a single doctor
async function getDoctorById(req, res, next) {
  try {
    const doctorId = Number(req.params.id);

    const [rows] = await query(`
      SELECT 
        d.id,
        d.user_id,
        u.name,
        u.email,
        u.phone,
        d.specialization,
        d.degree,
        d.experience,
        d.about,
        d.fees,
        d.address_line1,
        d.address_line2,
        d.image,
        d.available,
        d.is_approved
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ? AND d.is_approved = 1
    `, [doctorId]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not approved.'
      });
    }

    return res.status(200).json({
      success: true,
      doctor: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/patient/doctors/:id/slots?date=YYYY-MM-DD
// View doctor's available slots for a given date
async function getDoctorSlots(req, res, next) {
  try {
    const doctorId = Number(req.params.id);
    const date = req.query.date;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date in query parameter (e.g. ?date=YYYY-MM-DD).'
      });
    }

    // Check doctor exists
    const [docRows] = await query('SELECT id, available FROM doctors WHERE id = ? AND is_approved = 1', [doctorId]);
    if (!docRows.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const isDoctorAvailable = Boolean(docRows[0].available);

    // Fetch existing active appointments for that doctor on that date
    const [bookedRows] = await query(
      `SELECT slot_time FROM appointments WHERE doctor_id = ? AND slot_date = ? AND status IN ('pending', 'confirmed')`,
      [doctorId, date]
    );

    const bookedTimes = new Set(bookedRows.map(r => r.slot_time));

    // Construct slot objects
    const slots = DEFAULT_SLOTS.map(time => {
      const isBooked = bookedTimes.has(time);
      const isSlotAvailable = isDoctorAvailable && !isBooked;

      return {
        time,
        date,
        available: isSlotAvailable,
        reason: !isDoctorAvailable ? 'Doctor unavailable' : (isBooked ? 'Already booked' : 'Available')
      };
    });

    return res.status(200).json({
      success: true,
      doctorId,
      date,
      doctorAvailable: isDoctorAvailable,
      slots
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/patient/appointments
// Book an appointment (with UI payment simulation)
async function bookAppointment(req, res, next) {
  try {
    const patientId = req.user.id;
    const { doctorId, slotDate, slotTime, notes } = req.body;

    if (!doctorId || !slotDate || !slotTime) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, slot date, and slot time are required to book an appointment.'
      });
    }

    // Verify doctor exists and is approved & available
    const [docs] = await query('SELECT id, fees, available, is_approved FROM doctors WHERE id = ?', [doctorId]);
    if (!docs.length || !docs[0].is_approved) {
      return res.status(404).json({ success: false, message: 'Selected doctor is not available.' });
    }

    const doctor = docs[0];
    if (!doctor.available) {
      return res.status(400).json({ success: false, message: 'Doctor is currently not accepting appointments.' });
    }

    // Check for double booking
    const [existing] = await query(
      `SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status IN ('pending', 'confirmed')`,
      [doctorId, slotDate, slotTime]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time or date.'
      });
    }

    // Insert appointment (simulating paid status via UI payment step)
    const amount = doctor.fees;
    const [result] = await query(
      `INSERT INTO appointments (patient_id, doctor_id, slot_date, slot_time, amount, status, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, 'confirmed', 'paid', ?)`,
      [patientId, doctorId, slotDate, slotTime, amount, notes || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointmentId: result.insertId,
      bookingDetails: {
        id: result.insertId,
        doctorId,
        slotDate,
        slotTime,
        amount,
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/patient/appointments
// View all appointments for the logged-in patient
async function getMyAppointments(req, res, next) {
  try {
    const patientId = req.user.id;

    const [appointments] = await query(`
      SELECT 
        a.id,
        a.doctor_id,
        a.slot_date,
        a.slot_time,
        a.amount,
        a.status,
        a.payment_status,
        a.notes,
        a.created_at,
        u.name AS doctor_name,
        u.email AS doctor_email,
        u.phone AS doctor_phone,
        d.specialization,
        d.degree,
        d.image AS doctor_image,
        d.address_line1,
        d.address_line2
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.slot_date DESC, a.slot_time DESC
    `, [patientId]);

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/patient/appointments/:id/cancel
// Cancel patient's appointment
async function cancelAppointment(req, res, next) {
  try {
    const patientId = req.user.id;
    const appointmentId = Number(req.params.id);

    const [rows] = await query(
      'SELECT id, status FROM appointments WHERE id = ? AND patient_id = ?',
      [appointmentId, patientId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or you are not authorized to cancel it.'
      });
    }

    const appointment = rows[0];
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled.'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed appointments cannot be cancelled.'
      });
    }

    await query(
      "UPDATE appointments SET status = 'cancelled' WHERE id = ?",
      [appointmentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment
};
