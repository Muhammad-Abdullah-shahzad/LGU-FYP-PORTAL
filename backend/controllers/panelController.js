import DefensePanel from '../models/DefensePanel.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

// @desc    Create defense panel
// @route   POST /api/panels
// @access  Private/Coordinator
export const createDefensePanel = async (req, res) => {
    try {
        const { panelType, members, chairperson, academicYear, semester, batch, className, expectedTime } = req.body;

        // Validate members are teachers
        const teachers = await User.find({
            _id: { $in: members },
            role: { $in: ['supervisor', 'panel_member'] }
        });

        if (teachers.length !== members.length) {
            return res.status(400).json({ message: 'All members must be valid teachers' });
        }

        // Validate chairperson is in members
        if (!members.includes(chairperson)) {
            return res.status(400).json({ message: 'Chairperson must be one of the panel members' });
        }

        const panel = await DefensePanel.create({
            panelType,
            members,
            chairperson,
            academicYear,
            semester,
            batch,
            className: className || '',
            expectedTime: expectedTime || '',
            createdBy: req.user._id
        });

        await panel.populate('members chairperson', 'firstName lastName email domain designation');

        res.status(201).json({
            message: 'Defense panel created successfully',
            panel
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete defense panel (Coordinator)
// @route   DELETE /api/panels/:id
// @access  Private/Coordinator
export const deleteDefensePanel = async (req, res) => {
    try {
        const panel = await DefensePanel.findById(req.params.id);

        if (!panel) {
            return res.status(404).json({ message: 'Panel not found' });
        }

        if (panel.assignedGroups && panel.assignedGroups.length > 0) {
            let updateField = '';
            if (panel.panelType === 'proposal') updateField = 'proposalPanel';
            else if (panel.panelType === 'internal') updateField = 'internalPanel';
            else if (panel.panelType === 'srs') updateField = 'srsPanel';
            else if (panel.panelType === 'external') updateField = 'externalPanel';

            if (updateField) {
                await Group.updateMany(
                    { _id: { $in: panel.assignedGroups } },
                    { $set: { [updateField]: null } }
                );
            }
        }

        await DefensePanel.findByIdAndDelete(req.params.id);

        res.json({ message: 'Defense panel deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update defense panel
// @route   PUT /api/panels/:id
// @access  Private/Coordinator
export const updateDefensePanel = async (req, res) => {
    try {
        const { panelType, members, chairperson, academicYear, semester, batch, className, expectedTime } = req.body;

        const panel = await DefensePanel.findById(req.params.id);
        if (!panel) {
            return res.status(404).json({ message: 'Panel not found' });
        }

        if (members) {
            // Validate members are teachers
            const teachers = await User.find({
                _id: { $in: members },
                role: { $in: ['supervisor', 'panel_member'] }
            });

            if (teachers.length !== members.length) {
                return res.status(400).json({ message: 'All members must be valid teachers' });
            }
            panel.members = members;
        }

        if (chairperson) {
            if (!panel.members.includes(chairperson)) {
                return res.status(400).json({ message: 'Chairperson must be one of the panel members' });
            }
            panel.chairperson = chairperson;
        }

        if (panelType) panel.panelType = panelType;
        if (academicYear) panel.academicYear = academicYear;
        if (semester) panel.semester = semester;
        if (batch) panel.batch = batch;
        if (className !== undefined) panel.className = className;
        if (expectedTime !== undefined) panel.expectedTime = expectedTime;

        await panel.save();
        await panel.populate('members chairperson', 'firstName lastName email domain designation');

        res.json({
            message: 'Defense panel updated successfully',
            panel
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all defense panels
// @route   GET /api/panels
// @access  Private/Coordinator
export const getAllPanels = async (req, res) => {
    try {
        const { panelType, academicYear, semester, batch } = req.query;

        const filter = {};
        if (panelType) filter.panelType = panelType;
        if (academicYear) filter.academicYear = academicYear;
        if (semester) filter.semester = parseInt(semester);
        if (batch) filter.batch = batch;

        const panels = await DefensePanel.find(filter)
            .populate('members chairperson', 'firstName lastName email domain designation')
            .populate('assignedGroups')
            .sort({ createdAt: -1 });

        res.json({
            count: panels.length,
            panels
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Assign group to panel
// @route   POST /api/panels/:id/assign-group
// @access  Private/Coordinator
export const assignGroupToPanel = async (req, res) => {
    try {
        const { groupId } = req.body;
        const panel = await DefensePanel.findById(req.params.id);

        if (!panel) {
            return res.status(404).json({ message: 'Panel not found' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if group is already assigned to a panel for this phase
        if (panel.panelType === 'proposal' && group.proposalPanel) {
            return res.status(400).json({ message: 'Group is already assigned to a Proposal Defense panel.' });
        }
        if (panel.panelType === 'internal' && group.internalPanel) {
            return res.status(400).json({ message: 'Group is already assigned to an Internal Defense panel.' });
        }
        if (panel.panelType === 'srs' && group.srsPanel) {
            return res.status(400).json({ message: 'Group is already assigned to an SRS Defense panel.' });
        }
        if (panel.panelType === 'external' && group.externalPanel) {
            return res.status(400).json({ message: 'Group is already assigned to an External Defense panel.' });
        }

        // Check if supervisor is on the panel
        if (group.supervisor && panel.members.some(memberId => memberId.toString() === group.supervisor.toString())) {
            return res.status(400).json({
                message: 'Conflict of Interest: The supervisor of this group cannot be a member of its defense panel.'
            });
        }

        // Assign panel based on type
        switch (panel.panelType) {
            case 'proposal':
                group.proposalPanel = panel._id;
                break;
            case 'internal':
                group.internalPanel = panel._id;
                break;
            case 'srs':
                group.srsPanel = panel._id;
                break;
            case 'external':
                group.externalPanel = panel._id;
                break;
            default:
                return res.status(400).json({ message: 'Invalid panel type' });
        }

        // Add to panel's assigned groups
        if (!panel.assignedGroups.includes(groupId)) {
            panel.assignedGroups.push(groupId);
        }

        await group.save();
        await panel.save();

        res.json({
            message: 'Group assigned to panel successfully',
            panel,
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Bulk assign groups to panel
// @route   POST /api/panels/:id/bulk-assign
// @access  Private/Coordinator
export const bulkAssignGroupsToPanel = async (req, res) => {
    try {
        const { groupIds } = req.body;
        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of group IDs' });
        }

        const panel = await DefensePanel.findById(req.params.id);
        if (!panel) {
            return res.status(404).json({ message: 'Panel not found' });
        }

        const groups = await Group.find({ _id: { $in: groupIds } });
        if (groups.length === 0) {
            return res.status(404).json({ message: 'No valid groups found' });
        }

        const panelType = panel.panelType;
        const results = {
            success: [],
            failed: []
        };

        for (const group of groups) {
            try {
                // Same validation logic as assignGroupToPanel
                const phaseKey = panelType === 'proposal' ? 'proposalPanel' :
                    panelType === 'internal' ? 'internalPanel' :
                        panelType === 'srs' ? 'srsPanel' :
                            panelType === 'external' ? 'externalPanel' : null;

                if (!phaseKey) throw new Error('Invalid panel type');

                if (group[phaseKey]) {
                    results.failed.push({ groupId: group._id, message: `Already assigned to a ${panelType} panel` });
                    continue;
                }

                // Conflict check
                if (group.supervisor && panel.members.some(mId => mId.toString() === group.supervisor.toString())) {
                    results.failed.push({ groupId: group._id, message: 'Supervisor conflict' });
                    continue;
                }

                // Assign
                group[phaseKey] = panel._id;
                if (!panel.assignedGroups.includes(group._id)) {
                    panel.assignedGroups.push(group._id);
                }

                await group.save();
                results.success.push(group._id);
            } catch (err) {
                results.failed.push({ groupId: group._id, message: err.message });
            }
        }

        await panel.save();
        const updatedPanel = await DefensePanel.findById(panel._id)
            .populate('members chairperson', 'firstName lastName email domain designation')
            .populate('assignedGroups');

        res.json({
            message: `Bulk assignment completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
            results,
            panel: updatedPanel
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Unassign group from panel
// @route   POST /api/panels/:id/unassign-group
// @access  Private/Coordinator
export const unassignGroupFromPanel = async (req, res) => {
    try {
        const { groupId } = req.body;
        const panel = await DefensePanel.findById(req.params.id);

        if (!panel) {
            return res.status(404).json({ message: 'Panel not found' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Remove from panel's assigned groups
        panel.assignedGroups = panel.assignedGroups.filter(id => id.toString() !== groupId.toString());

        // Remove panel from group based on panel type
        if (panel.panelType === 'proposal' && group.proposalPanel?.toString() === panel._id.toString()) {
            group.proposalPanel = null;
        } else if (panel.panelType === 'internal' && group.internalPanel?.toString() === panel._id.toString()) {
            group.internalPanel = null;
        } else if (panel.panelType === 'srs' && group.srsPanel?.toString() === panel._id.toString()) {
            group.srsPanel = null;
        } else if (panel.panelType === 'external' && group.externalPanel?.toString() === panel._id.toString()) {
            group.externalPanel = null;
        }

        await group.save();
        await panel.save();

        res.json({
            message: 'Group unassigned from panel successfully',
            panel
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get panel's assigned groups
// @route   GET /api/panels/:id/groups
// @access  Private/Panel Member
export const getPanelGroups = async (req, res) => {
    try {
        const panel = await DefensePanel.findById(req.params.id)
            .populate({
                path: 'assignedGroups',
                populate: {
                    path: 'student1 student2 supervisor',
                    select: 'firstName lastName email registrationNumber domain'
                }
            });

        if (!panel) {
            return res.status(404).json({ message: 'Panel not found' });
        }

        // Check if user is a member of this panel
        const isMember = panel.members.some(member => member.toString() === req.user._id.toString());

        if (!isMember && req.user.role !== 'coordinator') {
            return res.status(403).json({ message: 'Not authorized to view this panel' });
        }

        res.json({
            panel: {
                _id: panel._id,
                panelName: panel.panelName,
                panelType: panel.panelType
            },
            groups: panel.assignedGroups
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get panels where user is a member
// @route   GET /api/panels/my-panels
// @access  Private/Teacher
export const getMyPanels = async (req, res) => {
    try {
        const panels = await DefensePanel.find({
            members: req.user._id,
            isActive: true
        })
            .populate('members chairperson', 'firstName lastName email domain')
            .populate({
                path: 'assignedGroups',
                populate: {
                    path: 'student1 student2 supervisor',
                    select: 'firstName lastName email registrationNumber'
                }
            })
            .sort({ createdAt: -1 });

        res.json({
            count: panels.length,
            panels
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Evaluate group (Panel Member)
// @route   PUT /api/panels/evaluate/:groupId
// @access  Private/Panel Member
export const evaluateGroup = async (req, res) => {
    try {
        const { decision, remarks, defenseType } = req.body;
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Get the appropriate panel based on defense type
        let panelId;
        switch (defenseType) {
            case 'proposal':
                panelId = group.proposalPanel;
                break;
            case 'internal':
                panelId = group.internalPanel;
                break;
            case 'srs':
                panelId = group.srsPanel;
                break;
            case 'external':
                panelId = group.externalPanel;
                break;
            default:
                return res.status(400).json({ message: 'Invalid defense type' });
        }

        const panel = await DefensePanel.findById(panelId);

        if (!panel) {
            return res.status(404).json({ message: 'Defense panel not assigned' });
        }

        // Check if user is a member of this panel
        const isMember = panel.members.some(member => member.toString() === req.user._id.toString());

        if (!isMember) {
            return res.status(403).json({ message: 'You are not a member of this defense panel' });
        }

        // Process evaluation based on defense type and decision
        switch (defenseType) {
            case 'proposal':
                group.proposalDefenseDate = new Date();
                group.proposalRemarks = remarks;

                if (decision === 'approve') {
                    group.addStatusChange('proposal_approved', req.user._id, remarks);
                } else if (decision === 'reject') {
                    if (group.proposalAttempts >= 2) {
                        group.addStatusChange('failed', req.user._id, `Rejected in ${phase} final defense (Attempt ${group.proposalAttempts + 1}).`);
                    } else {
                        group.addStatusChange('proposal_rejected', req.user._id, remarks);
                    }
                } else if (decision === 'revise') {
                    if (group.proposalAttempts >= 2) {
                        return res.status(400).json({ message: 'Maximum revision attempts reached. You must only Approve or Reject.' });
                    }
                    group.addStatusChange('proposal_revision', req.user._id, remarks);
                }
                group.proposalAttempts = (group.proposalAttempts || 0) + 1;
                break;

            case 'internal':
                group.internalDefenseDate = new Date();
                group.internalRemarks = remarks;

                if (decision === 'approve') {
                    group.addStatusChange('internal_approved', req.user._id, remarks);
                } else if (decision === 'reject') {
                    if (group.internalAttempts >= 2) {
                        group.addStatusChange('failed', req.user._id, `Rejected in internal final defense (Attempt ${group.internalAttempts + 1}).`);
                    } else {
                        group.addStatusChange('internal_rejected', req.user._id, remarks);
                    }
                } else if (decision === 'minor_revision' || decision === 'major_revision') {
                    if (group.internalAttempts >= 2) {
                        return res.status(400).json({ message: 'Maximum revision attempts reached. You must only Approve or Reject.' });
                    }
                    if (decision === 'minor_revision') {
                        group.addStatusChange('internal_minor_revision', req.user._id, 'Minor revision - offline coordination required');
                    } else {
                        group.addStatusChange('internal_major_revision', req.user._id, remarks);
                    }
                }
                group.internalAttempts = (group.internalAttempts || 0) + 1;
                break;

            case 'srs':
                group.srsDefenseDate = new Date();
                group.srsRemarks = remarks;

                if (decision === 'approve') {
                    group.addStatusChange('srs_approved', req.user._id, remarks);
                } else if (decision === 'revise') {
                    group.addStatusChange('srs_revision', req.user._id, remarks);
                }
                break;

            case 'external':
                group.externalDefenseDate = new Date();
                group.externalRemarks = remarks;
                group.finalGrade = req.body.grade || null;

                if (decision === 'pass') {
                    group.addStatusChange('completed', req.user._id, remarks);
                } else if (decision === 'fail') {
                    group.addStatusChange('failed', req.user._id, remarks);
                }
                break;
        }

        await group.save();
        await group.populate('student1 student2 supervisor');

        res.json({
            message: 'Evaluation submitted successfully',
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Manually accept minor revision (Panel Member)
// @route   PUT /api/panels/accept-revision/:groupId
// @access  Private/Panel Member
export const acceptMinorRevision = async (req, res) => {
    try {
        const { remarks } = req.body;
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.status !== 'internal_minor_revision') {
            return res.status(400).json({ message: 'Group is not in minor revision status' });
        }

        const panel = await DefensePanel.findById(group.internalPanel);

        if (!panel) {
            return res.status(404).json({ message: 'Internal panel not found' });
        }

        // Check if user is a member of this panel
        const isMember = panel.members.some(member => member.toString() === req.user._id.toString());

        if (!isMember) {
            return res.status(403).json({ message: 'You are not a member of this defense panel' });
        }

        group.addStatusChange('internal_approved', req.user._id, `Minor revision accepted - ${remarks}`);
        await group.save();

        res.json({
            message: 'Minor revision accepted',
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
