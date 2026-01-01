import Group from '../models/Group.js';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';

// @desc    Create new group (Student)
// @route   POST /api/groups
// @access  Private/Student
export const createGroup = async (req, res) => {
    try {
        const { student2Email, projectTitle, projectDomain, projectSummary, batch, year, semester } = req.body;

        // Check if registration window is open
        const timeline = await Timeline.findOne({
            batch,
            year: parseInt(year),
            semester: parseInt(semester),
            isActive: true
        });

        if (!timeline) {
            return res.status(400).json({ message: `No active timeline found for ${batch} ${year} Semester ${semester}` });
        }

        if (!timeline.isPhaseActive('groupRegistration')) {
            return res.status(400).json({ message: 'Group registration window is not currently open for this semester' });
        }

        // Check if student1 already in a group
        const existingGroup = await Group.findOne({
            $or: [{ student1: req.user._id }, { student2: req.user._id }],
            batch,
            year: parseInt(year)
        });

        if (existingGroup) {
            return res.status(400).json({ message: 'You are already part of a group for this academic year' });
        }

        let student2Id = null;

        // If student2 email/reg provided, validate
        if (student2Email) {
            const student2 = await User.findOne({
                $or: [
                    { email: student2Email.toLowerCase() },
                    { registrationNumber: student2Email.toUpperCase() }
                ],
                role: 'student'
            });

            if (!student2) {
                return res.status(404).json({ message: 'Partner not found. Ensure they have registered an account first.' });
            }

            if (student2._id.toString() === req.user._id.toString()) {
                return res.status(400).json({ message: 'You cannot add yourself as student 2' });
            }

            // Check if student2 is already in a group
            const student2Group = await Group.findOne({
                $or: [{ student1: student2._id }, { student2: student2._id }],
                batch,
                year: parseInt(year)
            });

            if (student2Group) {
                return res.status(400).json({ message: 'Student 2 is already part of another group' });
            }

            student2Id = student2._id;
        }

        // Create group
        const group = await Group.create({
            student1: req.user._id,
            student2: student2Id,
            projectTitle,
            projectDomain,
            projectSummary,
            batch,
            year: parseInt(year),
            semester: parseInt(semester) || 7,
            registrationDeadline: timeline.groupRegistrationEnd
        });

        await group.populate('student1 student2', 'firstName lastName email registrationNumber');

        res.status(201).json({
            message: 'Group created successfully',
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get student's group
// @route   GET /api/groups/my-group
// @access  Private/Student
export const getMyGroup = async (req, res) => {
    try {
        const group = await Group.findOne({
            $or: [{ student1: req.user._id }, { student2: req.user._id }]
        })
            .populate('student1 student2', 'firstName lastName email registrationNumber')
            .populate('supervisor', 'firstName lastName email domain designation')
            .populate('proposalPanel internalPanel srsPanel externalPanel');

        if (!group) {
            return res.status(404).json({ message: 'You are not part of any group' });
        }

        res.json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Submit proposal
// @route   POST /api/groups/:id/proposal
// @access  Private/Student
export const submitProposal = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if student is part of this group
        if (group.student1.toString() !== req.user._id.toString() &&
            (!group.student2 || group.student2.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'You are not authorized to submit for this group' });
        }

        // Check if supervisor is approved
        if (group.supervisorStatus !== 'approved') {
            return res.status(400).json({ message: 'You must have an approved supervisor before submitting proposal' });
        }

        // Check timeline
        const timeline = await Timeline.findOne({
            batch: group.batch,
            year: group.year,
            semester: group.semester,
            isActive: true
        });

        if (!timeline || !timeline.isPhaseActive('proposalSubmission')) {
            return res.status(400).json({ message: 'Proposal submission window is closed' });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload proposal document' });
        }

        group.proposalDocument = req.file.filename;
        group.addStatusChange('proposal_submitted', req.user._id, 'Proposal submitted for review');

        await group.save();

        res.json({
            message: 'Proposal submitted successfully',
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Request supervisor
// @route   POST /api/groups/:id/request-supervisor
// @access  Private/Student
export const requestSupervisor = async (req, res) => {
    try {
        const { supervisorId } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check authorization
        if (group.student1.toString() !== req.user._id.toString() &&
            (!group.student2 || group.student2.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if already has supervisor request pending or approved
        if (group.supervisorStatus === 'pending' || group.supervisorStatus === 'approved') {
            return res.status(400).json({ message: 'Supervisor request already exists' });
        }

        // Validate supervisor
        const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor' });
        if (!supervisor) {
            return res.status(404).json({ message: 'Supervisor not found' });
        }

        // Check if supervisor's domain matches project domain
        if (!supervisor.domain.includes(group.projectDomain)) {
            return res.status(400).json({ message: 'Supervisor domain does not match project domain' });
        }

        group.supervisor = supervisorId;
        group.supervisorStatus = 'pending';
        group.supervisorRequestDate = new Date();
        group.addStatusChange(group.status, req.user._id, `Supervisor request sent to ${supervisor.fullName}`);

        await group.save();
        await group.populate('supervisor', 'firstName lastName email domain');

        res.json({
            message: 'Supervisor request sent successfully',
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all groups (Coordinator)
// @route   GET /api/groups
// @access  Private/Coordinator
export const getAllGroups = async (req, res) => {
    try {
        const { batch, year, status, semester } = req.query;

        const filter = {};
        if (batch) filter.batch = batch;
        if (year) filter.year = parseInt(year);
        if (status) filter.status = status;
        if (semester) filter.semester = parseInt(semester);

        const groups = await Group.find(filter)
            .populate('student1 student2', 'firstName lastName email registrationNumber')
            .populate('supervisor', 'firstName lastName email domain')
            .populate('proposalPanel internalPanel srsPanel externalPanel')
            .sort({ createdAt: -1 });

        res.json({
            count: groups.length,
            groups
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get groups by supervisor
// @route   GET /api/groups/supervisor/my-groups
// @access  Private/Supervisor
export const getSupervisorGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            supervisor: req.user._id
        })
            .populate('student1 student2', 'firstName lastName email registrationNumber')
            .populate('proposalPanel internalPanel srsPanel externalPanel')
            .sort({ createdAt: -1 });

        res.json({
            count: groups.length,
            groups
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get supervisor requests
// @route   GET /api/groups/supervisor/requests
// @access  Private/Supervisor
export const getSupervisorRequests = async (req, res) => {
    try {
        const requests = await Group.find({
            supervisor: req.user._id,
            supervisorStatus: 'pending'
        })
            .populate('student1 student2', 'firstName lastName email registrationNumber')
            .sort({ supervisorRequestDate: -1 });

        res.json({
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Approve/Reject supervisor request
// @route   PUT /api/groups/:id/supervisor-response
// @access  Private/Supervisor
export const respondToSupervisorRequest = async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if this supervisor is the one who received the request
        if (group.supervisor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (group.supervisorStatus !== 'pending') {
            return res.status(400).json({ message: 'No pending request to respond to' });
        }

        if (action === 'approve') {
            group.supervisorStatus = 'approved';
            group.addStatusChange(group.status, req.user._id, 'Supervisor request approved');
        } else if (action === 'reject') {
            group.supervisorStatus = 'rejected';
            group.supervisor = null;
            group.addStatusChange(group.status, req.user._id, 'Supervisor request rejected');
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        await group.save();
        await group.populate('student1 student2 supervisor');

        res.json({
            message: `Supervisor request ${action}d successfully`,
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
