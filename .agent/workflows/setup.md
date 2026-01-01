---
description: Setup and run the FYP Management System
---

# FYP Management System - Setup Workflow

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Git

## Setup Steps

1. Install backend dependencies
```bash
cd backend
npm install
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Configure environment variables
- Copy `.env.example` to `.env` in backend folder
- Update MongoDB connection string
- Set JWT secret
- Configure email settings (if needed)

4. Seed initial data (optional)
```bash
cd backend
npm run seed
```

5. Start the backend server
```bash
cd backend
npm run dev
```

6. Start the frontend development server
```bash
cd frontend
npm run dev
```

7. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Default Login Credentials (After Seeding)

**FYP Coordinator:**
- Email: coordinator@lgu.edu.pk
- Password: Admin@123

**Supervisor:**
- Email: supervisor1@lgu.edu.pk
- Password: Teacher@123

**Student:**
- Email: student1@lgu.edu.pk
- Password: Student@123

## Troubleshooting

- If MongoDB connection fails, check your connection string
- If ports are in use, update PORT in .env file
- Clear browser cache if UI doesn't load properly