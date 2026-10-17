const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { testConnection } = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all incoming origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'aToken', 'dToken', 'pToken', 'x-auth-token']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Fallback to root for html/css/js files

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Appointy API'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middlewares
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

// Start server and check database connection
app.listen(PORT, async () => {
  console.log('==================================================');
  console.log(`🚀 Appointy Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files served from: ${__dirname}`);
  console.log(`📁 Uploads available at: http://localhost:${PORT}/uploads/`);
  console.log('==================================================');
  await testConnection();
});
