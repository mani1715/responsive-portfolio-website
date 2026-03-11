# 🚀 MSPN DEV – Portfolio & Client Management Platform

A **full stack portfolio and agency management platform** designed for developers, freelancers, and software agencies. The system includes a **public portfolio website**, a **powerful admin dashboard**, and a **secure client portal** for managing projects and client communication.

This platform demonstrates how modern agencies can showcase their work while also managing **client relationships, project progress, and content** from a single system.

---

# 🌐 Platform Overview

The application consists of **three major systems**:

## 1️⃣ Public Portfolio Website

A modern portfolio website where visitors can explore the agency's services, projects, and content.

Visitors can:

* Explore services offered by the agency
* View portfolio projects and case studies
* Read blog articles
* See testimonials from clients
* Contact the agency through a contact form
* Subscribe to newsletters
* Interact with the live chat widget

---

## 2️⃣ Admin Management Dashboard

The admin dashboard provides a **centralized control panel** for managing the entire platform.

Admins can:

* View platform analytics
* Manage portfolio projects
* Publish and edit blog articles
* Manage clients and their projects
* Track project milestones and tasks
* Manage testimonials
* Manage newsletter subscribers
* Configure platform settings
* Upload and manage files

This makes the platform suitable for **freelancers, agencies, and service-based businesses**.

---

## 3️⃣ Client Portal

The client portal provides a **secure space for clients** to track project progress and collaborate with the development team.

Clients can:

* View project progress
* Track milestones
* Monitor tasks
* View project budgets
* Download shared files
* Comment on tasks
* View activity history
* Communicate through per-project chat

This improves **transparency and communication between developers and clients**.

---

# ✨ Key Features

## Public Website

* Responsive portfolio website
* Services showcase
* Portfolio gallery with project details
* Blog publishing system
* Testimonials display
* Contact form
* Newsletter subscription
* Live chat integration

## Admin Dashboard

* Analytics and activity overview
* Portfolio management system
* Blog editor with markdown support
* Client management system
* Project tracking with milestones
* Task management
* Meeting booking system
* Testimonials manager
* Newsletter subscriber management
* File storage and uploads

## Client Portal

* Secure client authentication
* Client dashboard
* Project progress tracking
* Milestone management
* Task collaboration
* Budget tracking
* File sharing and downloads
* Comment system
* Activity logs
* Real-time communication features

---

# 🧩 Demo Showcase Modules

The platform includes demo portfolio examples such as:

* E-commerce Platform
* Corporate Business Website
* Learning Management System (LMS)
* Restaurant Booking System
* SaaS Landing Page
* Mobile Design System
* Real-Time Analytics Dashboard
* Social Media Management Tool

These demos demonstrate the **types of projects an agency can deliver**.

---

# 🛠️ Technology Stack

## Backend

* Framework: FastAPI
* Database: MongoDB
* Authentication: JWT
* Validation: Pydantic
* Server: Uvicorn

## Frontend

* Framework: React 18
* Routing: React Router
* Styling: Tailwind CSS
* Forms: React Hook Form + Zod
* HTTP Client: Axios
* State Management: React Context API

## Database

* MongoDB (Motor async driver)

---

# 📁 Project Structure

/app
├── backend
│   ├── server.py
│   ├── database.py
│   ├── auth
│   ├── routes
│   ├── models
│   ├── schemas
│   ├── utils
│   └── scripts
│
├── frontend
│   ├── public
│   └── src
│       ├── pages
│       ├── components
│       ├── admin
│       ├── services
│       └── context
│
├── docs
│   ├── architecture
│   ├── deployment
│   └── api
│
├── tests
│   ├── backend
│   └── integration
│
└── README.md

---

# 🚀 Installation Guide

## Prerequisites

* Python 3.10+
* Node.js 18+
* MongoDB (Local or MongoDB Atlas)
* Yarn package manager

---

## Backend Setup

cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

uvicorn server:app --host 0.0.0.0 --port 8001 --reload

---

## Frontend Setup

cd frontend

yarn install
yarn start

---

# 🌐 Application URLs

Frontend
http://localhost:3000

Backend API
http://localhost:8001/api

Admin Panel
http://localhost:3000/admin/login

Client Portal
http://localhost:3000/client/login

---

# 🔐 Default Admin Credentials

Username:
admin

Password:
admin123

⚠️ Change these credentials in production.

---

# 🚢 Deployment

## Backend Deployment

Recommended platforms:

* Render
* Railway
* AWS
* DigitalOcean

Start command:

uvicorn server:app --host 0.0.0.0 --port $PORT

---

## Frontend Deployment

Recommended platforms:

* Vercel
* Netlify
* AWS S3 + CloudFront

Build command:

yarn build

Output directory:

build

---

# 🧪 Testing

Backend tests:

pytest

Frontend tests:

yarn test

---

# 🎯 Use Cases

This platform is suitable for:

* Freelance developers
* Web development agencies
* Software companies
* Portfolio showcase platforms
* Client project management systems

---

# 📌 Project Status

Status: Production Ready
Version: 1.0.0
