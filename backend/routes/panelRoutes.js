import express from 'express';
import {
    createDefensePanel,
    getAllPanels,
    assignGroupToPanel,
    getPanelGroups,
    getMyPanels,
    evaluateGroup,
    acceptMinorRevision
} from '../controllers/panelController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Coordinator routes
router.post('/', protect, authorize('coordinator'), createDefensePanel);
router.get('/', protect, authorize('coordinator'), getAllPanels);
router.post('/:id/assign-group', protect, authorize('coordinator'), assignGroupToPanel);

// Panel member routes
router.get('/my-panels', protect, authorize('supervisor', 'panel_member'), getMyPanels);
router.get('/:id/groups', protect, authorize('supervisor', 'panel_member', 'coordinator'), getPanelGroups);
router.put('/evaluate/:groupId', protect, authorize('supervisor', 'panel_member'), evaluateGroup);
router.put('/accept-revision/:groupId', protect, authorize('supervisor', 'panel_member'), acceptMinorRevision);

export default router;
