import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './StudentDashboard.css';
import {
    HiOutlineUserGroup,
    HiOutlineDocumentText,
    HiOutlineUser,
    HiOutlineAcademicCap,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineLightningBolt,
    HiOutlineShieldCheck,
    HiOutlineBell
} from 'react-icons/hi';

const StudentDashboard = () => {
    const [group, setGroup] = useState(null);
    const [timeline, setTimeline] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        hasGroup: false,
        proposalSubmitted: false,
        supervisorAssigned: false,
        defenseScheduled: false
    });
    const [invitations, setInvitations] = useState([]);
    const [timeLeft, setTimeLeft] = useState(null);
    const [activePhaseName, setActivePhaseName] = useState('');
    const { user } = useAuth();
    const isLeader = group && user && (group.leader?._id === user._id || group.leader === user._id);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        let targetSemester = 7;
        try {
            const groupRes = await api.get('/groups/my-group');
            if (groupRes.data) {
                setGroup(groupRes.data);
                targetSemester = groupRes.data.semester || 7;
                setStats({
                    hasGroup: true,
                    proposalSubmitted: !!groupRes.data.proposalDocument,
                    supervisorAssigned: groupRes.data.supervisorStatus === 'approved',
                    defenseScheduled: !!groupRes.data.defensePanel
                });
            }
        } catch (error) {
            console.log('Group not found');
        }

        try {
            const timelineRes = await api.get(`/timeline/active/${targetSemester}`);
            setTimeline(timelineRes.data);
        } catch (error) {
            console.error('Error fetching timeline');
        }

        try {
            const inviteRes = await api.get('/groups/invitations');
            setInvitations(inviteRes.data.invitations || []);
        } catch (error) {
            console.error('Error fetching invitations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!timeline) return;

        const phases = [
            { name: 'Group Formation', end: timeline.groupRegistrationEnd, active: timeline.groupRegistrationStatus === 'Open' },
            { name: 'Proposal Submission', end: timeline.proposalSubmissionEnd, active: timeline.proposalSubmissionStatus === 'Open' },
            { name: 'Proposal Defense', end: timeline.proposalDefenseEnd, active: timeline.proposalDefenseStatus === 'Open' },
            { name: 'Re-Proposal Submission', end: timeline.reProposalSubmissionEnd, active: timeline.reProposalSubmissionStatus === 'Open' },
            { name: 'Re-Proposal Defense', end: timeline.reProposalDefenseEnd, active: timeline.reProposalDefenseStatus === 'Open' },
            { name: 'SRS Submission', end: timeline.srsSubmissionEnd, active: timeline.srsSubmissionStatus === 'Open' },
            { name: 'SRS Defense', end: timeline.srsDefenseEnd, active: timeline.srsDefenseStatus === 'Open' },
            { name: 'Re-SRS Defense', end: timeline.reSrsDefenseEnd, active: timeline.reSrsDefenseStatus === 'Open' },
            { name: 'Internal Defense', end: timeline.internalDefenseEnd, active: timeline.internalDefenseStatus === 'Open' },
            { name: 'Re-Internal Defense', end: timeline.reInternalDefenseEnd, active: timeline.reInternalDefenseStatus === 'Open' }
        ];

        const currentActive = phases.find(p => p.active && p.end);

        if (!currentActive) {
            setTimeLeft(null);
            return;
        }

        setActivePhaseName(currentActive.name);

        const timer = setInterval(() => {
            const now = new Date().getTime();
            // Set end date to 23:59:59 of that day
            const endDate = new Date(currentActive.end);
            endDate.setHours(23, 59, 59, 999);
            const distance = endDate.getTime() - now;

            if (distance < 0) {
                setTimeLeft('Phase Ended');
                clearInterval(timer);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeline]);

    const handleInvitation = async (groupId, action) => {
        try {
            await api.put(`/groups/${groupId}/invitation-response`, { action });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process invitation');
        }
    };

    const handleRejoin = async () => {
        try {
            if (!confirm('Are you sure you want to rejoin the new academic batch? This will reset your progress for the failed phase.')) return;

            const res = await api.post(`/groups/${group._id}/rejoin`);
            alert(res.data.message);
            fetchData(); // Refresh to see new status and timeline
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to rejoin batch. Ensure a new timeline is active.');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'TBD';
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <DashboardLayout title="Student Dashboard">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Student Dashboard">
            <div className="dashboard-container">
                {/* Header Section */}
                <div className="mb-4">
                    <h5 className="fw-bold text-dark mb-1">Welcome, {user?.firstName}</h5>
                    <p className="text-muted small">Tracking your FYP progress for the {timeline ? `${timeline.batch}-${timeline.batchYear}` : 'current'} session.</p>
                </div>

                {/* Countdown / Alert Section */}
                <div className="row g-3 mb-4">
                    {timeLeft && typeof timeLeft === 'object' && (
                        <div className="col-12">
                            <div className="glass-card bg-primary text-white border-0 shadow-lg d-flex align-items-center justify-content-between p-4 overflow-hidden position-relative" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}>
                                <div style={{ zIndex: 1 }}>
                                    <h4 className="fw-bold mb-1" style={{ fontSize: '1.2rem' }}>Phase Deadline Approaching</h4>
                                    <p className="mb-0 opacity-75 small">Finish your <strong>{activePhaseName}</strong> before the window closes.</p>
                                </div>
                                <div className="d-flex gap-3 text-center" style={{ zIndex: 1 }}>
                                    {[
                                        { val: timeLeft.days, label: 'Days' },
                                        { val: timeLeft.hours, label: 'Hrs' },
                                        { val: timeLeft.minutes, label: 'Min' },
                                        { val: timeLeft.seconds, label: 'Sec' }
                                    ].map((t, i) => (
                                        <div key={i} className="bg-white bg-opacity-10 rounded-3 px-3 py-2" style={{ minWidth: '65px', backdropFilter: 'blur(10px)' }}>
                                            <div className="fw-bold h4 mb-0">{t.val.toString().padStart(2, '0')}</div>
                                            <div className="x-small text-uppercase opacity-75" style={{ fontSize: '0.55rem', fontWeight: '800' }}>{t.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <HiOutlineClock className="position-absolute opacity-10" size={150} style={{ right: '-20px', top: '-20px' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications/Invitations */}
                {invitations.length > 0 && (
                    <div className="mb-4">
                        <div className="glass-card bg-primary bg-opacity-5 border-primary border-opacity-10">
                            <div className="d-flex align-items-center mb-3">
                                <HiOutlineBell className="text-primary me-2" size={18} />
                                <h6 className="fw-bold m-0 text-primary" style={{ fontSize: '0.8rem' }}>Pending Invitations</h6>
                            </div>
                            <div className="row g-2">
                                {invitations.map((invite) => (
                                    <div key={invite._id} className="col-md-6 col-lg-4">
                                        <div className="bg-white p-3 rounded-lg border shadow-sm">
                                            <h6 className="fw-bold mb-1" style={{ fontSize: '0.8rem' }}>{invite.projectTitle}</h6>
                                            <p className="small text-muted mb-3" style={{ fontSize: '0.7rem' }}>By: {invite.student1.firstName} {invite.student1.lastName}</p>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-primary btn-sm rounded px-3" onClick={() => handleInvitation(invite._id, 'approve')}>Accept</button>
                                                <button className="btn btn-outline-danger btn-sm rounded px-3" onClick={() => handleInvitation(invite._id, 'reject')}>Decline</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Stats Grid */}
                <div className="stats-grid">
                    {[
                        { label: 'Group Status', icon: <HiOutlineUserGroup />, status: stats.hasGroup ? 'Active' : 'Not Formed', color: 'primary' },
                        { label: 'Proposal', icon: <HiOutlineDocumentText />, status: stats.proposalSubmitted ? 'Submitted' : 'Pending', color: 'info' },
                        { label: 'Supervisor', icon: <HiOutlineUser />, status: stats.supervisorAssigned ? 'Assigned' : 'Awaiting', color: 'success' },
                        { label: 'Defense Slot', icon: <HiOutlineAcademicCap />, status: stats.defenseScheduled ? 'Scheduled' : 'TBD', color: 'warning' }
                    ].map((item, index) => (
                        <div key={index} className={`glass-card stat-card stat-${item.color}`}>
                            <div className="stat-icon">{item.icon}</div>
                            <div className="stat-content">
                                <h3>{item.label}</h3>
                                <p>{item.status}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dashboard-main">
                    {/* Project Information */}
                    <div className="glass-card">
                        {group && (group.status.includes('rejected') || group.status === 'failed') && (
                            <div className="alert alert-danger border-0 rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between gap-3">
                                <div className="d-flex align-items-center gap-3">
                                    <HiOutlineShieldCheck size={24} className="flex-shrink-0" />
                                    <div>
                                        <h6 className="fw-bold mb-1">Academic Rejection Alert</h6>
                                        <p className="small mb-0 opacity-75">
                                            {group.status === 'failed'
                                                ? 'Your project timeline has been terminated due to failure in defense.'
                                                : 'Your project has been rejected during the evaluation phase. Please contact your supervisor.'}
                                        </p>
                                    </div>
                                </div>
                                {group.status === 'failed' && isLeader && (
                                    <button
                                        className="btn btn-danger btn-sm text-nowrap fw-bold px-3 shadow-sm"
                                        onClick={handleRejoin}
                                    >
                                        Rejoin New Batch
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="section-title mb-0">Project Intelligence</h6>
                            {group && (
                                <span className={`badge ${group.status.includes('rejected') || group.status === 'failed' ? 'bg-danger' : 'bg-success'} text-white rounded-pill px-2 py-1 text-uppercase`} style={{ fontSize: '0.55rem', fontWeight: '800' }}>
                                    {group.status.replace('_', ' ')}
                                </span>
                            )}
                        </div>

                        {group ? (
                            <div className="project-details">
                                <div className="info-item w-100 mb-3" style={{ background: '#f8fafc' }}>
                                    <label>Working Title</label>
                                    <p className="text-dark" style={{ fontSize: '0.9rem' }}>{group.projectTitle || 'Title Pending Formation'}</p>
                                </div>

                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Reference ID</label>
                                        <p>{group.groupName}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Specialization</label>
                                        <p>{group.projectDomain || 'General SE'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Lead Supervisor</label>
                                        <p>{group.supervisor ? `${group.supervisor.firstName} ${group.supervisor.lastName}` : 'TBD'}</p>
                                        {group.supervisor && (group.supervisor.domain?.length > 0 || group.supervisor.areaOfExpertise) && (
                                            <div className="text-muted" style={{ fontSize: '0.6rem', marginTop: '-8px', lineHeight: '1.2' }}>
                                                {group.supervisor.domain && group.supervisor.domain.length > 0
                                                    ? (Array.isArray(group.supervisor.domain) ? group.supervisor.domain.join(', ') : group.supervisor.domain)
                                                    : group.supervisor.areaOfExpertise}
                                            </div>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <label>Management Role</label>
                                        <p className="text-primary">{isLeader ? 'Leader' : 'Member'}</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h6 className="modern-label mb-2">Team Ecosystem</h6>
                                    <div className="member-list">
                                        {[group.student1, group.student2].filter(Boolean).map((m) => (
                                            <div key={m._id} className="member-pill">
                                                <div className={`member-dot bg-${group.leader?._id === m._id ? 'primary' : 'secondary'}`}></div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold" style={{ fontSize: '0.75rem' }}>{m.firstName} {m.lastName}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>{m.registrationNumber}</div>
                                                </div>
                                                {group.leader && (group.leader?._id === m._id || group.leader === m._id) && (
                                                    <span className="badge bg-primary text-white x-small" style={{ fontSize: '0.5rem' }}>LEADER</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Supervisor Defense Approvals */}
                                {timeline && (
                                    <div className="mt-4 pt-3 border-top">
                                        <h6 className="modern-label mb-3">Supervisor Defense Clearance</h6>
                                        <div className="row g-2">
                                            {[
                                                { phase: 'proposal', label: 'Proposal Defense', active: timeline.proposalDefenseStatus === 'Open' || timeline.reProposalDefenseStatus === 'Open' },
                                                { phase: 'srs', label: 'SRS Defense', active: timeline.srsDefenseStatus === 'Open' || timeline.reSrsDefenseStatus === 'Open' },
                                                { phase: 'internal', label: 'Internal Defense', active: timeline.internalDefenseStatus === 'Open' || timeline.reInternalDefenseStatus === 'Open' }
                                            ].map(def => {
                                                const approval = group[`${def.phase}SupervisorApproval`];
                                                const remarks = group[`${def.phase}SupervisorRemarks`];

                                                if (!def.active && !approval) return null;

                                                return (
                                                    <div key={def.phase} className="col-12">
                                                        <div className={`p-3 rounded-lg border shadow-sm ${approval === 'approved' ? 'bg-success bg-opacity-5' : approval === 'rejected' ? 'bg-danger bg-opacity-5' : 'bg-light'}`}>
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>{def.label}</span>
                                                                <span className={`badge bg-${approval === 'approved' ? 'success' : approval === 'rejected' ? 'danger' : 'warning'} rounded-pill`} style={{ fontSize: '0.55rem' }}>
                                                                    {approval?.toUpperCase() || 'AWAITING APPROVAL'}
                                                                </span>
                                                            </div>
                                                            {remarks && (
                                                                <div className="mt-2 text-muted italic" style={{ fontSize: '0.7rem', borderLeft: '2px solid #ccc', paddingLeft: '8px' }}>
                                                                    " {remarks} "
                                                                </div>
                                                            )}
                                                            {!approval && def.active && (
                                                                <div className="mt-2 text-primary x-small fw-bold">
                                                                    Supervisor must approve your documentation before you can proceed to the panel defense.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="bg-light rounded-circle p-3 mb-3 mx-auto d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                    <HiOutlineLightningBolt size={30} className="text-warning" />
                                </div>
                                <h6 className="fw-bold text-dark">No Active Group</h6>
                                <p className="text-muted small px-4 mb-3">You must initialize your FYP group to access project management features.</p>
                                <button className="modern-btn btn btn-primary w-100" onClick={() => window.location.href = '/student/group'}>
                                    Initialize Group
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Timeline Tracker */}
                    <div className="glass-card">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="section-title mb-0">FYP Roadmap</h6>
                            <HiOutlineClock className="text-muted" size={18} />
                        </div>

                        <div className="timeline-tracker">
                            {timeline ? (
                                [
                                    { name: 'Group Formation', start: timeline.groupRegistrationStart, end: timeline.groupRegistrationEnd, active: timeline.groupRegistrationStatus === 'Open' },
                                    { name: 'Proposal Cycle', start: timeline.proposalSubmissionStart, end: timeline.proposalSubmissionEnd, active: timeline.proposalSubmissionStatus === 'Open' },
                                    { name: 'Proposal Defense', start: timeline.proposalDefenseStart, end: timeline.proposalDefenseEnd, active: timeline.proposalDefenseStatus === 'Open' },

                                    // Re-Proposal: Show if Open OR if User is in Revision/Re-Proposal state
                                    ...[(
                                        timeline.reProposalDefenseStatus === 'Open' ||
                                        group?.status === 'proposal_rejected' ||
                                        group?.status === 'proposal_revision' ||
                                        group?.status === 're-proposal'
                                    ) ? [{
                                        name: 'Re-Proposal Defense',
                                        start: timeline.reProposalDefenseStart,
                                        end: timeline.reProposalDefenseEnd,
                                        active: timeline.reProposalDefenseStatus === 'Open',
                                        isUserCurrentStage: ['proposal_rejected', 'proposal_revision', 're-proposal'].includes(group?.status)
                                    }] : []].flat(),

                                    // SRS
                                    { name: 'SRS Submission', start: timeline.srsSubmissionStart, end: timeline.srsSubmissionEnd, active: timeline.srsSubmissionStatus === 'Open' },
                                    { name: 'SRS Defense', start: timeline.srsDefenseStart, end: timeline.srsDefenseEnd, active: timeline.srsDefenseStatus === 'Open' },
                                    // Re-SRS
                                    ...(timeline.reSrsDefenseStatus === 'Open' && (group?.status === 'srs_rejected' || group?.status === 'srs_revision' || (group?.srsAttempts > 0 && group?.status !== 'srs_approved' && !group?.status.includes('internal'))) ? [
                                        { name: 'Re-SRS Defense', start: timeline.reSrsDefenseStart, end: timeline.reSrsDefenseEnd, active: timeline.reSrsDefenseStatus === 'Open' }
                                    ] : []),

                                    // Internal
                                    { name: 'Internal Defense', start: timeline.internalDefenseStart, end: timeline.internalDefenseEnd, active: timeline.internalDefenseStatus === 'Open' },
                                    // Re-Internal
                                    ...(timeline.reInternalDefenseStatus === 'Open' && (group?.status === 'internal_rejected' || group?.status === 'internal_minor_revision' || group?.internalAttempts > 0) ? [
                                        { name: 'Re-Internal Defense', start: timeline.reInternalDefenseStart, end: timeline.reInternalDefenseEnd, active: timeline.reInternalDefenseStatus === 'Open' }
                                    ] : [])
                                ].map((phase, idx) => {
                                    const isDone = phase.end && new Date(phase.end) < new Date();
                                    const isStarted = !phase.start || new Date(phase.start) <= new Date();

                                    // Force active/pending if this is the user's specific current stage
                                    // if (phase.isUserCurrentStage) {
                                    //     isDone = false;
                                    // }

                                    // If active override is true, ignore dates
                                    const isActive = phase.active || phase.isUserCurrentStage;

                                    return (
                                        <div key={idx} className={`timeline-step ${isActive ? 'active' : ''} ${isDone && !isActive ? 'completed' : ''}`}>
                                            <div className="d-flex justify-content-between align-items-center w-100">
                                                <div>
                                                    <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{phase.name}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                                                        {phase.active && (!phase.start || phase.start === 'TBD') ? (
                                                            <span className="text-success fw-bold">Currently Active</span>
                                                        ) : (
                                                            `${formatDate(phase.start)} - ${formatDate(phase.end)}`
                                                        )}
                                                    </div>
                                                </div>
                                                {isActive && (
                                                    <div className="spinner-grow text-success spinner-grow-sm" role="status" style={{ width: '0.75rem', height: '0.75rem' }}>
                                                        <span className="visually-hidden">Active</span>
                                                    </div>
                                                )}
                                                {isDone && !isActive && <HiOutlineCheckCircle className="text-success" size={18} />}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-muted text-center small p-4">Academic roadmap data pending.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="mt-4">
                    <h6 className="section-title mb-3">Management Shortcuts</h6>
                    <div className="quick-actions">
                        {[
                            { label: 'Group Sync', desc: 'Team & Meta', icon: <HiOutlineUserGroup />, link: '/student/group' },
                            { label: 'Documentation', desc: isLeader ? 'Direct Submit' : 'Project View', icon: <HiOutlineDocumentText />, link: '/student/proposal' },
                            { label: 'Defense Slot', desc: 'Panel Timings', icon: <HiOutlineAcademicCap />, link: '/student/defense' }
                        ].map((action, idx) => (
                            <div key={idx} className="glass-card action-card" onClick={() => window.location.href = action.link}>
                                <div className="icon-bx">{action.icon}</div>
                                <h4>{action.label}</h4>
                                <p>{action.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
