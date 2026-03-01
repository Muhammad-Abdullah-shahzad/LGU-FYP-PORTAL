import express from 'express';
import {
    createDefensePanel,
    getAllPanels,
    assignGroupToPanel,
    getPanelGroups,
    getMyPanels,
    evaluateGroup,
    acceptMinorRevision,
    deleteDefensePanel,
    updateDefensePanel,
    unassignGroupFromPanel,
    bulkAssignGroupsToPanel
} from '../controllers/panelController.js';
import { checkToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Coordinator routes
router.post('/', checkToken, checkRole('coordinator'), createDefensePanel);
router.get('/', checkToken, checkRole('coordinator'), getAllPanels);
router.post('/:id/assign-group', checkToken, checkRole('coordinator'), assignGroupToPanel);
router.post('/:id/bulk-assign', checkToken, checkRole('coordinator'), bulkAssignGroupsToPanel);
router.put('/:id', checkToken, checkRole('coordinator'), updateDefensePanel);
router.delete('/:id', checkToken, checkRole('coordinator'), deleteDefensePanel);
router.post('/:id/unassign-group', checkToken, checkRole('coordinator'), unassignGroupFromPanel);

// Panel member routes
router.get('/my-panels', checkToken, checkRole('supervisor', 'panel_member'), getMyPanels);
router.get('/:id/groups', checkToken, checkRole('supervisor', 'panel_member', 'coordinator'), getPanelGroups);
router.put('/evaluate/:groupId', checkToken, checkRole('supervisor', 'panel_member'), evaluateGroup);
router.put('/accept-revision/:groupId', checkToken, checkRole('supervisor', 'panel_member'), acceptMinorRevision);

export default router;
