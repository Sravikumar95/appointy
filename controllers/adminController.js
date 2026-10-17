const bcrypt = require('bcryptjs');
const validator = require('validator');
const { query } = require('../config/db');

// GET /api/admin/dashboard
// Admin dashboard summary stats & recent appointments
async function getDashboard(req, res, next) {
  try {
    const [docCount] = await query('SELECT COUNT(*) AS total FROM doctors');
    const [apptCount] = await query('SELECT COUNT(*) AS total FROM appointments');
    const [patientCount] = await query("SELECT COUNT(*) AS total FROM users WHERE role = 'patient'");
    const [revenue] = await query("SELECT COALESCE(SUM(amount), 0) AS total FROM appointments WHERE status IN ('confirmed', 'completed')");

    // Latest 5 appointments
    const [latestRows] = await query(`
      SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.slot_date AS slotDate,
        a.slot_time AS slotTime,
        a.amount,
        a.status,
        a.payment_status AS payment,
        u.name AS patient_name,
        u.email AS patient_email,
        du.name AS doctor_name,
        d.specialization AS doctor_specialization,
        d.image AS doctor_image
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

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
        image: null
      },
      docData: {
        name: r.doctor_name,
        speciality: r.doctor_specialization,
        image: r.doctor_image
      }
    }));

    return res.status(200).json({
      success: true,
      dashData: {
        doctors: docCount[0].total,
        appointments: apptCount[0].total,
        patients: patientCount[0].total,
        revenue: Number(revenue[0].total),
        latestAppointments
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/doctors or /api/admin/all-doctors
// List all doctors
async function getAllDoctors(req, res, next) {
  try {
    const [doctors] = await query(`
      SELECT 
        d.id AS _id,
        d.id,
        d.user_id,
        u.name,
        u.email,
        u.phone,
        d.specialization,
        d.specialization AS speciality,
        d.degree,
        d.experience,
        d.about,
        d.fees,
        d.address_line1,
        d.address_line2,
        d.image,
        d.available,
        d.is_approved,
        d.created_at
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/admin/doctors or /api/admin/add-doctor
// Admin creates a new doctor account with profile photo upload
async function addDoctor(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      speciality,
      specialization,
      degree,
      experience,
      fees,
      about,
      address1,
      address2
    } = req.body;

    const chosenSpec = speciality || specialization;

    // Validate inputs
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Doctor full name is required.' });
    }

    if (!email || !validator.isEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (!chosenSpec) {
      return res.status(400).json({ success: false, message: 'Specialization is required.' });
    }

    if (!degree) {
      return res.status(400).json({ success: false, message: 'Doctor degree/qualification is required.' });
    }

    if (!fees || isNaN(fees)) {
      return res.status(400).json({ success: false, message: 'Valid consultation fee is required.' });
    }

    // Check email uniqueness
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user with role 'doctor'
    const [userRes] = await query(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'doctor')`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const userId = userRes.insertId;

    // Photo path from multer if uploaded
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/doctors/${req.file.filename}`;
    }

    // Insert doctor profile
    const [docRes] = await query(`
      INSERT INTO doctors (
        user_id,
        specialization,
        degree,
        experience,
        about,
        fees,
        address_line1,
        address_line2,
        image,
        available,
        is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `, [
      userId,
      chosenSpec.trim(),
      degree.trim(),
      experience || '1 Year',
      about || '',
      Number(fees),
      address1 || '',
      address2 || '',
      photoUrl
    ]);

    return res.status(201).json({
      success: true,
      message: 'Doctor added successfully!',
      doctorId: docRes.insertId,
      userId
    });
  } catch (error) {
    next(error);
  }
}

// POST or PUT /api/admin/change-availability
// Toggle doctor's availability
async function changeAvailability(req, res, next) {
  try {
    const docId = req.body.docId || req.params.id;
    if (!docId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required.' });
    }

    const [rows] = await query('SELECT id, available FROM doctors WHERE id = ?', [docId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const newAvail = rows[0].available ? 0 : 1;
    await query('UPDATE doctors SET available = ? WHERE id = ?', [newAvail, docId]);

    return res.status(200).json({
      success: true,
      message: `Doctor availability changed to ${newAvail ? 'Available' : 'Unavailable'}.`,
      available: Boolean(newAvail)
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/admin/doctors/:id/approval
// Approve or disapprove doctor
async function toggleApproval(req, res, next) {
  try {
    const docId = Number(req.params.id);
    const { is_approved } = req.body;

    const [rows] = await query('SELECT id, is_approved FROM doctors WHERE id = ?', [docId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const newStatus = is_approved !== undefined ? (is_approved ? 1 : 0) : (rows[0].is_approved ? 0 : 1);
    await query('UPDATE doctors SET is_approved = ? WHERE id = ?', [newStatus, docId]);

    return res.status(200).json({
      success: true,
      message: `Doctor approval status set to ${newStatus ? 'Approved' : 'Unapproved'}.`,
      is_approved: Boolean(newStatus)
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/doctors/:id
// Remove doctor from system
async function removeDoctor(req, res, next) {
  try {
    const docId = Number(req.params.id);

    const [rows] = await query('SELECT id, user_id FROM doctors WHERE id = ?', [docId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const userId = rows[0].user_id;

    // Delete user row (cascades to doctors and appointments due to ON DELETE CASCADE)
    await query('DELETE FROM users WHERE id = ?', [userId]);

    return res.status(200).json({
      success: true,
      message: 'Doctor and associated account removed successfully.'
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/appointments
// View all appointments across the system
async function getAllAppointments(req, res, next) {
  try {
    const [rows] = await query(`
      SELECT 
        a.id AS _id,
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
        u.dob AS patient_dob,
        u.gender AS patient_gender,
        du.name AS doctor_name,
        d.specialization AS doctor_specialization,
        d.image AS doctor_image
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      ORDER BY a.slot_date DESC, a.slot_time DESC
    `);

    const appointments = rows.map(r => ({
      _id: r.id,
      id: r.id,
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
        dob: r.patient_dob,
        gender: r.patient_gender,
        image: null
      },
      docData: {
        name: r.doctor_name,
        speciality: r.doctor_specialization,
        image: r.doctor_image
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

// PUT /api/admin/appointments/:id/cancel
// Admin cancels any appointment
async function cancelAppointment(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);

    const [rows] = await query('SELECT id, status FROM appointments WHERE id = ?', [appointmentId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    await query("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [appointmentId]);

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully by Administrator.'
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/users
// View all registered users (patients, doctors, admins)
async function getAllUsers(req, res, next) {
  try {
    const { role, search } = req.query;

    let sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.gender,
        u.dob,
        u.created_at,
        d.id AS doctor_profile_id,
        d.specialization,
        d.available,
        d.is_approved
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE 1=1
    `;

    const params = [];

    if (role && role !== 'all') {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    if (search && search.trim()) {
      sql += ' AND (LOWER(u.name) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?))';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY u.created_at DESC';

    const [users] = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  getAllDoctors,
  addDoctor,
  changeAvailability,
  toggleApproval,
  removeDoctor,
  getAllAppointments,
  cancelAppointment,
  getAllUsers
};
