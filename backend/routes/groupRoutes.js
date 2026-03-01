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
    rejoinBatch,
    assignExternalSupervisor,
    submitExternalEvaluation,
    getExternalSupervisorGroups
} from '../controllers/groupController.js';
import { checkToken, checkRole } from '../middleware/auth.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// General routes
router.get('/', checkToken, checkRole('coordinator'), getAllGroups);
router.get('/invitations', checkToken, checkRole('student'), getInvitations);
router.put('/:id/invitation-response', checkToken, checkRole('student'), respondToInvitation);

// Supervisor Routes
router.get('/supervisor/my-groups', checkToken, checkRole('supervisor'), getSupervisorGroups);
router.get('/supervisor/requests', checkToken, checkRole('supervisor'), getSupervisorRequests);
router.get('/supervisor/evaluations', checkToken, checkRole('supervisor', 'faculty'), getSupervisorEvaluations);
router.get('/supervisor/:id/details', checkToken, checkRole('supervisor'), getSupervisorGroupDetails);
router.put('/:id/supervisor-response', checkToken, checkRole('supervisor'), respondToSupervisorRequest);
router.put('/:id/defense-approval', checkToken, checkRole('supervisor'), respondToDefenseApproval);
router.put('/:id/evaluate', checkToken, checkRole('supervisor', 'faculty'), evaluateGroup);

// External Supervisor Routes
router.get('/external/my-groups', checkToken, checkRole('external_supervisor'), getExternalSupervisorGroups);
router.put('/:id/external-evaluate', checkToken, checkRole('external_supervisor'), submitExternalEvaluation);

// Coordinator assignment for External Supervisor
router.put('/:id/assign-external', checkToken, checkRole('coordinator'), assignExternalSupervisor);

// Student Routes
router.post('/', checkToken, checkRole('student'), createGroup);
router.get('/my-group', checkToken, checkRole('student'), getMyGroup);
router.post('/:id/request-supervisor', checkToken, checkRole('student'), requestSupervisor);
router.post('/:id/proposal', upload.single('proposal'), checkToken, checkRole('student'), submitProposal);
router.post('/:id/srs', upload.single('srs'), checkToken, checkRole('student'), submitSRS);
router.post('/:id/final-report', upload.single('finalReport'), checkToken, checkRole('student'), submitFinalReport);
router.put('/:id/details', checkToken, checkRole('student'), updateGroupDetails);
router.post('/:id/rejoin', checkToken, checkRole('student'), rejoinBatch);

export default router;
