const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { query } = require('../config/db');

// Helper to sign JWT
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'appointy_jwt_secret_super_secure_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, phone, gender, dob, role } = req.body;

    // Input Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters long.' });
    }

    if (!email || !validator.isEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Role safety: only allow 'patient' registration via public register.
    // Doctors and Admins are provisioned by Admin
    const userRole = role === 'patient' || !role ? 'patient' : role;
    if (userRole !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Public registration is only available for patients. Doctor accounts are created by Administrator.'
      });
    }

    // Check if email already registered
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already registered. Please log in.' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await query(
      'INSERT INTO users (name, email, password, role, phone, gender, dob) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        'patient',
        phone ? phone.trim() : null,
        gender || 'Not Selected',
        dob || null
      ]
    );

    const newUserId = result.insertId;

    const token = generateToken({
      id: newUserId,
      email: email.trim().toLowerCase(),
      role: 'patient'
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'patient',
        phone: phone || null,
        gender: gender || 'Not Selected',
        dob: dob || null
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Lookup user
    const [users] = await query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Optional role verification if caller requested specific portal login
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Account found, but role is '${user.role}' not '${role}'. Please use the correct login tab.`
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // If doctor, verify approval
    let doctorProfile = null;
    if (user.role === 'doctor') {
      const [docs] = await query('SELECT * FROM doctors WHERE user_id = ?', [user.id]);
      if (docs.length) {
        doctorProfile = docs[0];
        if (!doctorProfile.is_approved) {
          return res.status(403).json({
            success: false,
            message: 'Your doctor account is pending administrator approval.'
          });
        }
      }
    }

    // Generate JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        doctor: doctorProfile
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
      doctor: req.doctor || null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe
};
