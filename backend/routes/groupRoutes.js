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
    getSupervisorGroupDetails,
    getSupervisorRequests,
    respondToSupervisorRequest,
    getSupervisorEvaluations,
    evaluateGroup,
    respondToDefenseApproval,
    getInvitations,
    respondToInvitation,
    rejoinBatch
} from '../controllers/groupController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// General routes
router.get('/', protect, authorize('coordinator'), getAllGroups);
router.get('/invitations', protect, authorize('student'), getInvitations);
router.put('/:id/invitation-response', protect, authorize('student'), respondToInvitation);

// Supervisor Routes
router.get('/supervisor/my-groups', protect, authorize('supervisor'), getSupervisorGroups);
router.get('/supervisor/requests', protect, authorize('supervisor'), getSupervisorRequests);
router.get('/supervisor/evaluations', protect, authorize('supervisor', 'faculty'), getSupervisorEvaluations);
router.get('/supervisor/:id/details', protect, authorize('supervisor'), getSupervisorGroupDetails);
router.put('/:id/supervisor-response', protect, authorize('supervisor'), respondToSupervisorRequest);
router.put('/:id/defense-approval', protect, authorize('supervisor'), respondToDefenseApproval);
router.put('/:id/evaluate', protect, authorize('supervisor', 'faculty'), evaluateGroup);

// Student Routes
router.post('/', protect, authorize('student'), createGroup);
router.get('/my-group', protect, authorize('student'), getMyGroup);
router.post('/:id/request-supervisor', protect, authorize('student'), requestSupervisor);
router.post('/:id/proposal', upload.single('proposal'), protect, authorize('student'), submitProposal);
router.post('/:id/srs', upload.single('srs'), protect, authorize('student'), submitSRS);
router.post('/:id/final-report', upload.single('finalReport'), protect, authorize('student'), submitFinalReport);
router.put('/:id/details', protect, authorize('student'), updateGroupDetails);
router.post('/:id/rejoin', protect, authorize('student'), rejoinBatch);

export default router;
