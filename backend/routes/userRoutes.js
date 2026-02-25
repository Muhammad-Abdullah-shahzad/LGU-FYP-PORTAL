import express from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getTeachersByDomain,
    getAllSupervisors,
    uploadSupervisors
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public/Student accessible routes
router.get('/teachers/by-domain/:domain', protect, getTeachersByDomain);
router.get('/supervisors', protect, getAllSupervisors);

// Coordinator only routes
router.get('/', protect, authorize('coordinator'), getAllUsers);
router.post('/upload-supervisors', protect, authorize('coordinator'), upload.single('file'), uploadSupervisors);
router.get('/:id', protect, authorize('coordinator'), getUserById);
router.post('/', protect, authorize('coordinator'), createUser);
router.put('/:id', protect, authorize('coordinator'), updateUser);
router.delete('/:id', protect, authorize('coordinator'), deleteUser);

export default router;
