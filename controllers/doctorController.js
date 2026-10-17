const path = require('path');
const { query } = require('../config/db');

// Helper to get doctor profile for current user
async function getDoctorRecord(userId) {
  const [rows] = await query(`
    SELECT 
      d.*,
      u.name,
      u.email,
      u.phone,
      u.gender,
      u.dob
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.user_id = ?
  `, [userId]);

  return rows.length ? rows[0] : null;
}

// GET /api/doctor/profile
async function getProfile(req, res, next) {
  try {
    const doctor = await getDoctorRecord(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    return res.status(200).json({
      success: true,
      profileData: doctor,
      doctor
    });
  } catch (error) {
    next(error);
  }
}

// PUT or POST /api/doctor/profile
// Update profile information (fees, about, experience, specialization, degree, address)
async function updateProfile(req, res, next) {
  try {
    const doctor = await getDoctorRecord(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const {
      fees,
      experience,
      about,
      address_line1,
      address_line2,
      specialization,
      degree,
      available
    } = req.body;

    const updatedFees = fees !== undefined ? Number(fees) : doctor.fees;
    const updatedExp = experience !== undefined ? experience : doctor.experience;
    const updatedAbout = about !== undefined ? about : doctor.about;
    const updatedAddr1 = address_line1 !== undefined ? address_line1 : doctor.address_line1;
    const updatedAddr2 = address_line2 !== undefined ? address_line2 : doctor.address_line2;
    const updatedSpec = specialization !== undefined ? specialization : doctor.specialization;
    const updatedDegree = degree !== undefined ? degree : doctor.degree;
    const updatedAvail = available !== undefined ? (available ? 1 : 0) : doctor.available;

    await query(`
      UPDATE doctors 
      SET 
        fees = ?,
        experience = ?,
        about = ?,
        address_line1 = ?,
        address_line2 = ?,
        specialization = ?,
        degree = ?,
        available = ?
      WHERE id = ?
    `, [
      updatedFees,
      updatedExp,
      updatedAbout,
      updatedAddr1,
      updatedAddr2,
      updatedSpec,
      updatedDegree,
      updatedAvail,
      doctor.id
    ]);

    const updatedRecord = await getDoctorRecord(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      profileData: updatedRecord,
      doctor: updatedRecord
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/doctor/profile/photo
// Upload doctor profile photo locally via multer
async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select a valid JPEG, PNG, or WebP image.'
      });
    }

    const doctor = await getDoctorRecord(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Relative web URL for uploaded image
    const photoUrl = `/uploads/doctors/${req.file.filename}`;

    await query('UPDATE doctors SET image = ? WHERE id = ?', [photoUrl, doctor.id]);

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully!',
      image: photoUrl
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/doctor/availability
// Quick toggle doctor availability
async function toggleAvailability(req, res, next) {
  try {
    const doctor = await getDoctorRecord(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const newAvailability = req.body.available !== undefined 
      ? (req.body.available ? 1 : 0) 
      : (doctor.available ? 0 : 1);

    await query('UPDATE doctors SET available = ? WHERE id = ?', [newAvailability, doctor.id]);

    return res.status(200).json({
      success: true,
      message: `Availability updated to ${newAvailability ? 'Available' : 'Unavailable'}.`,
      available: Boolean(newAvailability)
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/doctor/appointments
// View all appointment requests for this doctor
async function getAppointments(req, res, next) {
  try {
    const doctor = await getDoctorRecord(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const { status } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.slot_date AS slotDate,
        a.slot_time AS slotTime,
        a.amount,
        a.status,
        a.payment_status AS payment,
        a.notes,
        a.created_at,
        u.name AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone,
        u.gender AS patient_gender,
        u.dob AS patient_dob
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = ?
    `;

    const params = [doctor.id];

    if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.slot_date DESC, a.slot_time DESC';

    const [rows] = await query(sql, params);

    // Format output matching frontend data model
    const appointments = rows.map(r => ({
      _id: r.id,
      id: r.id,
      patientId: r.patient_id,
      slotDate: r.slotDate,
      slotTime: r.slotTime,
      amount: r.amount,
      status: r.status,
      payment: r.payment === 'paid',
      notes: r.notes,
      userData: {
        name: r.patient_name,
        email: r.patient_email,
        phone: r.patient_phone,
        gender: r.patient_gender,
        dob: r.patient_dob,
        image: null
      }
    }));

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/doctor/appointments/:id/status
// Confirm, Reject, or Complete an appointment request
async function updateAppointmentStatus(req, res, next) {
  try {
    const doctor = await getDoctorRecord(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const appointmentId = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = ['confirmed', 'cancelled', 'rejected', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
      });
    }

    // Map 'rejected' to 'cancelled' if stored as cancelled
    const targetStatus = status === 'rejected' ? 'cancelled' : status;

    const [existing] = await query(
      'SELECT id, status FROM appointments WHERE id = ? AND doctor_id = ?',
      [appointmentId, doctor.id]
    );

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or does not belong to you.'
      });
    }

    await query('UPDATE appointments SET status = ? WHERE id = ?', [targetStatus, appointmentId]);

    return res.status(200).json({
      success: true,
      message: `Appointment marked as ${targetStatus}.`
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/doctor/dashboard
// Doctor KPI stats and latest appointments
async function getDashboard(req, res, next) {
  try {
    const doctor = await getDoctorRecord(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Total earnings (from confirmed and completed appointments)
    const [earningsRows] = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total_earnings FROM appointments 
       WHERE doctor_id = ? AND status IN ('confirmed', 'completed')`,
      [doctor.id]
    );

    // Total appointments count
    const [apptRows] = await query(
      `SELECT COUNT(*) AS total_appointments FROM appointments WHERE doctor_id = ?`,
      [doctor.id]
    );

    // Unique patients count
    const [patientRows] = await query(
      `SELECT COUNT(DISTINCT patient_id) AS total_patients FROM appointments WHERE doctor_id = ?`,
      [doctor.id]
    );

    // Latest 5 appointments
    const [latestRows] = await query(`
      SELECT 
        a.id,
        a.patient_id,
        a.slot_date AS slotDate,
        a.slot_time AS slotTime,
        a.amount,
        a.status,
        a.payment_status AS payment,
        u.name AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone,
        u.gender AS patient_gender,
        u.dob AS patient_dob
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = ?
      ORDER BY a.created_at DESC
      LIMIT 5
    `, [doctor.id]);

    const latestAppointments = latestRows.map(r => ({
      _id: r.id,
      id: r.id,
      slotDate: r.slotDate,
      slotTime: r.slotTime,
      amount: r.amount,
      status: r.status,
      payment: r.payment === 'paid',
      userData: {
        name: r.patient_name,
        email: r.patient_email,
        phone: r.patient_phone,
        gender: r.patient_gender,
        dob: r.patient_dob,
        image: null
      }
    }));

    return res.status(200).json({
      success: true,
      dashData: {
        earnings: Number(earningsRows[0].total_earnings),
        appointments: Number(apptRows[0].total_appointments),
        patients: Number(patientRows[0].total_patients),
        latestAppointments
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  uploadPhoto,
  toggleAvailability,
  getAppointments,
  updateAppointmentStatus,
  getDashboard
};
