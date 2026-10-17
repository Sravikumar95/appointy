const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Doctor direct login endpoint (matching existing UI fetch)
router.post('/login', (req, res, next) => {
  req.body.role = 'doctor';
  return authController.login(req, res, next);
});

// Protected routes (Doctor only)
router.use(authenticate, requireRole(['doctor']));

router.get('/dashboard', doctorController.getDashboard);
router.get('/profile', doctorController.getProfile);
router.put('/profile', doctorController.updateProfile);
router.post('/profile', doctorController.updateProfile); // Support POST for legacy forms
router.post('/profile/photo', upload.single('image'), doctorController.uploadPhoto);
router.put('/availability', doctorController.toggleAvailability);
router.get('/appointments', doctorController.getAppointments);
router.put('/appointments/:id/status', doctorController.updateAppointmentStatus);

module.exports = router;
