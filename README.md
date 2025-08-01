# 🎫 Movie Ticket Booking System (MongoDB Based)

## 📖 Overview

This project is a full-featured **movie ticket booking system** built using **MongoDB** as the backend database. It allows users to sign up, log in, view available movies, select showtimes and seats, and book tickets. Admins can manage movies and bookings through a secure admin panel.

---

## 🔧 Tech Stack

- **MongoDB** – NoSQL Database
- **Node.js / Express.js** *(or PHP if applicable)*
- **HTML5, CSS3, Bootstrap** – UI Design
- **JavaScript** – Client-side interactivity
- **Mongoose** – For MongoDB modeling *(if using Node.js)*
- **Google Login (Demo only)**

---

## ✨ Key Features

### ✅ User Side
- Sign up / Login system
- View list of movies and their showtimes
- Seat selection with visual UI
- Book tickets and receive confirmation
- View past bookings

### 🛡️ Admin Panel
- Secure admin login
- Add, update, or delete movies and showtimes
- Manage seat availability
- View all user bookings

---

## 🧱 MongoDB Collections

- **users** – stores user details (email, name, password, role)
- **movies** – stores movie info, genres, showtimes, etc.
- **bookings** – stores booking data (user, movie, time, seats)
- **admins** – (optional) for admin authentication

---

## 💻 How to Run the Project

### 1. Clone the Repo
```bash
git clone https://github.com/akshayappekat/ticket-booking-system.
