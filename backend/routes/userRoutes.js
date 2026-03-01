import express from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getTeachersByDomain,
    getAllSupervisors,
    uploadSupervisors,
    searchStudents
} from '../controllers/userController.js';
import { checkToken, checkRole } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public/Student accessible routes
router.get('/teachers/by-domain/:domain', checkToken, getTeachersByDomain);
router.get('/supervisors', checkToken, getAllSupervisors);
router.get('/students/search/:regNum', checkToken, searchStudents);

// Coordinator only routes
router.get('/', checkToken, checkRole('coordinator'), getAllUsers);
router.post('/upload-supervisors', checkToken, checkRole('coordinator'), upload.single('file'), uploadSupervisors);
router.get('/:id', checkToken, checkRole('coordinator'), getUserById);
router.post('/', checkToken, checkRole('coordinator'), createUser);
router.put('/:id', checkToken, checkRole('coordinator'), updateUser);
router.delete('/:id', checkToken, checkRole('coordinator'), deleteUser);

export default router;
