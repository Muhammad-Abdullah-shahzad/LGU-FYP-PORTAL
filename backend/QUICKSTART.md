# 🚀 Quick Start Guide - FYP Management System Backend

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v16+)
- ✅ MongoDB installed and running
- ✅ npm packages installed

## Step-by-Step Setup

### 1. Install MongoDB (if not installed)

**Option A: MongoDB Community Edition**
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run as a Windows service automatically

**Option B: MongoDB Compass** (Recommended for beginners)
1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. It includes MongoDB server and GUI

### 2. Start MongoDB

Check if MongoDB is running:
```powershell
Get-Service -Name MongoDB
```

If not running, start it:
```powershell
net start MongoDB
```

### 3. Configure Environment

The `.env` file has been created with default settings:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fyp_management
JWT_SECRET=fyp_lgu_super_secret_jwt_key_2024_change_in_production
```

**⚠️ Important:** Change `JWT_SECRET` before deploying to production!

### 4. Seed the Database

Populate the database with sample data:
```powershell
npm run seed
```

This creates:
- 1 Coordinator
- 3 Supervisors
- 2 Panel Members
- 4 Students
- 1 Active Timeline

### 5. Start the Server

**Development mode** (with auto-reload):
```powershell
npm run dev
```

**Production mode**:
```powershell
npm start
```

The server will start on: `http://localhost:5000`

### 6. Test the API

**Option A: Browser**
Visit: http://localhost:5000

You should see:
```json
{
  "message": "FYP Management System API is running"
}
```

**Option B: Postman**
1. Import `FYP-API.postman_collection.json`
2. Try the login endpoint with:
   - Email: `coordinator@lgu.edu.pk`
   - Password: `password123`

**Option C: cURL**
```powershell
curl http://localhost:5000/api/auth/login -Method POST -H "Content-Type: application/json" -Body '{"email":"coordinator@lgu.edu.pk","password":"password123"}'
```

## Sample Credentials

After running the seeder:

| Role | Email | Password |
|------|-------|----------|
| Coordinator | coordinator@lgu.edu.pk | password123 |
| Supervisor | supervisor1@lgu.edu.pk | password123 |
| Student | student1@lgu.edu.pk | password123 |

## API Documentation

All endpoints are available at:
- **Base URL**: `http://localhost:5000/api`

### Main Routes:
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/groups` - FYP groups
- `/api/panels` - Defense panels
- `/api/timeline` - Academic timeline

See `README.md` for complete API documentation.

## Troubleshooting

### MongoDB Connection Error

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
1. Check if MongoDB is running: `Get-Service -Name MongoDB`
2. Start MongoDB: `net start MongoDB`
3. Verify connection: Try connecting with MongoDB Compass to `mongodb://localhost:27017`

### Port 5000 Already in Use

**Solution**:
1. Change `PORT` in `.env` file
2. Or find and kill the process:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
   ```

### Module Not Found Errors

**Solution**:
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

### JWT Token Issues

**Solution**:
- Ensure `JWT_SECRET` is set in `.env`
- Token expires after 30 days by default
- Get a new token by logging in again

## File Upload Testing

To test file uploads (proposals, documents):

1. Use Postman or a similar tool
2. Send `multipart/form-data` request
3. Maximum file size: 10MB
4. Allowed types: PDF, DOC, DOCX, PPT, PPTX

## Next Steps

1. ✅ Start the backend server
2. 🔨 Build the frontend (React/Vue/etc.)
3. 🧪 Test all endpoints
4. 📱 Integrate frontend with backend
5. 🚀 Deploy to production

## Development Workflow

1. Make changes to code
2. Nodemon will auto-reload (in dev mode)
3. Test endpoints with Postman
4. Check MongoDB with Compass
5. Review logs in terminal

## Production Deployment

Before deploying:
- [ ] Change `JWT_SECRET` to a strong secret
- [ ] Set `NODE_ENV=production`
- [ ] Use a production MongoDB (MongoDB Atlas)
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up environment variables on hosting platform
- [ ] Configure file upload to cloud storage (S3, etc.)

## Support

For issues:
1. Check console logs
2. Verify MongoDB connection
3. Check `.env` configuration
4. Review API documentation
5. Test with Postman collection

---

**Happy Coding! 🎉**
