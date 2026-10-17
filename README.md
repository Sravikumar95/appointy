# Appointy — Doctor Appointment Booking Web Application

Appointy is a full-stack doctor appointment booking platform designed for healthcare clinics and multi-speciality hospital networks. It provides dedicated portals for **Patients**, **Doctors**, and **Administrators**, enabling online discovery of doctors, real-time slot scheduling, simulated interactive UI payment checkout, and full lifecycle appointment management.

---

## 🌟 Key Features

### 🧑‍💼 Patient Portal
- **User Authentication**: Account registration, JWT-authenticated login, and persistent sessions.
- **Doctor Discovery**: Browse doctors filtered by medical speciality (*General Physician, Gynecologist, Dermatologist, Pediatrician, Neurologist, Gastroenterologist*).
- **Search & Filter**: Real-time search by doctor name, qualifications, and symptoms.
- **Profile & Slot Selection**: View doctor details, fees, clinic address, and choose available appointment dates and time slots (prevents double booking).
- **Interactive UI Payment Step**: Seamless checkout simulation displaying consultation fee breakdown and multiple payment choices (*UPI/QR, Credit/Debit Card, Pay at Clinic*).
- **Appointment Management**: View booking history and cancel pending or confirmed visits with instant slot restoration.

### 👨‍⚕️ Doctor Portal
- **Doctor Login**: Secure doctor-specific authentication and authorization.
- **Profile Management**: Update consultation fees, clinic address, biography, experience, and specialization.
- **Profile Photo Upload**: Local file upload powered by Multer with image validation and instant preview.
- **Real-Time Availability**: One-click toggle between "Available" (open for bookings) and "Unavailable".
- **Appointment Scheduling**: Review patient appointments, view patient demographic info, and **Confirm**, **Reject**, or **Mark Completed**.
- **Performance Analytics**: Real-time stats on total earnings, appointment count, and unique patients treated.

### 🛡️ Administrator Portal
- **Admin Dashboard**: System-wide statistics on total doctors, registered patients, total appointments, and financial turnover.
- **Doctor Management**: Onboard new doctors with photos, approve/revoke doctor status, toggle availability, or permanently remove doctor accounts.
- **System-Wide Appointments**: Inspect every appointment across doctors, monitor payment statuses, and cancel any visit.
- **User Directory**: View and search all registered users (patients, doctors, administrators) with role filters.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), Responsive CSS Grid & Flexbox (No Frameworks) |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (with `mysql2/promise` connection pooling) |
| **Authentication** | JSON Web Tokens (JWT) & `bcryptjs` password hashing |
| **Access Control** | Role-Based Access Control (RBAC) middleware (`patient`, `doctor`, `admin`) |
| **File Storage** | `multer` for local image uploads stored under `/uploads/doctors/` |
| **Tooling** | Git, GitHub, Postman, Nodemon |

---

## 📁 Project Folder Structure

```
appointy/
├── .env                         # Environment variables
├── .env.example                 # Template for environment configuration
├── .gitignore                   # Ignored files for version control
├── package.json                 # Project dependencies & npm run scripts
├── server.js                    # Express application entry point
├── schema.sql                   # MySQL database schema (CREATE TABLE)
├── seed.sql                     # Seed dataset with Admin, Doctors, & Patients
├── init-db.js                   # Automated one-step DB creation & seeding script
├── README.md                    # Project documentation
├── config/
│   └── db.js                    # MySQL2 promise connection pool
├── middleware/
│   ├── auth.js                  # JWT extraction, verification & RBAC middleware
│   ├── upload.js                # Multer diskStorage & image validation
│   └── errorHandler.js          # Centralized error handler & 404 middleware
├── controllers/
│   ├── authController.js        # Register, Login, Me endpoints
│   ├── patientController.js     # Doctors, slots, booking, my appointments
│   ├── doctorController.js      # Profile, photo upload, appointments, stats
│   └── adminController.js       # Doctors CRUD, appointments, users directory
├── routes/
│   ├── authRoutes.js            # /api/auth
│   ├── patientRoutes.js         # /api/patient
│   ├── doctorRoutes.js          # /api/doctor
│   └── adminRoutes.js           # /api/admin
├── uploads/
│   └── doctors/                 # Uploaded doctor profile images
├── css/
│   └── style.css                # Global stylesheet & responsive design
├── js/
│   ├── utils.js                 # Central API helper, auth guards, toast notifications
│   └── layout.js                # Dynamic Navbar and Sidebar renderer
├── index.html                   # Patient home & booking portal with UI payment
├── login.html                   # Multi-role authentication portal
├── register.html                # Patient registration page
├── patient/
│   └── dashboard.html           # Dedicated patient dashboard
├── doctor/
│   ├── dashboard.html           # Doctor analytics & recent appointments
│   ├── appointments.html        # Doctor appointment management
│   └── profile.html             # Doctor profile editor & photo upload
└── admin/
    ├── dashboard.html           # Admin analytics dashboard
    ├── doctors-list.html        # Doctor approval, availability, deletion
    ├── add-doctor.html          # Onboard new doctor with image upload
    ├── appointments.html        # Full appointment log
    └── users.html               # All registered users directory
```

