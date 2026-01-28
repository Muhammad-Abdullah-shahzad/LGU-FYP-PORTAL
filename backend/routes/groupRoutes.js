import express from 'express';
import {
    createGroup,
    getMyGroup,
    submitProposal,
    submitSRS,
    submitFinalReport,
    updateGroupDetails,
    requestSupervisor,
    getAllGroups,
    getSupervisorGroups,
    getSupervisorRequests,
    respondToSupervisorRequest,
    getSupervisorEvaluations,
    evaluateGroup,
    getInvitations,
    respondToInvitation
} from '../controllers/groupController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Student routes
router.post('/', protect, authorize('student'), createGroup);
router.get('/my-group', protect, authorize('student'), getMyGroup);
router.post('/:id/proposal', protect, authorize('student'), upload.single('proposal'), submitProposal);
router.post('/:id/srs', protect, authorize('student'), upload.single('srs'), submitSRS);
router.post('/:id/final-report', protect, authorize('student'), upload.single('finalReport'), submitFinalReport);
router.put('/:id/details', protect, authorize('student'), updateGroupDetails);
router.post('/:id/request-supervisor', protect, authorize('student'), requestSupervisor);
router.get('/invitations', protect, authorize('student'), getInvitations);
router.put('/:id/invitation-response', protect, authorize('student'), respondToInvitation);

// Supervisor routes
router.get('/supervisor/my-groups', protect, authorize('supervisor'), getSupervisorGroups);
router.get('/supervisor/requests', protect, authorize('supervisor'), getSupervisorRequests);
router.put('/:id/supervisor-response', protect, authorize('supervisor'), respondToSupervisorRequest);
router.get('/supervisor/evaluations', protect, authorize('supervisor'), getSupervisorEvaluations);
router.put('/:id/evaluate', protect, authorize('supervisor'), evaluateGroup);

// Coordinator routes
router.get('/', protect, authorize('coordinator'), getAllGroups);

export default router;
