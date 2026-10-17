const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public endpoints to browse doctors and slots
router.get('/doctors', patientController.getDoctors);
router.get('/doctors/:id', patientController.getDoctorById);
router.get('/doctors/:id/slots', patientController.getDoctorSlots);

// Patient protected endpoints
router.post('/appointments', authenticate, requireRole(['patient']), patientController.bookAppointment);
router.get('/appointments', authenticate, requireRole(['patient']), patientController.getMyAppointments);
router.put('/appointments/:id/cancel', authenticate, requireRole(['patient']), patientController.cancelAppointment);

module.exports = router;
