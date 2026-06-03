# EquipReserve

## Project Description
EquipReserve is a modular reservation and asset tracking system designed for institutions that manage shared technical equipment — VR headsets, AR glasses, motion trackers, robotics, lab devices, and more.

It allows students, staff, and admins to:
- Browse available equipment and make time-based reservations
- Check equipment in and out via QR code scanning
- Track the full lifecycle of every physical unit — from booking to return
- Receive email notifications for reservation confirmations, reminders, and overdue alerts
- Manage equipment condition, status, and audit logs through an admin dashboard

## Live Demo
*****************************

## Team
- Janne Kumpuoja (Supervisor)
- Diem Tran (Student)
- Thi Dinh (Student)
- Upeksha Eshani (Student)
- Ruvindra Nimshani (Student)

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL |
| **Authentication** | ********|
| **QR Scanning** | QR code generation + browser-based scan |
| **Email** | ********* |

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

## Database Schema
The database consists of five core tables and supporting enums.

<img width="1200" height="984" alt="ER-diagram" src="https://github.com/user-attachments/assets/5b60803f-610a-4e65-b333-fde12f62c93d" />
