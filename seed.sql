-- ========================================================
-- Appointy - Seed Data
-- ========================================================

USE appointy_db;

-- Clear existing data (in reverse order of foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE appointments;
TRUNCATE TABLE doctors;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Users (Admin, Doctors, Patients)
-- Passwords:
-- Admin: Admin@123   -> $2a$10$/0xenDzz6vYpqrIKkOEPaudEWF6F2Ei9SqDFPP/UHqYS.qTdCsU4a
-- Doctor: Doctor@123 -> $2a$10$v5/ht/K/jHBfdc.uZD6cfOm5b1KF7wlL1eZGZ6ydAo5aMolEmRXta
-- Patient: Patient@123 -> $2a$10$zLfPwT3RxKPaHQLPqNvuheRe0p3oTZ3DoZqJEpqdoSjkQPLiNrHke

INSERT INTO users (id, name, email, password, role, phone, gender, dob) VALUES
-- Admin (ID: 1)
(1, 'System Administrator', 'admin@appointy.com', '$2a$10$/0xenDzz6vYpqrIKkOEPaudEWF6F2Ei9SqDFPP/UHqYS.qTdCsU4a', 'admin', '+1 555-0100', 'Not Selected', '1990-01-01'),

-- Doctors (IDs: 2 - 7)
(2, 'Dr. Richard James', 'richard@appointy.com', '$2a$10$v5/ht/K/jHBfdc.uZD6cfOm5b1KF7wlL1eZGZ6ydAo5aMolEmRXta', 'doctor', '+1 555-0101', 'Male', '1982-04-12'),
(3, 'Dr. Emily Larson', 'emily@appointy.com', '$2a$10$v5/ht/K/jHBfdc.uZD6cfOm5b1KF7wlL1eZGZ6ydAo5aMolEmRXta', 'doctor', '+1 555-0102', 'Female', '1986-09-24'),
(4, 'Dr. Christopher Lee', 'christopher@appointy.com', '$2a$10$v5/ht/K/jHBfdc.uZD6cfOm5b1KF7wlL1eZGZ6ydAo5aMolEmRXta', 'doctor', '+1 555-0103', 'Male', '1979-11-15'),
(5, 'Dr. Sarah Patel', 'sarah@appointy.com', '$2a$10$v5/ht/K/jHBfdc.uZD6cfOm5b1KF7wlL1eZGZ6ydAo5aMolEmRXta', 'doctor', '+1 555-0104', 'Female', '1988-06-30'),
(6, 'Dr. Michael Chen', 'michael@appointy.com', '$2a$10$v5/ht/K/jHBfdc.uZD6cfOm5b1KF7wlL1eZGZ6ydAo5aMolEmRXta', 'doctor', '+1 555-0105', 'Male', '1984-02-18'),
(7, 'Dr. Olivia Wilson', 'olivia@appointy.com', '$2a$10$v5/ht/K/jHBfdc.uZD6cfOm5b1KF7wlL1eZGZ6ydAo5aMolEmRXta', 'doctor', '+1 555-0106', 'Female', '1985-08-09'),

-- Patients (IDs: 8 - 10)
(8, 'Jane Doe', 'patient@appointy.com', '$2a$10$zLfPwT3RxKPaHQLPqNvuheRe0p3oTZ3DoZqJEpqdoSjkQPLiNrHke', 'patient', '+1 555-0201', 'Female', '1995-07-14'),
(9, 'Alex Johnson', 'alex@example.com', '$2a$10$zLfPwT3RxKPaHQLPqNvuheRe0p3oTZ3DoZqJEpqdoSjkQPLiNrHke', 'patient', '+1 555-0202', 'Male', '1992-03-22'),
(10, 'Sophia Martinez', 'sophia@example.com', '$2a$10$zLfPwT3RxKPaHQLPqNvuheRe0p3oTZ3DoZqJEpqdoSjkQPLiNrHke', 'patient', '+1 555-0203', 'Female', '1998-12-05');

-- 2. Insert Doctors Profile
INSERT INTO doctors (id, user_id, specialization, degree, experience, about, fees, address_line1, address_line2, image, available, is_approved) VALUES
(1, 2, 'General physician', 'MBBS, MD (Medicine)', '4 Years', 'Dr. Richard has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective healthcare strategies.', 500.00, '57th Cross, Richmond Road', 'Circle, Bangalore, KA', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80', 1, 1),
(2, 3, 'Gynecologist', 'MBBS, MS (OBG)', '5 Years', 'Dr. Emily Larson specializes in women''s reproductive health, prenatal care, and modern gynecological treatments with over 5 years of compassionate clinical practice.', 600.00, '23rd Boulevard, Central Plaza', 'Sector 4, New Delhi', 'https://images.unsplash.com/photo-1594824813589-39f881f196a6?w=400&auto=format&fit=crop&q=80', 1, 1),
(3, 4, 'Dermatologist', 'MBBS, MD (Dermatology)', '8 Years', 'Dr. Christopher Lee is an experienced dermatologist offering advanced clinical and cosmetic solutions for skin, hair, and nail health.', 750.00, '7th Avenue, Medical Hub', 'Downtown, Mumbai, MH', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80', 1, 1),
(4, 5, 'Pediatricians', 'MBBS, DCH', '6 Years', 'Dr. Sarah Patel is dedicated to infant, child, and adolescent wellness, routine vaccinations, nutrition guidance, and childhood developmental milestones.', 550.00, '12 Parkview Lane', 'Koramangala, Bangalore, KA', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80', 1, 1),
(5, 6, 'Neurologist', 'MBBS, DM (Neurology)', '10 Years', 'Dr. Michael Chen specializes in neurological disorders, headaches, spine conditions, and neuro-rehabilitation using evidence-based medical techniques.', 900.00, '88 Sterling Heights, West Wing', 'Bandra West, Mumbai, MH', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80', 1, 1),
(6, 7, 'Gastroenterologist', 'MBBS, DM (Gastro)', '7 Years', 'Dr. Olivia Wilson provides specialized diagnosis and therapeutic care for digestive system health, liver conditions, and gastrointestinal endoscopy.', 800.00, '44 Lakeview Medical Center', 'Indiranagar, Bangalore, KA', 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80', 1, 1);

-- 3. Insert Sample Appointments
INSERT INTO appointments (id, patient_id, doctor_id, slot_date, slot_time, amount, status, payment_status, notes) VALUES
(1, 8, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00 AM', 500.00, 'confirmed', 'paid', 'Routine health checkup and blood pressure monitoring'),
(2, 9, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '02:30 PM', 600.00, 'pending', 'paid', 'First-time consultation'),
(3, 10, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:00 AM', 750.00, 'confirmed', 'paid', 'Skin allergy follow-up'),
(4, 8, 4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '04:00 PM', 550.00, 'completed', 'paid', 'Child vaccination review'),
(5, 9, 5, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '03:00 PM', 900.00, 'completed', 'paid', 'Migraine consultation');