---

## ⚡ Setup & Installation

### Prerequisites
1. **Node.js** (v16 or higher)
2. **MySQL Server** (v8.0 or higher, running locally on port `3306`)
3. **Git**

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and adjust your MySQL password:
```env
PORT=4000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=appointy_db
DB_PORT=3306

JWT_SECRET=appointy_jwt_secret_super_secure_key_2026
JWT_EXPIRES_IN=7d

UPLOAD_DIR=uploads/doctors
MAX_FILE_SIZE=5242880
```

### Step 3: Initialize Database & Seed Sample Data
Execute the built-in database setup script:
```bash
npm run init-db
```
This automatically:
- Creates the `appointy_db` database if not present.
- Builds the `users`, `doctors`, and `appointments` tables.
- Seeds default accounts and appointments with secure bcrypt hashes.

### Step 4: Start the Server
- For development with live reload:
  ```bash
  npm run dev
  ```
- For production:
  ```bash
  npm start
  ```

Open your browser and navigate to: **`http://localhost:4000`**

---

## 🔑 Default Login Credentials

| Role | Email | Password | Landing Page |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@appointy.com` | `Admin@123` | `http://localhost:4000/admin/dashboard.html` |
| **Doctor** | `richard@appointy.com` | `Doctor@123` | `http://localhost:4000/doctor/dashboard.html` |
| **Patient** | `patient@appointy.com` | `Patient@123` | `http://localhost:4000/index.html` |

---

## 📡 REST API Reference

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new patient account |
| `POST` | `/api/auth/login` | Public | Authenticate patient, doctor, or admin |
| `GET` | `/api/auth/me` | Authenticated | Fetch current user profile & role |

### 2. Patient Services (`/api/patient`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/patient/doctors` | Public | List approved doctors with filters |
| `GET` | `/api/patient/doctors/:id` | Public | Doctor profile details |
| `GET` | `/api/patient/doctors/:id/slots?date=YYYY-MM-DD` | Public | Query available time slots |
| `POST` | `/api/patient/appointments` | Patient | Book appointment (UI payment simulation) |
| `GET` | `/api/patient/appointments` | Patient | View my booked appointments |
| `PUT` | `/api/patient/appointments/:id/cancel` | Patient | Cancel appointment |

### 3. Doctor Services (`/api/doctor`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/doctor/dashboard` | Doctor | Doctor stats (earnings, appointments, patients) |
| `GET` | `/api/doctor/profile` | Doctor | Fetch profile details |
| `PUT` | `/api/doctor/profile` | Doctor | Update consultation fee, bio, address |
| `POST` | `/api/doctor/profile/photo`| Doctor | Upload doctor photo (`multipart/form-data`) |
| `PUT` | `/api/doctor/availability` | Doctor | Toggle availability |
| `GET` | `/api/doctor/appointments` | Doctor | View patient appointment requests |
| `PUT` | `/api/doctor/appointments/:id/status` | Doctor | Update status (`confirmed`, `cancelled`, `completed`) |

### 4. Admin Services (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin | System statistics & KPIs |
| `GET` | `/api/admin/doctors` | Admin | List all doctors with status |
| `POST` | `/api/admin/doctors` | Admin | Onboard new doctor with photo |
| `PUT` | `/api/admin/doctors/:id/approval` | Admin | Toggle doctor approval |
| `POST` | `/api/admin/change-availability` | Admin | Toggle doctor availability |
| `DELETE` | `/api/admin/doctors/:id` | Admin | Remove doctor and related records |
| `GET` | `/api/admin/appointments` | Admin | View all appointments |
| `PUT` | `/api/admin/appointments/:id/cancel` | Admin | Cancel any appointment |
| `GET` | `/api/admin/users` | Admin | Directory of all users |

---

## 🧪 Postman Testing Quick Start
1. Send `POST http://localhost:4000/api/auth/login` with:
   ```json
   { "email": "admin@appointy.com", "password": "Admin@123", "role": "admin" }
   ```
2. Copy `token` from the JSON response.
3. In subsequent requests, add the header:
   ```
   Authorization: Bearer <your_token>
   ```

---

## 📄 License
This project is licensed under the ISC License.
