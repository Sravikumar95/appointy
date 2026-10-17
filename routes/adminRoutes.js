const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin direct login endpoint (matching UI fetch)
router.post('/login', (req, res, next) => {
  req.body.role = 'admin';
  return authController.login(req, res, next);
});

// Protected routes (Admin only)
router.use(authenticate, requireRole(['admin']));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Doctors management
router.get('/doctors', adminController.getAllDoctors);
router.get('/all-doctors', adminController.getAllDoctors); // UI alias
router.post('/doctors', upload.single('image'), adminController.addDoctor);
router.post('/add-doctor', upload.single('image'), adminController.addDoctor); // UI alias
router.post('/change-availability', adminController.changeAvailability); // UI alias
router.put('/doctors/:id/availability', adminController.changeAvailability);
router.put('/doctors/:id/approval', adminController.toggleApproval);
router.delete('/doctors/:id', adminController.removeDoctor);

// Appointments management
router.get('/appointments', adminController.getAllAppointments);
router.put('/appointments/:id/cancel', adminController.cancelAppointment);
router.post('/cancel-appointment', (req, res, next) => {
  req.params.id = req.body.appointmentId;
  return adminController.cancelAppointment(req, res, next);
});

// Users management
router.get('/users', adminController.getAllUsers);

module.exports = router;
