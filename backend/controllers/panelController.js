import DefensePanel from '../models/DefensePanel.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

// @desc    Create defense panel
// @route   POST /api/panels
// @access  Private/Coordinator
export const createDefensePanel = async (req, res) => {
    try {
        const { panelType, members, chairperson, academicYear, semester } = req.body;

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

// @desc    Get all defense panels
// @route   GET /api/panels
// @access  Private/Coordinator
export const getAllPanels = async (req, res) => {
    try {
        const { panelType, academicYear, semester } = req.query;

        const filter = {};
        if (panelType) filter.panelType = panelType;
        if (academicYear) filter.academicYear = academicYear;
        if (semester) filter.semester = parseInt(semester);

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
                group.proposalAttempts += 1;

                if (decision === 'approve') {
                    group.addStatusChange('proposal_approved', req.user._id, remarks);
                } else if (decision === 'reject') {
                    group.addStatusChange('proposal_rejected', req.user._id, remarks);
                } else if (decision === 'revise') {
                    if (group.proposalAttempts >= 2) {
                        group.addStatusChange('proposal_rejected', req.user._id, 'Maximum revision attempts reached');
                    } else {
                        group.addStatusChange('proposal_revision', req.user._id, remarks);
                    }
                }
                break;

            case 'internal':
                group.internalDefenseDate = new Date();
                group.internalRemarks = remarks;
                group.internalAttempts += 1;

                if (decision === 'approve') {
                    group.addStatusChange('internal_approved', req.user._id, remarks);
                } else if (decision === 'reject') {
                    group.addStatusChange('internal_rejected', req.user._id, remarks);
                } else if (decision === 'minor_revision') {
                    group.addStatusChange('internal_minor_revision', req.user._id, 'Minor revision - offline coordination required');
                } else if (decision === 'major_revision') {
                    group.addStatusChange('internal_major_revision', req.user._id, remarks);
                }
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
