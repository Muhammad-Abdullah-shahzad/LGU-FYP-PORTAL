import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorDashboard.css';

import {
    HiOutlineUsers,
    HiOutlineUserGroup,
    HiOutlineAcademicCap,
    HiOutlineCalendar,
    HiOutlineArrowRight
} from 'react-icons/hi';

const CoordinatorDashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        supervisors: 0,
        groups: 0,
        activeTimelines: 0
    });
    const [pendingGroups, setPendingGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [usersRes, groupsRes, timelinesRes, pendingGroupsRes] = await Promise.all([
                api.get('/users'),
                api.get('/groups'),
                api.get('/timeline'),
                api.get('/groups?supervisorStatus=pending')
            ]);

            const users = usersRes.data.users || [];
            setStats({
                students: users.filter(u => u.role === 'student').length,
                supervisors: users.filter(u => u.role === 'supervisor').length,
                groups: groupsRes.data.count || 0,
                activeTimelines: timelinesRes.data.timelines?.filter(t => t.isActive).length || 0
            });
            setPendingGroups(pendingGroupsRes.data.groups || []);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <DashboardLayout title="System Control">
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </DashboardLayout>
    );

    const actions = [
        { title: 'User Administration', desc: 'Manage students, supervisors, and panel member accounts.', icon: <HiOutlineUsers size={18} />, link: '/coordinator/users', color: 'primary' },
        { title: 'Project Oversight', desc: 'Monitor project groups, domains, and supervisor assignments.', icon: <HiOutlineUserGroup size={18} />, link: '/coordinator/groups', color: 'success' },
        { title: 'Defense Panels', desc: 'Coordinate defense committees and associate them with groups.', icon: <HiOutlineAcademicCap size={18} />, link: '/coordinator/panels', color: 'info' },
        { title: 'Academic Timeline', desc: 'Define active phases for registrations and submissions.', icon: <HiOutlineCalendar size={18} />, link: '/coordinator/timeline', color: 'warning' },
    ];

    return (
        <DashboardLayout title="Coordinator Dashboard">
            <div className="coordinator-container">
                {/* Header Section */}
                <div className="mb-4">
                    <h5 className="fw-bold text-dark mb-1">System Administration</h5>
                    <p className="text-muted small">Comprehensive overview of the FYP Management System ecosystem.</p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {[
                        { label: 'Enrolled Students', value: stats.students, icon: <HiOutlineUsers />, color: 'primary' },
                        { label: 'Faculty Roster', value: stats.supervisors, icon: <HiOutlineAcademicCap />, color: 'info' },
                        { label: 'Registered Groups', value: stats.groups, icon: <HiOutlineUserGroup />, color: 'success' },
                        { label: 'Active Sessions', value: stats.activeTimelines, icon: <HiOutlineCalendar />, color: 'warning' }
                    ].map((item, index) => (
                        <div key={index} className={`stat-card-minimal stat-${item.color}`}>
                            <div className="stat-icon-minimal">{item.icon}</div>
                            <div className="stat-content-minimal">
                                <h3>{item.label}</h3>
                                <p>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Banner */}
                <div className="management-banner shadow-none">
                    <h5 className="font-outfit">Control Panel Operations</h5>
                    <p className="m-0">
                        Use the management command center below to oversee project lifecycles.
                        As a coordinator, you have the authority to manage user roles, verify group compliance,
                        and enforce academic deadlines via the timeline module.
                    </p>
                </div>

                {/* Pending Supervisor Responses Section */}
                {pendingGroups.length > 0 && (
                    <div className="mb-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="section-title m-0" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                                Pending Supervisor Responses
                            </h6>
                            <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                {pendingGroups.length} ACTION{pendingGroups.length > 1 ? 'S' : ''} REQUIRED
                            </span>
                        </div>
                        <div className="bg-white border rounded shadow-sm overflow-hidden">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.75rem' }}>
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-3 py-2 text-muted border-0">GROUP</th>
                                            <th className="px-3 py-2 text-muted border-0">SUPERVISOR</th>
                                            <th className="px-3 py-2 text-muted border-0">REQUEST DATE</th>
                                            <th className="px-3 py-2 text-muted border-0 text-end">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingGroups.map(group => (
                                            <tr key={group._id}>
                                                <td className="px-3 py-2">
                                                    <div className="fw-bold text-dark">{group.groupName}</div>
                                                    <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{group.projectTitle}</div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '24px', height: '24px', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                                            {group.supervisor?.firstName?.[0]}{group.supervisor?.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold">{group.supervisor?.firstName} {group.supervisor?.lastName}</div>
                                                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>{group.supervisor?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-muted">
                                                    {group.supervisorRequestDate ? new Date(group.supervisorRequestDate).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-3 py-2 text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <a
                                                            href={`mailto:${group.supervisor?.email}?subject=Pending FYP Group Request: ${group.groupName}&body=Dear ${group.supervisor?.firstName}, You have a pending group project request for "${group.projectTitle}". Please respond to it on the FYP Portal.`}
                                                            className="btn btn-sm btn-outline-secondary"
                                                            style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
                                                            title="Remind via Email"
                                                        >
                                                            Remind
                                                        </a>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
                                                            onClick={() => window.location.href = `/coordinator/groups?supervisorStatus=pending`}
                                                        >
                                                            Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Management Grid */}
                <div>
                    <h6 className="section-title mb-3" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>Command Center</h6>
                    <div className="action-grid-minimal">
                        {actions.map((action, idx) => (
                            <div key={idx} className="action-card-minimal" onClick={() => window.location.href = action.link}>
                                <div className="action-icon-minimal">
                                    {action.icon}
                                </div>
                                <h6>{action.title}</h6>
                                <p>{action.desc}</p>
                                <div className="mt-3 d-flex align-items-center text-primary fw-bold" style={{ fontSize: '0.65rem' }}>
                                    ACCESS MODULE <HiOutlineArrowRight className="ms-1" size={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Utility */}
                <div className="mt-4 p-3 bg-white border rounded shadow-sm d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle me-3">
                            <HiOutlineCalendar size={20} />
                        </div>
                        <div>
                            <h6 className="fw-bold m-0" style={{ fontSize: '0.8rem' }}>System Health Check</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '0.65rem' }}>Automated monitoring of group formation and supervisor response rates is active.</p>
                        </div>
                    </div>
                    <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: '0.55rem' }}>v2.0.4 - STABLE</span>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CoordinatorDashboard;
