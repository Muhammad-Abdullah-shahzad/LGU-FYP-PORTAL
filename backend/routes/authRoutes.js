import express from 'express';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/authController.js';
import { checkToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', checkToken, getMe);
router.put('/profile', checkToken, updateProfile);
router.put('/change-password', checkToken, changePassword);

export default router;
