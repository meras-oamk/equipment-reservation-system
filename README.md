<img width="100" height="100" alt="Logo" src="https://github.com/user-attachments/assets/1aa57900-ae05-4757-8e4a-fa224b825bc7" />


## Project Description
EquipReserve is a modular reservation and asset tracking system designed for institutions that manage shared technical equipment — VR headsets, AR glasses, motion trackers, robotics, lab devices, and more.

It allows students, staff, and admins to:
- Browse available equipment and make time-based reservations
- Check equipment in and out via QR code scanning
- Track the full lifecycle of every physical unit — from booking to return
- Receive email notifications for reservation confirmations, reminders, and overdue alerts
- Manage equipment condition, status, and audit logs through an admin dashboard

## Team
- Janne Kumpuoja (Supervisor)
- Diem Tran (Student)
- Thi Dinh (Student)
- Upeksha Eshani (Student)
- Ruvindra Nimshani (Student)

## Table of Contents
-   [Features](#features)
-   [Technologies](#technology-stack)
-   [Demonstration](#demonstration)
-   [Setup](#setup)
-   [Database Schema](#database-schema)
-   [Project Structure](#project-structure)

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL |
| **Authentication** | JSON Web Token (jsonwebtoken), bcrypt |
| **QR Scanning** | qrcode, html5-qrcode |
| **Email** | Nodemailer |

## Features

| Feature | Description |
|---|---|
| **Role-based access** | Three roles: `student`, `staff`, `admin` — each with different booking permissions |
| **Equipment catalog** | Browse equipment by category, status, and availability |
| **Time-based reservations** | Book specific equipment types for defined time slots |
| **Unit assignment** | A specific physical unit is assigned to a reservation at checkout |
| **QR code check-in/out** | Scan QR code on physical unit to trigger checkout or return |
| **Admin dashboard** | Full overview of reservations, equipment status, and users |
| **Email notifications** | Confirmation, reminder, and overdue alerts via email |
| **Condition tracking** | Record equipment condition at check-out and return |
| **Audit logging** | Every action on every unit is recorded with before/after state |
| **Booking policies** | Status transitions enforced by reservation lifecycle rules |

## Demonstration
### [View the website](https://reservation-faevbvdgeybqg4fv.swedencentral-01.azurewebsites.net/index.html)

### Landing Page
<img src="./frontend/Assets/landingPage.jpeg" alt="Landing Page" width="260">

### Student / Staff View

| Equipment List | Make a Reservation | My Reservation |
|---|---|---|
| <img src="./frontend/Assets/browsePage.jpeg" alt="Browse Page" width="260"> | <img src="./frontend/Assets/equipmentDetails.jpeg" alt="Equipment Details" width="260"> | <img src="./frontend/Assets/myReservationPage.jpeg" alt="Reservation Page" width="300"> |
| Browse available equipment by category, subcategory, and real-time availability. | Book a specific equipment type by date, time, and pickup location; quantity updates automatically based on that location's stock. | Track all reservations across Inactive, Active, Overdue, and Completed tabs, with actual pickup/return timestamps.(actual timestamps available for desktop view only) | 

| QR code check-in/out |
|---|
| <img src="./frontend/Assets/scanningQr.jpeg" alt="Scanning Qr" width="300"> | 
| Scanning the physical unit's QR code triggers pickup or return within the booked time window. | 

### Admin View

| Dashboard | 
|---|
| <img src="./frontend/Assets/dashboard_admin.jpeg" alt="Admin Dashboard" width="260"> | 
| Overview of equipment utilization, demand trends, category popularity, and pending return requests. |


## Setup
Follow the instructions below to run the web application locally.

### Installation
**1. Clone the repo**
```bash
$ git clone https://github.com/meras-oamk/equipment-reservation-system.git
```

**2. Install dependencies**
```bash
# Install the dependencies for the backend
$ cd backend
$ npm install
```

**3. Set up the database**

This project uses [Neon](https://neon.tech)

Copy `/database/meras.sql` to create tables.

**4. Cloudinary Setup**

Sign up on [Cloudinary](https://cloudinary.com/) to create an account. Once registered, you can find your API key, API secret, and cloud name in your account settings.

**6. Environment variables**

Create `/backend/.env`

Add the following environment variables:
```bash
# PORT to run backend on
PORT=3001
# Connection URL to PostgreSQL database
DATABASE_URL=YOUR_POSTGRES_URL
# Secret key to sign tokens (random string)
JWT_SECRET=YOUR_SECRET_STRING
# Email service configuration
EMAIL_USER=YOUR_EMAIL
EMAIL_PASS=YOUR_PASS
# Cloudinary configuration
CLOUDINARY_API_KEY=API_KEY
CLOUDINARY_API_SECRET=API_SECRET
CLOUDINARY_CLOUD_NAME=CLOUD_NAME
```

**5. Start the server**
```bash
$ npm run dev
```

## Database Schema
The database consists of five core tables and supporting enums.

<img width="1200" height="984" alt="ER-diagram" src="https://github.com/user-attachments/assets/5b60803f-610a-4e65-b333-fde12f62c93d" />

## Project Structure

```
equipment-reservation-system/
│
├── backend/                         # Node.js + Express API server
│   ├── helpers/                     # Shared utility modules
│   │   ├── auth.js                  # JWT authentication middleware
│   │   ├── db.js                    # PostgreSQL connection pool
│   │   ├── hash.js                  # Password hashing (bcrypt)
│   │   └── role.js                  # Role-based access guard middleware
│   │
│   ├── routes/                      # Express route handlers
│   │   ├── equipment.js             # Equipment types & units CRUD
│   │   ├── log.js                   # Equipment audit log endpoints
│   │   ├── overdue_job.js           # Scheduled job — marks overdue reservations
│   │   ├── reservations.js          # Reservation lifecycle endpoints
│   │   └── users.js                 # User management endpoints
│   │
│   ├── index.js                     # Express app entry point & route mounting
│   ├── package.json                 # Backend dependencies & scripts
│   └── package-lock.json            # Locked dependency tree
│
├── database/                        # Database layer
│   └── meras.sql                    # Full PostgreSQL schema (tables, enums, constraints)
│
├── documents/                       # Project documentation assets
│   └── ER-diagram.png               # Entity Relationship Diagram
│
├── frontend/                        # Plain HTML / CSS / JS client
│   ├── assets/                      # Static assets
│   │   └── logo.png                 # ResEquip brand logo
│   │
│   ├── css/                         # Stylesheets
│   │   └── style.css                # Global styles
│   │
│   ├── html/                        # Page templates
│   │   ├── admin/                   # Admin-only pages (dashboard, manage equipment, users)
│   │   ├── user/                    # Student & staff pages (catalog, my reservations)
│   │   ├── index.html                # Landing page
│   │   └── loginOrRegister.html     # Login / register page
│   │
│   └── js/                          # Client-side JavaScript
│       ├── admin/                   # Admin page scripts
│       ├── user/                    # User page scripts
│       ├── auth.js                  # Token storage & auth state management
│       └── loginOrRegister.js       # Login / register form logic
│   
├── .gitignore                       # Git ignored files (node_modules, .env, etc.)
└── README.md                        # Project documentation (this file)
```

## Course

TVT Kesäprojektit-Summer projects 2026

Oulu Universit of Applied Sciences (OAMK)

Sprint period: 13.5 - 15.8.2026


