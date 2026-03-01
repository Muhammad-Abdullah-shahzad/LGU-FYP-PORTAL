import express from 'express';
import {
    createTimeline,
    getAllTimelines,
    getActiveTimeline,
    updateTimeline,
    deleteTimeline,
    checkPhaseStatus
} from '../controllers/timelineController.js';
import { checkToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Basic timeline viewing for all authenticated users
router.get('/', checkToken, getAllTimelines);
router.get('/active/:semester', checkToken, getActiveTimeline);
router.get('/check-phase/:phase', checkToken, checkPhaseStatus);

// Coordinator only management routes
router.post('/', checkToken, checkRole('coordinator'), createTimeline);
router.put('/:id', checkToken, checkRole('coordinator'), updateTimeline);
router.delete('/:id', checkToken, checkRole('coordinator'), deleteTimeline);

export default router;
