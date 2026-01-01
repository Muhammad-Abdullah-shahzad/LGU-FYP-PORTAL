import express from 'express';
import {
    createTimeline,
    getAllTimelines,
    getActiveTimeline,
    updateTimeline,
    deleteTimeline,
    checkPhaseStatus
} from '../controllers/timelineController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Basic timeline viewing for all authenticated users
router.get('/', protect, getAllTimelines);
router.get('/active/:semester', protect, getActiveTimeline);
router.get('/check-phase/:phase', protect, checkPhaseStatus);

// Coordinator only management routes
router.post('/', protect, authorize('coordinator'), createTimeline);
router.put('/:id', protect, authorize('coordinator'), updateTimeline);
router.delete('/:id', protect, authorize('coordinator'), deleteTimeline);

export default router;
