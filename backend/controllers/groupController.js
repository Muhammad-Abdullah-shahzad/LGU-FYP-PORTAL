import Group from '../models/Group.js';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import DefensePanel from '../models/DefensePanel.js';
import { uploadFile } from '../config/googleDrive.js';

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
            batchYear: parseInt(batchYear),
            semester: parseInt(semester),
            isActive: true
        });

        if (!timeline) {
            return res.status(400).json({ message: `No active timeline found for ${batch} ${batchYear} Semester ${semester}` });
        }

        if (!timeline.isPhaseActive('groupRegistration')) {
            return res.status(400).json({ message: 'Group registration window is not currently open for this batch' });
        }

        // Check if student1 already in a group for this specific batch
        const existingGroup = await Group.findOne({
            $or: [{ student1: req.user._id }, { student2: req.user._id }],
            batch,
            batchYear: parseInt(batchYear)
        });

        if (existingGroup) {
            return res.status(400).json({ message: 'You are already part of a group for this batch session' });
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
                batchYear: parseInt(batchYear)
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
        // Check if group is rejected or failed in the CURRENT active timeline context
        const timeline = await Timeline.findOne({
            batch: group.batch,
            batchYear: group.batchYear,
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
            // Allow re-submission if it was the first rejection (proposal_rejected) or if in revision
            else if (group.status === 'proposal_rejected' || group.status === 'proposal_revision' || group.status === 're-proposal') {
                // Permitted to re-submit in the same session
            }
            else {
                return res.status(400).json({ message: 'This group has been rejected and cannot proceed in this session.' });
            }
        }

        const isReSubmission = group.status === 'proposal_rejected' || group.status === 'proposal_revision' || group.status === 're-proposal';

        if (!timeline || (!timeline.isPhaseActive('proposalSubmission') && !timeline.isPhaseActive('reProposalSubmission') && (!isReSubmission || !timeline.isPhaseActive('reProposalDefense')))) {
            return res.status(400).json({ message: 'Proposal submission window is closed' });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload proposal document' });
        }

        // Upload to Google Drive
        const googleFile = await uploadFile(req.file);

        group.proposalDocument = googleFile.webViewLink;
        group.addStatusChange('proposal_submitted', req.user._id, 'Proposal submitted for review');

        await group.save();

        await group.populate('student1 student2 leader supervisor', 'firstName lastName email registrationNumber domain designation');
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
        // Check registration window
        const timeline = await Timeline.findOne({
            batch: group.batch,
            batchYear: group.batchYear,
            semester: group.semester,
            isActive: true
        });

        const canUpdate = (timeline && timeline.isPhaseActive('groupRegistration')) || isRejected || group.status === 'registered';

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

        await group.populate('student1 student2 leader supervisor', 'firstName lastName email registrationNumber domain designation');
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

        const timeline = await Timeline.findOne({ batch: group.batch, batchYear: group.batchYear, semester: group.semester, isActive: true });
        if (!timeline || (!timeline.isPhaseActive('srsSubmission') && !timeline.isPhaseActive('srsDefense'))) {
            return res.status(400).json({ message: 'SRS submission window is closed' });
        }

        if (!req.file) return res.status(400).json({ message: 'Upload SRS file' });

        // Upload to Google Drive
        const googleFile = await uploadFile(req.file);

        group.srsDocument = googleFile.webViewLink;
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

        // Upload to Google Drive
        const googleFile = await uploadFile(req.file);

        group.finalReport = googleFile.webViewLink;
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

        // Check if this supervisor previously rejected this group's proposal
        // This prevents re-requesting a supervisor who has already rejected the group's work in a defense
        const hasPriorRejection = group.statusHistory.some(history =>
            history.status === 'proposal_rejected' &&
            history.changedBy &&
            history.changedBy.toString() === supervisorId
        );

        if (hasPriorRejection) {
            return res.status(400).json({ message: 'You cannot request supervision from a supervisor who has previously rejected your proposal defense.' });
        }

        group.supervisor = supervisorId;
        group.supervisorStatus = 'pending';
        group.supervisorRequestDate = new Date();
        group.addStatusChange(group.status, req.user._id, `Supervisor request sent to ${supervisor.fullName}`);

        await group.save();
        await group.populate('student1 student2 leader supervisor', 'firstName lastName email registrationNumber domain designation');
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
        const { batch, year, status, semester, batchYear, onlyActiveTimeline } = req.query;

        const filter = {};
        if (batch) filter.batch = batch;
        if (year) filter.year = parseInt(year);
        if (batchYear) filter.batchYear = parseInt(batchYear);
        if (status) filter.status = status;
        if (semester) filter.semester = parseInt(semester);

        if (onlyActiveTimeline === 'true') {
            const activeTimelines = await Timeline.find({ isActive: true });
            if (activeTimelines.length > 0) {
                const activeFilters = activeTimelines.map(t => ({
                    batch: t.batch,
                    batchYear: t.batchYear,
                    semester: t.semester
                }));
                filter.$or = activeFilters;
            } else {
                // If no active timelines, return nothing
                return res.json({ count: 0, groups: [] });
            }
        }

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

// @desc    Get detailed group information for supervisor
// @route   GET /api/groups/supervisor/:id/details
// @access  Private/Supervisor
export const getSupervisorGroupDetails = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('student1 student2 leader', 'firstName lastName email registrationNumber')
            .populate('supervisor', 'firstName lastName email domain designation')
            .populate({
                path: 'proposalPanel',
                populate: { path: 'members', select: 'firstName lastName designation' }
            })
            .populate({
                path: 'internalPanel',
                populate: { path: 'members', select: 'firstName lastName designation' }
            })
            .populate({
                path: 'srsPanel',
                populate: { path: 'members', select: 'firstName lastName designation' }
            })
            .populate({
                path: 'externalPanel',
                populate: { path: 'members', select: 'firstName lastName designation' }
            })
            .populate({
                path: 'statusHistory.changedBy',
                select: 'firstName lastName role'
            });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the requesting user is the supervisor of this group
        if (group.supervisor._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this group' });
        }

        res.json({ group });
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

// @desc    Approve/Reject defense request (Supervisor)
// @route   PUT /api/groups/:id/defense-approval
// @access  Private/Supervisor
export const respondToDefenseApproval = async (req, res) => {
    try {
        const { phase, action, remarks } = req.body; // phase: 'proposal', 'srs', 'internal', 'external'; action: 'approved', 'rejected'
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Ensure current user is the supervisor
        if (group.supervisor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to approve defense for this group' });
        }

        if (phase === 'proposal') {
            group.proposalSupervisorApproval = action;
            group.proposalSupervisorRemarks = remarks;
        } else if (phase === 'srs') {
            group.srsSupervisorApproval = action;
            group.srsSupervisorRemarks = remarks;
        } else if (phase === 'internal') {
            group.internalSupervisorApproval = action;
            group.internalSupervisorRemarks = remarks;
        } else if (phase === 'external') {
            group.externalSupervisorApproval = action;
            group.externalSupervisorRemarks = remarks;
        } else {
            return res.status(400).json({ message: 'Invalid defense phase' });
        }

        group.addStatusChange(group.status, req.user._id, `Supervisor ${action} defense request for ${phase}. Remarks: ${remarks}`);
        await group.save();

        res.json({ message: `Defense request ${action} successfully`, group });
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
            if (t.isPhaseActive('srsDefense')) activePhases.push('srs');
            if (t.isPhaseActive('reSrsDefense')) activePhases.push('re-srs');
            if (t.isPhaseActive('internalDefense')) activePhases.push('internal');
            if (t.isPhaseActive('reInternalDefense')) activePhases.push('re-internal');
        });

        // Unique phases
        activePhases = [...new Set(activePhases)];

        // Find panels where user is a member and populate assigned groups
        const panels = await DefensePanel.find({ members: req.user._id })
            .populate({
                path: 'assignedGroups',
                populate: {
                    path: 'student1 student2',
                    select: 'firstName lastName email registrationNumber'
                }
            })
            .sort({ updatedAt: -1 });

        res.json({
            panels,
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
            // Check supervisor approval for main defense (re-proposal doesn't need re-approval from supervisor if it's already in the loop)
            if (phase === 'proposal' && group.proposalSupervisorApproval !== 'approved') {
                return res.status(400).json({ message: 'Supervisor must approve the proposal for defense first' });
            }

            if (status === 'approved') {
                newStatus = 'proposal_approved';
            } else if (status === 'rejected') {
                // If attempts exhausted (2 previous attempts means this is the 3rd decision), fail.
                // Current attempts at start of request is group.proposalAttempts.
                // If attempts = 2, this is 3rd try -> Fail.
                if (group.proposalAttempts >= 2 || phase === 're-proposal') {
                    newStatus = 'failed';
                    group.addStatusChange('failed', req.user._id, `Rejected in ${phase} defense (Attempt ${group.proposalAttempts + 1}).`);
                } else {
                    newStatus = 'proposal_rejected';
                }
            } else if (status === 'revision') {
                newStatus = 'proposal_revision';
            }
            group.proposalRemarks = remarks;
            group.proposalAttempts = (group.proposalAttempts || 0) + 1;
        } else if (phase === 'srs' || phase === 're-srs') {
            if (phase === 'srs' && group.srsSupervisorApproval !== 'approved') {
                return res.status(400).json({ message: 'Supervisor must approve the SRS for defense first' });
            }

            if (status === 'approved') {
                newStatus = 'srs_approved';
            } else if (status === 'rejected') {
                if (group.srsAttempts >= 2 || phase === 're-srs') {
                    newStatus = 'failed';
                    group.addStatusChange('failed', req.user._id, `Rejected in ${phase} defense (Attempt ${group.srsAttempts + 1}).`);
                } else {
                    newStatus = 'srs_rejected';
                }
            } else if (status === 'revision') {
                newStatus = 'srs_revision';
            }
            group.srsRemarks = remarks;
            group.srsAttempts = (group.srsAttempts || 0) + 1;
            group.srsDefenseDate = new Date();
        } else if (phase === 'internal' || phase === 're-internal') {
            const validPreviousStatuses = ['proposal_approved', 'internal_minor_revision', 'internal_major_revision', 're_internal_defense', 'internal_defense', 'srs_approved', 'internal_rejected'];

            if (phase === 'internal' && group.internalSupervisorApproval !== 'approved') {
                return res.status(400).json({ message: 'Supervisor must approve the Internal defense first' });
            }

            if (!validPreviousStatuses.includes(group.status) && !group.status.includes('internal') && !group.status.includes('srs')) {
                // Relaxed check
            }

            if (status === 'approved') {
                newStatus = 'internal_approved';
            } else if (status === 'rejected') {
                if (group.internalAttempts >= 2 || phase === 're-internal') {
                    newStatus = 'failed';
                    group.addStatusChange('failed', req.user._id, `Rejected in ${phase} defense (Attempt ${group.internalAttempts + 1}).`);
                } else {
                    newStatus = 'internal_rejected';
                }
            } else if (status === 'revision') {
                newStatus = 'internal_minor_revision';
            }

            group.internalRemarks = remarks;
            group.internalAttempts = (group.internalAttempts || 0) + 1;
            group.internalDefenseDate = new Date();
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

// @desc    Rejoin batch after failure
// @route   POST /api/groups/:id/rejoin
// @access  Private/Student
export const rejoinBatch = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only leader can perform this action' });
        }

        if (group.status !== 'failed') {
            return res.status(400).json({ message: 'Only failed groups can rejoin a new batch' });
        }

        // Per latest requirement: HARD RESET everything except team members.
        const targetStatus = 'registered';

        // User Logic: Rejoin based on Batch Type and Enrollment Year
        // Fall Batch -> Spring Batch (Next Enrollment Year)
        // Spring Batch -> Fall Batch (Same Enrollment Year)

        let targetBatch, targetBatchYear;
        const currentBatch = group.batch ? group.batch.trim() : '';

        if (/^Spring$/i.test(currentBatch)) {
            targetBatch = 'Fall';
            targetBatchYear = group.batchYear; // Same enrollment year
        } else {
            // Default to Spring (Next Year) for 'Fall' or any other batch
            targetBatch = 'Spring';
            targetBatchYear = group.batchYear + 1;
        }

        const targetTimeline = await Timeline.findOne({
            batch: targetBatch,
            batchYear: targetBatchYear,
            isActive: true,
            $or: [{ groupRegistrationStatus: 'Open' }, { proposalSubmissionStatus: 'Open' }]
        });

        if (!targetTimeline) {
            return res.status(400).json({
                message: `No active timeline found for target batch ${targetBatch}-${targetBatchYear}. Your current batch is ${group.batch}-${group.batchYear}. Please contact coordinator.`
            });
        }

        // Context Update
        const newBatch = `${targetTimeline.batch}-${targetTimeline.year}`;

        group.batch = targetTimeline.batch;
        group.year = targetTimeline.year;
        group.batchYear = targetTimeline.batchYear;
        group.semester = targetTimeline.semester;

        // --- HARD RESET FIELDS ---

        // 1. Identity
        group.groupName = null; // Triggers regeneration of ID in pre-validate hook
        group.status = targetStatus;

        // 2. Supervisor (Explicitly Clear)
        group.supervisor = null;
        group.supervisorStatus = 'not_requested';
        group.supervisorRequestDate = undefined;

        // 3. Panels
        group.proposalPanel = null;
        group.internalPanel = null;
        group.srsPanel = null;
        group.externalPanel = null;

        // 4. Attempts
        group.proposalAttempts = 0;
        group.internalAttempts = 0;

        // 5. Artifacts
        group.proposalDocument = null;
        group.proposalRemarks = null;
        group.proposalDefenseDate = null;

        group.internalRemarks = null;
        group.internalDefenseDate = null;

        group.srsDocument = null;
        group.srsRemarks = null;
        group.srsDefenseDate = null;

        group.finalReport = null;
        group.externalRemarks = null;
        group.externalDefenseDate = null;
        group.finalGrade = null;

        // Log history
        group.addStatusChange(targetStatus, req.user._id, `Readmitted to ${newBatch} batch. fresh start initiated.`);

        await group.save();

        // Populate to confirm to frontend that supervisor is indeed null
        await group.populate('student1 student2 leader');

        res.json({
            message: `Successfully rejoined ${newBatch} batch. You can now select a new supervisor and submit your proposal.`,
            group
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

