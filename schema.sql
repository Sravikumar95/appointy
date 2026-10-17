-- ========================================================
-- Appointy - Doctor Appointment Booking Web Application
-- Database Schema (MySQL)
-- ========================================================

CREATE DATABASE IF NOT EXISTS appointy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE appointy_db;

-- 1. Users Table (Patients, Doctors, Admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
  phone VARCHAR(20) DEFAULT NULL,
  gender ENUM('Male', 'Female', 'Other', 'Not Selected') DEFAULT 'Not Selected',
  dob DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Doctors Profile Table
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  specialization VARCHAR(100) NOT NULL,
  degree VARCHAR(100) NOT NULL,
  experience VARCHAR(50) NOT NULL,
  about TEXT DEFAULT NULL,
  fees DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  address_line1 VARCHAR(255) DEFAULT NULL,
  address_line2 VARCHAR(255) DEFAULT NULL,
  image VARCHAR(255) DEFAULT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1,
  is_approved TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  payment_status ENUM('pending', 'paid') NOT NULL DEFAULT 'paid',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  INDEX idx_doctor_slot (doctor_id, slot_date, slot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
