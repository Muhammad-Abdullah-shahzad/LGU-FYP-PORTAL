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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [usersRes, groupsRes, timelinesRes] = await Promise.all([
                api.get('/users'),
                api.get('/groups'),
                api.get('/timeline')
            ]);

            const users = usersRes.data.users || [];
            setStats({
                students: users.filter(u => u.role === 'student').length,
                supervisors: users.filter(u => u.role === 'supervisor').length,
                groups: groupsRes.data.count || 0,
                activeTimelines: timelinesRes.data.timelines?.filter(t => t.isActive).length || 0
            });
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
