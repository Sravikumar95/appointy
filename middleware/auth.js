const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Extracts token from headers (supports Bearer token, aToken, dToken, pToken, or x-auth-token)
function extractToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.headers.atoken) return req.headers.atoken;
  if (req.headers.dtoken) return req.headers.dtoken;
  if (req.headers.ptoken) return req.headers.ptoken;
  if (req.headers['x-auth-token']) return req.headers['x-auth-token'];
  return null;
}

// Middleware: Authenticate and verify JWT
async function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'appointy_jwt_secret_super_secure_key_2026');
    
    // Look up the user in database to ensure account is valid
    const [rows] = await query('SELECT id, name, email, role, phone, gender, dob FROM users WHERE id = ?', [decoded.id]);
    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User no longer exists.'
      });
    }

    req.user = rows[0];

    // If user is a doctor, also fetch doctor table ID
    if (req.user.role === 'doctor') {
      const [doctorRows] = await query('SELECT * FROM doctors WHERE user_id = ?', [req.user.id]);
      if (doctorRows.length) {
        req.doctor = doctorRows[0];
      }
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.'
    });
  }
}

// Middleware: Role-based access control (RBAC)
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] role. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  extractToken
};
