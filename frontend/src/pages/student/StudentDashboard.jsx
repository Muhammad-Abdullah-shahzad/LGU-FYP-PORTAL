import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './StudentDashboard.css';
import {
    HiOutlineUserGroup,
    HiOutlineDocumentText,
    HiOutlineUser,
    HiOutlineAcademicCap,
    HiOutlineClipboardCheck,
    HiOutlineCalendar,
    HiOutlineExternalLink,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineLockClosed
} from 'react-icons/hi';

import StatsCard from '../../components/StatsCard';

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch student's group
            const groupRes = await api.get('/groups/my-group');
            let targetSemester = 7; // Default to 7

            if (groupRes.data && groupRes.data.group) {
                setGroup(groupRes.data.group);
                targetSemester = groupRes.data.group.semester || 7;
                setStats({
                    hasGroup: true,
                    proposalSubmitted: !!groupRes.data.group.proposal,
                    supervisorAssigned: groupRes.data.group.supervisorStatus === 'approved',
                    defenseScheduled: !!groupRes.data.group.defensePanel
                });
            }

            // Fetch active timeline
            const timelineRes = await api.get(`/timeline/active/${targetSemester}`);
            setTimeline(timelineRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'TBD';
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        });
    };

    if (loading) {
        return (
            <DashboardLayout title="Student Dashboard">
                <div className="loading">Loading...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Student Dashboard">
            <div className="container-fluid p-0">
                {/* Stats Grid */}
                <div className="row g-4 mb-5">
                    {[
                        { label: 'Group Formation', icon: <HiOutlineUserGroup size={24} />, status: stats.hasGroup ? 'Completed' : 'Pending', color: stats.hasGroup ? 'success' : 'warning' },
                        { label: 'Proposal Submission', icon: <HiOutlineDocumentText size={24} />, status: stats.proposalSubmitted ? 'Submitted' : 'Pending', color: stats.proposalSubmitted ? 'success' : 'warning' },
                        { label: 'Supervisor Assigned', icon: <HiOutlineUser size={24} />, status: stats.supervisorAssigned ? 'Assigned' : 'Pending', color: stats.supervisorAssigned ? 'success' : 'warning' },
                        { label: 'Defense Scheduled', icon: <HiOutlineAcademicCap size={24} />, status: stats.defenseScheduled ? 'Scheduled' : 'Upcoming', color: stats.defenseScheduled ? 'success' : 'info' }
                    ].map((item, index) => (
                        <div key={index} className="col-md-6 col-xl-3">
                            <StatsCard
                                title={item.label}
                                value={item.status}
                                icon={item.icon}
                                color={item.color}
                            />
                        </div>
                    ))}
                </div>

                <div className="row g-4">
                    {/* Group Info */}
                    <div className="col-lg-7">
                        {group ? (
                            <div className="card border-0 shadow-sm rounded-4 h-100">
                                <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
                                    <h6 className="fw-bold m-0 font-outfit text-primary">My Group Information</h6>
                                    <span className={`badge bg-${group.status === 'approved' ? 'success' : 'warning'}-subtle text-${group.status === 'approved' ? 'success' : 'warning'} rounded-pill px-3 py-2 text-uppercase`} style={{ fontSize: '0.65rem' }}>
                                        {group.status}
                                    </span>
                                </div>
                                <div className="card-body p-3">
                                    <div className="row g-4">
                                        <div className="col-sm-6">
                                            <label className="small text-muted mb-1 d-block fw-semibold">Group Name</label>
                                            <p className="fw-bold mb-0">{group.groupName}</p>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="small text-muted mb-1 d-block fw-semibold">Domain</label>
                                            <p className="fw-bold mb-0 text-primary">{group.domain || 'Not Set'}</p>
                                        </div>
                                        <div className="col-12">
                                            <label className="small text-muted mb-1 d-block fw-semibold">Project Title</label>
                                            <p className="fw-bold mb-0 h6 text-dark">{group.projectTitle || 'Project title not submitted yet'}</p>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="small text-muted mb-1 d-block fw-semibold">Supervisor</label>
                                            <p className="fw-bold mb-0">
                                                {group.supervisor ? `${group.supervisor.firstName} ${group.supervisor.lastName}` : 'Not Assigned'}
                                            </p>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="small text-muted mb-1 d-block fw-semibold">Group Members</label>
                                            <div className="d-flex flex-wrap gap-1 mt-1">
                                                {group.members?.map(m => (
                                                    <span key={m._id} className="badge bg-light text-dark border rounded-pill fw-normal px-2">
                                                        {m.firstName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card border-0 shadow-sm rounded-4 h-100 p-5 text-center d-flex flex-column align-items-center justify-content-center bg-white">
                                <div className="bg-light rounded-circle p-4 mb-4">
                                    <span className="fs-1">🏢</span>
                                </div>
                                <h4 className="fw-bold font-outfit">No Group Yet</h4>
                                <p className="text-muted px-md-5">You haven't joined or created any FYP group. Please initiate group formation to proceed.</p>
                                <button className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm mt-3" onClick={() => window.location.href = '/student/group'}>
                                    Create or Join Group
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-transparent border-0 pt-3 px-3">
                                <h6 className="fw-bold m-0 font-outfit text-dark">Current Timeline</h6>
                                <p className="small text-muted m-0">{timeline ? `${timeline.batch} ${timeline.year} - Semester ${timeline.semester}` : 'Loading...'}</p>
                            </div>
                            <div className="card-body p-3">
                                {timeline ? (
                                    <div className="timeline-v2">
                                        {[
                                            { name: 'Group Registration', start: timeline.groupRegistrationStart, end: timeline.groupRegistrationEnd, color: 'primary' },
                                            ...(timeline.semester === 7 ? [
                                                { name: 'Proposal Submission', start: timeline.proposalSubmissionStart, end: timeline.proposalSubmissionEnd, color: 'info' },
                                                { name: 'Proposal Defense', start: timeline.proposalDefenseStart, end: timeline.proposalDefenseEnd, color: 'success' },
                                                { name: 'Internal Defense', start: timeline.internalDefenseStart, end: timeline.internalDefenseEnd, color: 'warning' }
                                            ] : [
                                                { name: 'SRS Defense', start: timeline.srsDefenseStart, end: timeline.srsDefenseEnd, color: 'info' },
                                                { name: 'External Defense', start: timeline.externalDefenseStart, end: timeline.externalDefenseEnd, color: 'danger' }
                                            ])
                                        ].map((phase, idx) => {
                                            const endDate = new Date(phase.end);
                                            endDate.setHours(23, 59, 59, 999);
                                            const isPast = endDate < new Date();
                                            const isNow = new Date() >= new Date(phase.start) && new Date() <= endDate;

                                            return (
                                                <div key={idx} className={`mb-4 position-relative ps-4 border-start border-2 ${isNow ? 'border-primary' : (isPast ? 'border-success' : 'border-light font-italic')}`}>
                                                    <div className={`position-absolute top-0 start-0 translate-middle rounded-circle border-4 border-white shadow-sm bg-${isPast ? 'success' : (isNow ? 'primary' : 'secondary')}`} style={{ width: '18px', height: '18px', marginLeft: '-1px' }}></div>
                                                    <h6 className={`fw-bold mb-1 ${isNow ? 'text-primary' : (isPast ? 'text-success' : 'text-muted')}`}>
                                                        {phase.name}
                                                        {isNow && <span className="badge bg-primary rounded-pill ms-2 fw-normal" style={{ fontSize: '0.6rem' }}>ACTIVE</span>}
                                                    </h6>
                                                    <p className="small text-muted mb-0">
                                                        {formatDate(phase.start)} - {formatDate(phase.end)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted">No active timeline data available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="row mt-4">
                    <div className="col-12">
                        <h6 className="fw-bold mb-4 font-outfit text-dark">Quick Management Actions</h6>
                        <div className="row g-4">
                            {[
                                { label: 'Manage Group', desc: 'Join or create an FYP group.', icon: <HiOutlineUserGroup size={24} />, link: '/student/group', color: 'primary' },
                                { label: 'Submit Proposal', desc: 'Submit your FYP proposal details.', icon: <HiOutlineDocumentText size={24} />, link: '/student/proposal', color: 'info' },
                                { label: 'Defense Schedule', desc: 'View your upcoming defense details.', icon: <HiOutlineAcademicCap size={24} />, link: '/student/defense', color: 'success' }
                            ].map((action, idx) => (
                                <div key={idx} className="col-md-4">
                                    <div
                                        className="card action-card border-0 shadow-sm rounded-4 h-100 p-3"
                                        onClick={() => window.location.href = action.link}
                                    >
                                        <div className="card-body text-center d-flex flex-column align-items-center">
                                            <div className={`action-icon-wrapper bg-${action.color} bg-opacity-10 text-${action.color} rounded-circle d-flex align-items-center justify-content-center mb-4`}>
                                                {action.icon}
                                            </div>
                                            <h6 className="fw-bold text-dark mb-2">{action.label}</h6>
                                            <p className="text-muted small mb-0">{action.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
