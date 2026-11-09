> **Live Production Deployment**:
> - 🌐 **Live Website (Vercel)**: [https://frontend-iota-mauve-57.vercel.app](https://frontend-iota-mauve-57.vercel.app)
> - ⚡ **Live API Backend (Render)**: [https://metechq.onrender.com](https://metechq.onrender.com)
> - 📚 **Interactive Swagger Docs**: [https://metechq.onrender.com/docs](https://metechq.onrender.com/docs)
>
> **Project Evidence Documents**: [Evaluation Guide](docs/EVALUATION_GUIDE.md) | [Local Setup Guide](docs/LOCAL_SETUP.md) | [Threat Model & Security](THREATS.md) | [Security Architecture](SECURITY_SETUP.md) | [Prompt History](PROMPTS.md) | [Portfolio & Client Guide](docs/PORTFOLIO_AND_CLIENT_GUIDE.md)

# 🚀 METECHQ – Portfolio & Client Management Platform

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

## 2️⃣ Client Portal Workspace

The client portal provides a dedicated, tenant-isolated workspace for clients to track project progress and collaborate with the agency team.

Clients can:

* View project progress and deliverables
* Track milestones and phased schedules
* Monitor task checklists and statuses
* View project budget summaries and payment terms
* Securely download authorized project deliverables (tenant-token validated)
* Comment on project milestones
* Review audit activity history
* Communicate through real-time per-project chat

This improves **transparency and communication between developers and clients**.

---

## 3️⃣ Admin Management Dashboard

The admin dashboard provides a **centralized control panel** for managing the entire platform.

Admins can:

* View platform analytics
* Manage portfolio projects and showcase case studies
* Publish and edit blog articles
* Manage clients and provision client project workspaces
* Track project milestones and tasks
* Manage testimonials and reviews
* Manage newsletter subscribers
* Configure platform settings and editorial copy
* Upload and manage files with magic-byte validation

This makes the platform suitable for **freelancers, agencies, and service-based businesses**.

---

## 4️⃣ Public Security & Privacy Page (/security)

A public-facing security transparency page explaining authentication realm separation, tenant project isolation, file security, known architectural boundaries (such as localStorage JavaScript access and unkeyed SHA-256 audit chaining limits), and active responsible disclosure contact through the contact form or GitHub advisory.

---

## 5️⃣ Admin Security Center (/admin/security)

A restricted management portal view backed by authenticated endpoint GET /api/admins/security-overview. It presents verified status rows (Verified, Needs attention, Not verified), real-time cryptographic audit trail hash-chain verification (erify_audit_log_chain), and links to code/test evidence.

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

# 🚀 Quick Start & Installation Guide

## ⚡ Option 1: One-Command Concurrent Start (Recommended)
From the project root directory, install and run both backend and frontend simultaneously in a single terminal:

```bash
npm start
```
*(Runs FastAPI backend at `http://127.0.0.1:8002` and React frontend at `http://localhost:3000`)*

---

## 🛠️ Option 2: Step-by-Step Setup (VS Code / Terminal)

### Prerequisites
* **Node.js 18+** & npm / yarn
* **Python 3.10+** & pip
* **Git**

### Terminal 1 — Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Activate Virtual Environment:
# Windows (PowerShell): .env\Scripts\Activate.ps1
# Windows (CMD):        venv\Scripts\activate.bat
# Mac / Linux:          source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn server:app --host 127.0.0.1 --port 8002 --reload
```

### Terminal 2 — Frontend (React)
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

---

# 🌐 Application URLs

| Service | Local URL | Live Production URL |
| :--- | :--- | :--- |
| **Frontend Website** | `http://localhost:3000` | [frontend-iota-mauve-57.vercel.app](https://frontend-iota-mauve-57.vercel.app) |
| **Backend API** | `http://127.0.0.1:8002/api` | [metechq.onrender.com/api](https://metechq.onrender.com/api) |
| **Swagger API Docs** | `http://127.0.0.1:8002/docs` | [metechq.onrender.com/docs](https://metechq.onrender.com/docs) |
| **Admin Panel** | `http://localhost:3000/admin/login` | [frontend-iota-mauve-57.vercel.app/admin/login](https://frontend-iota-mauve-57.vercel.app/admin/login) |
| **Client Portal** | `http://localhost:3000/client/login` | [frontend-iota-mauve-57.vercel.app/client/login](https://frontend-iota-mauve-57.vercel.app/client/login) |

---

# 🔐 Administrator Initialization & Security Bootstrap

Initial super-administrator accounts are **not** created with static or hardcoded passwords.

To bootstrap the initial administrator account securely:
1. Define a strong, unique password in your backend `.env` configuration:
   ```env
   INIT_SUPERADMIN_USERNAME=admin
   INIT_SUPERADMIN_PASSWORD=YourStrongUniquePassword2026!
   ```
2. On initial startup, the backend automatically registers the super-administrator with the salted bcrypt hash of your configured password.
3. In production, configuring `INIT_SUPERADMIN_PASSWORD` is required; startup aborts if it is omitted. In development, if omitted, a temporary random password is generated, but in accordance with the platform's strict zero-logging credential policy, **passwords and secrets are never logged or printed to the console or logs**. Administrators must explicitly configure `INIT_SUPERADMIN_PASSWORD` in their environment or `.env` file.
4. Additional administrators can only be created by an authenticated super-administrator via `/api/admins/create`.

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

# 🧪 Testing & Verification

Comprehensive automated test runner executes tests against an isolated ephemeral MongoDB database:

```bash
# 1. Full isolated backend test runner (121 passed: 72 pytest + 37 admin CRUD + 12 client isolation)
python scripts/run_evaluation_tests.py

# 2. Frontend regression test suite (17 passed)
cd frontend
yarn test --watchAll=false --runInBand

# 3. Frontend production build compilation check
yarn build

# 4. Dependency audits
yarn audit --groups dependencies
cd ..
python -m pip_audit -r backend/requirements.txt
```

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
