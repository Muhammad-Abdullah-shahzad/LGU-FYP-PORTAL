# FYP Management System - Backend API

A comprehensive backend system for managing Final Year Projects (FYP) at Lahore Garrison University.

## 📋 Features

### User Management
- **Multi-role authentication**: Student, Supervisor, Panel Member, Coordinator
- **JWT-based authentication**
- **Profile management**
- **Role-based access control**

### Group Management
- **Student groups** with 2-4 members
- **Project proposal submission**
- **Supervisor request/approval system**
- **Group member management**

### Defense Panel System
- **Panel creation and management**
- **Time slot management**
- **Defense scheduling**
- **Panel member assignment**

### Timeline Management
- **Academic year and semester-based timelines**
- **Phase management** (group formation, proposal submission, etc.)
- **Automatic phase validation**

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Security**: bcryptjs for password hashing
- **Validation**: express-validator

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── groupController.js   # Group operations
│   ├── panelController.js   # Defense panel management
│   └── timelineController.js # Timeline operations
├── middleware/
│   ├── auth.js              # JWT auth & role verification
│   └── uploadMiddleware.js  # File upload handling
├── models/
│   ├── User.js              # User schema
│   ├── Group.js             # Group schema
│   ├── DefensePanel.js      # Panel schema
│   └── Timeline.js          # Timeline schema
├── routes/
│   ├── authRoutes.js        # /api/auth
│   ├── userRoutes.js        # /api/users
│   ├── groupRoutes.js       # /api/groups
│   ├── panelRoutes.js       # /api/panels
│   └── timelineRoutes.js    # /api/timeline
├── uploads/                  # File storage
├── .env                     # Environment variables
├── .env.example             # Example env file
├── server.js                # Entry point
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Update the values as needed:
   ```env
   MONGODB_URI=mongodb://localhost:27017/fyp_management
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

3. **Ensure MongoDB is running**:
   ```bash
   # For Windows (if installed as service)
   net start MongoDB
   
   # Or use MongoDB Compass to start it
   ```

4. **Run the server**:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Seed initial data** (optional):
   ```bash
   npm run seed
   ```

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user (Protected)
- `PUT /profile` - Update profile (Protected)

### Users (`/api/users`)
- `GET /` - Get all users (Coordinator)
- `GET /:id` - Get user by ID (Coordinator)
- `POST /` - Create user (Coordinator)
- `PUT /:id` - Update user (Coordinator)
- `DELETE /:id` - Deactivate user (Coordinator)
- `GET /teachers/by-domain/:domain` - Get teachers by domain
- `GET /supervisors` - Get all supervisors

### Groups (`/api/groups`)
- `POST /` - Create group (Student)
- `GET /my-group` - Get student's group (Student)
- `POST /:id/proposal` - Submit proposal (Student)
- `POST /:id/request-supervisor` - Request supervisor (Student)
- `GET /` - Get all groups (Coordinator)
- `GET /supervisor/my-groups` - Get supervisor's groups (Supervisor)
- `GET /supervisor/requests` - Get supervision requests (Supervisor)
- `PUT /:id/supervisor-response` - Approve/reject request (Supervisor)

### Defense Panels (`/api/panels`)
- `POST /` - Create panel (Coordinator)
- `GET /` - Get all panels (Coordinator)
- `GET /:id` - Get panel by ID
- `POST /:id/schedule` - Schedule defense (Coordinator)
- `GET /member/my-panels` - Get panel member's panels
- `GET /group/:groupId` - Get panel for group

### Timeline (`/api/timeline`)
- `POST /` - Create timeline (Coordinator)
- `GET /` - Get all timelines
- `GET /active/:semester` - Get active timeline
- `PUT /:id` - Update timeline (Coordinator)
- `DELETE /:id` - Delete timeline (Coordinator)
- `GET /check-phase/:phase` - Check if phase is active

## 🔑 User Roles

1. **Student**: Create groups, submit proposals, request supervisors
2. **Supervisor**: Manage supervision requests, oversee groups
3. **Panel Member**: Participate in defense panels
4. **Coordinator**: Full system access, manage users, groups, panels, timelines

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/fyp_management` |
| `JWT_SECRET` | JWT signing key | `your_secret_key` |
| `JWT_EXPIRE` | Token expiration | `30d` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- CORS protection
- Input validation
- File upload restrictions

## 📦 File Upload

- **Supported file types**: PDF, DOC, DOCX, PPT, PPTX
- **Max file size**: 10MB (configurable)
- **Storage**: Local filesystem (`/uploads` directory)
- **Access**: Files served via `/uploads` route

## 🧪 Testing

You can test the API using:
- **Postman**: Import endpoints and test
- **Thunder Client** (VS Code extension)
- **cURL** commands

Example:
```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@lgu.edu.pk",
    "password": "password123",
    "role": "student",
    "firstName": "John",
    "lastName": "Doe",
    "registrationNumber": "L1F20BSCS0001"
  }'
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `net start MongoDB`
- Check connection string in `.env`
- Verify MongoDB is accessible on `localhost:27017`

### Port Already in Use
- Change `PORT` in `.env` file
- Kill process using port: `netstat -ano | findstr :5000`

### File Upload Fails
- Check `uploads/` directory exists
- Verify file size limits
- Check file type restrictions in `uploadMiddleware.js`

## 📄 License

This project is part of LGU's FYP Management System.

## 👥 Support

For issues or questions, contact the development team.
