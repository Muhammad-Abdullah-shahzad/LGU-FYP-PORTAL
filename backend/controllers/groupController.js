import Group from '../models/Group.js';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import DefensePanel from '../models/DefensePanel.js';

// @desc    Create new group (Student)
// @route   POST /api/groups
// @access  Private/Student

export const createGroup = async (req, res) => {
    try {
        const {
            projectTitle, projectDomain, projectSummary,
            partnerBatch, partnerYear, partnerDegree, partnerSequence,
            myRole, supervisorId, // 'leader' or 'member'
            batch, year, semester, batchYear
        } = req.body;

        if (!supervisorId) {
            return res.status(400).json({ message: 'Supervisor selection is mandatory for group formation' });
        }

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

        // If partner info provided, find them
        if (partnerBatch && partnerYear && partnerDegree && partnerSequence) {
            const partnerRegNo = `${partnerBatch}-${partnerYear}/${partnerDegree}/${partnerSequence}`;

            const student2 = await User.findOne({
                registrationNumber: { $regex: new RegExp(`^${partnerRegNo}$`, 'i') },
                role: 'student'
            });

            if (!student2) {
                return res.status(404).json({ message: `Partner with roll number ${partnerRegNo} not found.` });
            }

            if (student2._id.toString() === req.user._id.toString()) {
                return res.status(400).json({ message: 'You cannot add yourself as partner' });
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

        // Determine leader
        let leaderId = req.user._id;
        if (myRole === 'member' && student2Id) {
            leaderId = student2Id;
        } else if (myRole === 'member' && !student2Id) {
            return res.status(400).json({ message: 'You must provide a partner to set them as leader' });
        }

        // Create group
        const group = await Group.create({
            student1: req.user._id,
            student2: student2Id,
            student2Status: student2Id ? 'pending' : 'none',
            leader: leaderId,
            supervisor: supervisorId,
            supervisorStatus: 'pending',
            supervisorRequestDate: new Date(),
            projectTitle,
            projectDomain,
            projectSummary,
            batch,
            year: parseInt(year),
            batchYear: parseInt(batchYear),
            semester: parseInt(semester) || 7,
            registrationDeadline: timeline.groupRegistrationEnd
        });

        await group.populate('student1 student2 leader supervisor', 'firstName lastName email registrationNumber domain designation');

        res.status(201).json({
            message: 'Group created successfully',
            group
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
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
            $or: [
                { student1: req.user._id },
                { student2: req.user._id, student2Status: 'approved' }
            ]
        })
            .populate('student1 student2 leader', 'firstName lastName email registrationNumber')
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

        // Check if student is the leader of this group
        if (group.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the group leader is authorized to upload documents' });
        }

        // Check if supervisor is approved
        if (group.supervisorStatus !== 'approved') {
            return res.status(400).json({ message: 'You must have an approved supervisor before submitting proposal' });
        }

        // Check if group is rejected or failed in the CURRENT active timeline context
        const timeline = await Timeline.findOne({
            batch: group.batch,
            year: group.year,
            semester: group.semester,
            isActive: true
        });

        // Current Active Timeline for the university (not necessarily the group's timeline)
        const globalActiveTimeline = await Timeline.findOne({ semester: 7, isActive: true });

        if (group.status.includes('rejected') || group.status === 'failed') {
            // "Re-appear" logic: If they are in a NEW 7th sem active session, let them submit
            if (globalActiveTimeline && (globalActiveTimeline.year > group.year || (globalActiveTimeline.year === group.year && globalActiveTimeline.batch !== group.batch))) {
                // Remove group from all panels it was previously assigned to
                await DefensePanel.updateMany(
                    { assignedGroups: group._id },
                    { $pull: { assignedGroups: group._id } }
                );

                // Reset group metadata for the new session
                group.status = 'registered';
                group.year = globalActiveTimeline.year;
                group.batch = globalActiveTimeline.batch;
                group.proposalAttempts = 0;
                group.proposalPanel = null;
                group.internalPanel = null;
                group.srsPanel = null;
                group.externalPanel = null;

                group.addStatusChange('registered', req.user._id, `Restarting FYP in new session ${globalActiveTimeline.batch}-${globalActiveTimeline.year}. Previous state cleared.`);
            }
            // Allow re-submission if it was the first rejection (proposal_rejected)
            else if (group.status === 'proposal_rejected') {
                // Permitted to re-submit in the same session
            }
            else {
                return res.status(400).json({ message: 'This group has been rejected and cannot proceed in this session.' });
            }
        }

        if (!timeline || (!timeline.isPhaseActive('proposalSubmission') && !timeline.isPhaseActive('reProposalSubmission'))) {
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

// @desc    Update project details (Title, Domain, Summary)
// @route   PUT /api/groups/:id/details
// @access  Private/Student
export const updateGroupDetails = async (req, res) => {
    try {
        const { projectTitle, projectDomain, projectSummary } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only leader can update details' });
        }

        // Allow updates if in registration phase or if proposal was rejected
        const isRejected = group.status === 'proposal_rejected' || group.status === 're-proposal';

        // Check registration window
        const timeline = await Timeline.findOne({
            batch: group.batch,
            year: group.year,
            semester: group.semester,
            isActive: true
        });

        const canUpdate = (timeline && timeline.isPhaseActive('groupRegistration')) || isRejected;

        if (!canUpdate) {
            return res.status(400).json({ message: 'Modifications are not allowed at this stage' });
        }

        if (projectTitle) group.projectTitle = projectTitle;
        if (projectDomain) group.projectDomain = projectDomain;
        if (projectSummary) group.projectSummary = projectSummary;

        if (isRejected) {
            group.addStatusChange(group.status, req.user._id, `Project metadata updated during re-proposal phase: ${projectDomain}`);
        }

        await group.save();

        res.json({
            message: 'Project details updated successfully',
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Submit SRS Document
// @route   POST /api/groups/:id/srs
// @access  Private/Student
export const submitSRS = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only leader can upload' });
        }

        // Check if previous phase (proposal) is approved
        if (group.status !== 'proposal_approved' && group.status !== 'srs_revision') {
            return res.status(400).json({ message: 'You cannot submit SRS until proposal is approved or you are in revision.' });
        }

        // Check if group is rejected/failed
        if (group.status.includes('rejected') || group.status === 'failed') {
            return res.status(400).json({ message: 'Group is rejected/failed' });
        }

        const timeline = await Timeline.findOne({ batch: group.batch, year: group.year, semester: group.semester, isActive: true });
        if (!timeline || !timeline.isPhaseActive('srsDefense')) {
            return res.status(400).json({ message: 'SRS submission window is closed' });
        }

        if (!req.file) return res.status(400).json({ message: 'Upload SRS file' });

        group.srsDocument = req.file.filename;
        group.addStatusChange('srs_defense', req.user._id, 'SRS submitted for review');
        await group.save();

        res.json({ message: 'SRS submitted successfully', group });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Submit Final Report
// @route   POST /api/groups/:id/final-report
// @access  Private/Student
export const submitFinalReport = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only leader can upload' });
        }

        // Check if previous phases are done
        if (!['internal_approved', 'internal_minor_revision'].includes(group.status)) {
            return res.status(400).json({ message: 'Final report can only be submitted after internal defense approval.' });
        }

        if (group.status.includes('rejected') || group.status === 'failed') {
            return res.status(400).json({ message: 'Group is rejected' });
        }

        if (!req.file) return res.status(400).json({ message: 'Upload final report' });

        group.finalReport = req.file.filename;
        group.addStatusChange('external_defense', req.user._id, 'Final report submitted');
        await group.save();

        res.json({ message: 'Final report submitted successfully', group });
    } catch (error) {
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
        if (group.supervisorStatus === 'pending' || (group.supervisorStatus === 'approved' && group.status !== 'proposal_rejected')) {
            return res.status(400).json({ message: 'Supervisor request already exists or is already approved' });
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
        const { batch, year, status, semester, batchYear } = req.query;

        const filter = {};
        if (batch) filter.batch = batch;
        if (year) filter.year = parseInt(year);
        if (batchYear) filter.batchYear = parseInt(batchYear);
        if (status) filter.status = status;
        if (semester) filter.semester = parseInt(semester);

        const groups = await Group.find(filter)
            .populate('student1 student2', 'firstName lastName email registrationNumber')
            .populate('supervisor', 'firstName lastName email domain')
            .populate({
                path: 'proposalPanel internalPanel srsPanel externalPanel',
                populate: {
                    path: 'members',
                    select: 'firstName lastName'
                }
            })
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
            supervisor: req.user._id,
            supervisorStatus: 'approved'
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

// @desc    Get group invitations (Student)
// @route   GET /api/groups/invitations
// @access  Private/Student
export const getInvitations = async (req, res) => {
    try {
        const invitations = await Group.find({
            student2: req.user._id,
            student2Status: 'pending'
        }).populate('student1', 'firstName lastName email registrationNumber');

        res.json({
            count: invitations.length,
            invitations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Respond to group invitation
// @route   PUT /api/groups/:id/invitation-response
// @access  Private/Student
export const respondToInvitation = async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (!group.student2 || group.student2.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (group.student2Status !== 'pending') {
            return res.status(400).json({ message: 'No pending invitation' });
        }

        if (action === 'approve') {
            group.student2Status = 'approved';
            group.addStatusChange(group.status, req.user._id, 'Group invitation accepted');
        } else if (action === 'reject') {
            group.student2Status = 'rejected';
            group.student2 = null;
            group.addStatusChange(group.status, req.user._id, 'Group invitation rejected');
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        await group.save();
        res.json({ message: `Invitation ${action}ed successfully`, group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get groups for evaluation (Supervisor & Panel Members)
// @route   GET /api/groups/supervisor/evaluations
// @access  Private/Supervisor or Panel Member
export const getSupervisorEvaluations = async (req, res) => {
    try {
        const timelines = await Timeline.find({ isActive: true });

        // Find active phases across all active timelines
        let activePhases = [];
        timelines.forEach(t => {
            if (t.isPhaseActive('proposalDefense')) activePhases.push('proposal');
            if (t.isPhaseActive('reProposalDefense')) activePhases.push('re-proposal');
            if (t.isPhaseActive('internalDefense')) activePhases.push('internal');
            if (t.isPhaseActive('srsDefense')) activePhases.push('srs');
        });

        // Unique phases
        activePhases = [...new Set(activePhases)];

        // Find panels where user is a member to include panel-assigned groups
        const myPanels = await DefensePanel.find({ members: req.user._id });
        const panelGroupIds = myPanels.reduce((acc, panel) => [...acc, ...panel.assignedGroups], []);

        // Get groups where user is supervisor OR part of the assigned defense panel
        const groups = await Group.find({
            $or: [
                { supervisor: req.user._id, supervisorStatus: 'approved' },
                { _id: { $in: panelGroupIds } }
            ]
        })
            .populate('student1 student2', 'firstName lastName email registrationNumber')
            .sort({ updatedAt: -1 });

        res.json({
            count: groups.length,
            groups,
            activePhases
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Evaluate a group (Supervisor)
// @route   PUT /api/groups/:id/evaluate
// @access  Private/Supervisor
export const evaluateGroup = async (req, res) => {
    try {
        const { status, remarks, phase } = req.body;
        // status: 'approved', 'rejected', 'revision'
        // phase: 'proposal', 'internal', 'srs'

        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if supervisor or panel member
        const isSupervisor = group.supervisor && group.supervisor.toString() === req.user._id.toString();

        let isPanelMember = false;
        const myPanels = await DefensePanel.find({ members: req.user._id });
        const panelGroupIds = myPanels.reduce((acc, panel) => [...acc, ...panel.assignedGroups.map(id => id.toString())], []);
        isPanelMember = panelGroupIds.includes(group._id.toString());

        if (!isSupervisor && !isPanelMember) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        let newStatus = '';
        if (phase === 'proposal' || phase === 're-proposal') {
            if (status === 'approved') {
                newStatus = 'proposal_approved';
            } else if (status === 'rejected') {
                // If it's the second attempt (re-proposal) and they are rejected, they fail the whole timeline
                if (group.proposalAttempts >= 1 || phase === 're-proposal') {
                    newStatus = 'failed'; // Terminal state
                    group.addStatusChange('failed', req.user._id, `Rejected in ${phase} defense (Attempt ${group.proposalAttempts + 1}). Timeline terminated.`);
                } else {
                    newStatus = 'proposal_rejected';
                }
            } else if (status === 'revision') {
                newStatus = 'proposal_revision';
            }
            group.proposalRemarks = remarks;
            group.proposalAttempts = (group.proposalAttempts || 0) + 1;
        } else if (phase === 'internal') {
            if (status === 'approved') newStatus = 'internal_approved';
            else if (status === 'rejected') newStatus = 'internal_rejected';
            else if (status === 'revision') newStatus = 'internal_minor_revision';
            group.internalRemarks = remarks;
            group.internalAttempts = (group.internalAttempts || 0) + 1;
        } else if (phase === 'srs') {
            if (status === 'approved') newStatus = 'srs_approved';
            else if (status === 'revision') newStatus = 'srs_revision';
            group.srsRemarks = remarks;
        }

        if (newStatus) {
            group.addStatusChange(newStatus, req.user._id, remarks);
            await group.save();
            res.json({ message: `Evaluation (${status}) submitted successfully for ${phase} phase`, group });
        } else {
            res.status(400).json({ message: 'Invalid evaluation phase or status' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

