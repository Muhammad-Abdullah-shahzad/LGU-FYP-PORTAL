# 🧪 API Testing Guide

Quick reference for testing all API endpoints manually.

## Base URL
```
http://localhost:5000/api
```

## Authentication Required?
- 🔓 Public endpoints (no token needed)
- 🔐 Protected endpoints (token required)

---

## 🔐 Authentication Endpoints

### 1. Register User (🔓 Public)
```powershell
$body = @{
    email = "test@lgu.edu.pk"
    password = "password123"
    role = "student"
    firstName = "Test"
    lastName = "User"
    registrationNumber = "L1F21BSCS0999"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### 2. Login (🔓 Public)
```powershell
$body = @{
    email = "coordinator@lgu.edu.pk"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

### 3. Get Current User (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method GET -Headers $headers
```

### 4. Update Profile (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    firstName = "Updated"
    lastName = "Name"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

---

## 👥 User Management Endpoints

### 1. Get All Users (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

# All users
Invoke-RestMethod -Uri "http://localhost:5000/api/users" -Method GET -Headers $headers

# Filter by role
Invoke-RestMethod -Uri "http://localhost:5000/api/users?role=student" -Method GET -Headers $headers

# Filter by domain
Invoke-RestMethod -Uri "http://localhost:5000/api/users?domain=Software Engineering" -Method GET -Headers $headers
```

### 2. Get User by ID (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$userId = "USER_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:5000/api/users/$userId" -Method GET -Headers $headers
```

### 3. Create User (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    email = "newsupervisor@lgu.edu.pk"
    password = "password123"
    role = "supervisor"
    firstName = "New"
    lastName = "Supervisor"
    domain = "Software Engineering"
    designation = "Assistant Professor"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### 4. Get All Supervisors (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/users/supervisors" -Method GET -Headers $headers
```

### 5. Get Teachers by Domain (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$domain = "Artificial Intelligence"
Invoke-RestMethod -Uri "http://localhost:5000/api/users/teachers/by-domain/$domain" -Method GET -Headers $headers
```

---

## 👨‍👩‍👦 Group Management Endpoints

### 1. Create Group (🔐 Student)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    groupName = "AI Innovators"
    projectTitle = "Smart Traffic Management System"
    domain = "Artificial Intelligence"
    members = @("L1F21BSCS0001", "L1F21BSCS0002")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/groups" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### 2. Get My Group (🔐 Student)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/groups/my-group" -Method GET -Headers $headers
```

### 3. Submit Proposal (🔐 Student)
**Note**: For file upload, use Postman or a similar tool. Here's the structure:
```
POST http://localhost:5000/api/groups/{groupId}/proposal
Headers:
  Authorization: Bearer {token}
Body (multipart/form-data):
  description: "Project description here"
  objectives: "Project objectives here"
  file: [Select PDF file]
```

### 4. Request Supervisor (🔐 Student)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$groupId = "GROUP_ID_HERE"
$body = @{
    supervisorId = "SUPERVISOR_ID_HERE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/groups/$groupId/request-supervisor" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### 5. Get All Groups (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/groups" -Method GET -Headers $headers
```

### 6. Get Supervisor's Groups (🔐 Supervisor)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/groups/supervisor/my-groups" -Method GET -Headers $headers
```

### 7. Get Supervisor Requests (🔐 Supervisor)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/groups/supervisor/requests" -Method GET -Headers $headers
```

### 8. Respond to Supervisor Request (🔐 Supervisor)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$groupId = "GROUP_ID_HERE"
$body = @{
    status = "approved"  # or "rejected"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/groups/$groupId/supervisor-response" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

---

## 🎓 Defense Panel Endpoints

### 1. Create Panel (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    panelName = "AI Defense Panel"
    type = "proposal"  # or "mid", "final"
    semester = 8
    date = "2025-03-01"
    members = @("PANEL_MEMBER_ID_1", "PANEL_MEMBER_ID_2")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/panels" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### 2. Get All Panels (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

# All panels
Invoke-RestMethod -Uri "http://localhost:5000/api/panels" -Method GET -Headers $headers

# Filter by type
Invoke-RestMethod -Uri "http://localhost:5000/api/panels?type=proposal" -Method GET -Headers $headers

# Filter by semester
Invoke-RestMethod -Uri "http://localhost:5000/api/panels?semester=8" -Method GET -Headers $headers
```

### 3. Get Panel by ID (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$panelId = "PANEL_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:5000/api/panels/$panelId" -Method GET -Headers $headers
```

### 4. Schedule Defense (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$panelId = "PANEL_ID_HERE"
$body = @{
    groupId = "GROUP_ID_HERE"
    timeSlot = @{
        startTime = "09:00"
        endTime = "09:30"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/panels/$panelId/schedule" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### 5. Get Panel Member's Panels (🔐 Panel Member)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/panels/member/my-panels" -Method GET -Headers $headers
```

### 6. Get Panel for Group (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$groupId = "GROUP_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:5000/api/panels/group/$groupId" -Method GET -Headers $headers
```

---

## 📅 Timeline Endpoints

### 1. Create Timeline (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    academicYear = "2024-2025"
    semester = 8
    groupFormationStart = "2025-01-15"
    groupFormationEnd = "2025-01-31"
    proposalSubmissionStart = "2025-02-01"
    proposalSubmissionEnd = "2025-02-21"
    proposalDefenseStart = "2025-02-22"
    proposalDefenseEnd = "2025-03-07"
    midDefenseStart = "2025-04-01"
    midDefenseEnd = "2025-04-14"
    finalDefenseStart = "2025-05-15"
    finalDefenseEnd = "2025-05-31"
    isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/timeline" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### 2. Get All Timelines (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

# All timelines
Invoke-RestMethod -Uri "http://localhost:5000/api/timeline" -Method GET -Headers $headers

# Filter by academic year
Invoke-RestMethod -Uri "http://localhost:5000/api/timeline?academicYear=2024-2025" -Method GET -Headers $headers

# Filter by semester
Invoke-RestMethod -Uri "http://localhost:5000/api/timeline?semester=8" -Method GET -Headers $headers
```

### 3. Get Active Timeline (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$semester = 8
Invoke-RestMethod -Uri "http://localhost:5000/api/timeline/active/$semester?academicYear=2024-2025" -Method GET -Headers $headers
```

### 4. Update Timeline (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$timelineId = "TIMELINE_ID_HERE"
$body = @{
    groupFormationEnd = "2025-02-05"
    isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/timeline/$timelineId" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

### 5. Delete Timeline (🔐 Coordinator)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$timelineId = "TIMELINE_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:5000/api/timeline/$timelineId" -Method DELETE -Headers $headers
```

### 6. Check Phase Status (🔐 Protected)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$phase = "groupFormation"  # or proposalSubmission, proposalDefense, midDefense, finalDefense
Invoke-RestMethod -Uri "http://localhost:5000/api/timeline/check-phase/$phase?academicYear=2024-2025&semester=8" -Method GET -Headers $headers
```

---

## 🧪 Complete Testing Workflow

### 1. Setup
```powershell
# First, run the seeder
cd backend
npm run seed

# Start the server
npm run dev
```

### 2. Login as Coordinator
```powershell
$body = @{
    email = "coordinator@lgu.edu.pk"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$coordinatorToken = $response.token
```

### 3. Login as Student
```powershell
$body = @{
    email = "student1@lgu.edu.pk"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$studentToken = $response.token
```

### 4. Login as Supervisor
```powershell
$body = @{
    email = "supervisor1@lgu.edu.pk"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$supervisorToken = $response.token
```

### 5. Test Student Flow
```powershell
# Use student token
$headers = @{
    Authorization = "Bearer $studentToken"
}

# Create group
$body = @{
    groupName = "Test Group"
    projectTitle = "Test Project"
    domain = "Software Engineering"
    members = @("L1F21BSCS0001", "L1F21BSCS0002")
} | ConvertTo-Json

$group = Invoke-RestMethod -Uri "http://localhost:5000/api/groups" -Method POST -Headers $headers -Body $body -ContentType "application/json"
$groupId = $group.group._id

# Get supervisors list
$supervisors = Invoke-RestMethod -Uri "http://localhost:5000/api/users/supervisors" -Method GET -Headers $headers
$supervisorId = $supervisors.supervisors[0]._id

# Request supervisor
$body = @{
    supervisorId = $supervisorId
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/groups/$groupId/request-supervisor" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### 6. Test Supervisor Flow
```powershell
# Use supervisor token
$headers = @{
    Authorization = "Bearer $supervisorToken"
}

# Get requests
$requests = Invoke-RestMethod -Uri "http://localhost:5000/api/groups/supervisor/requests" -Method GET -Headers $headers

# Approve request
$requestGroupId = $requests.groups[0]._id
$body = @{
    status = "approved"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/groups/$requestGroupId/supervisor-response" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

---

## 💡 Tips

1. **Save tokens**: Store tokens in variables for reuse
2. **Use Postman**: For file uploads and better visualization
3. **Check responses**: Always verify the response structure
4. **Error handling**: Check status codes and error messages
5. **Test systematically**: Follow the workflow order

## 🔍 Debugging

```powershell
# Check server logs in the terminal where npm run dev is running

# Pretty print JSON responses
$response | ConvertTo-Json -Depth 10

# Check MongoDB data
# Use MongoDB Compass: mongodb://localhost:27017
# Database: fyp_management
```

---

**For more details, see**: `README.md` and `QUICKSTART.md`
