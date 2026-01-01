import express from 'express';
import {
    createGroup,
    getMyGroup,
    submitProposal,
    requestSupervisor,
    getAllGroups,
    getSupervisorGroups,
    getSupervisorRequests,
    respondToSupervisorRequest
} from '../controllers/groupController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Student routes
router.post('/', protect, authorize('student'), createGroup);
router.get('/my-group', protect, authorize('student'), getMyGroup);
router.post('/:id/proposal', protect, authorize('student'), upload.single('proposal'), submitProposal);
router.post('/:id/request-supervisor', protect, authorize('student'), requestSupervisor);

// Supervisor routes
router.get('/supervisor/my-groups', protect, authorize('supervisor'), getSupervisorGroups);
router.get('/supervisor/requests', protect, authorize('supervisor'), getSupervisorRequests);
router.put('/:id/supervisor-response', protect, authorize('supervisor'), respondToSupervisorRequest);

// Coordinator routes
router.get('/', protect, authorize('coordinator'), getAllGroups);

export default router;
