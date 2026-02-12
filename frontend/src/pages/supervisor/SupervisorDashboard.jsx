import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import {
    HiOutlineMail,
    HiOutlineUserGroup,
    HiOutlineAcademicCap,
    HiOutlineChevronRight,
    HiOutlineBell,
    HiOutlineClipboardList,
    HiOutlineArrowRight
} from 'react-icons/hi';
import './SupervisorDashboard.css';

const SupervisorDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pendingRequests: 0,
        activeGroups: 0,
        totalStudents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [requestsRes, groupsRes] = await Promise.all([
                    api.get('/groups/supervisor/requests'),
                    api.get('/groups/supervisor/my-groups')
                ]);

                const myGroups = groupsRes.data.groups || [];
                const pendingRequests = (requestsRes.data.requests || []).length;

                let studentCount = 0;
                myGroups.forEach(group => {
                    studentCount += 1;
                    if (group.student2) studentCount += 1;
                });

                setStats({
                    pendingRequests: pendingRequests,
                    activeGroups: myGroups.length,
                    totalStudents: studentCount
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <DashboardLayout title="Supervisor Control">
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="Supervisor Dashboard">
            <div className="supervisor-container">
                {/* Header Section */}
                <div className="mb-4">
                    <h5 className="fw-bold text-dark mb-1">Welcome, {user?.firstName}</h5>
                    <p className="text-muted small">Overview of your supervision requests and assigned FYP groups.</p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {[
                        { label: 'Pending Requests', value: stats.pendingRequests, icon: <HiOutlineMail />, color: 'warning' },
                        { label: 'Active Groups', value: stats.activeGroups, icon: <HiOutlineUserGroup />, color: 'success' },
                        { label: 'Supervised Students', value: stats.totalStudents, icon: <HiOutlineAcademicCap />, color: 'primary' }
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

                {/* Management Hub */}
                <div className="mb-4">
                    <h6 className="section-title mb-3">Management Command Center</h6>
                    <div className="action-grid-minimal">
                        <div className="action-card-minimal" onClick={() => window.location.href = '/supervisor/requests'}>
                            <div className="action-icon-minimal">
                                <HiOutlineMail size={18} />
                            </div>
                            <h6>Supervision Requests</h6>
                            <p>Review and accept incoming group invitations for FYP supervision.</p>
                            <div className="mt-3 d-flex align-items-center text-primary fw-bold" style={{ fontSize: '0.65rem' }}>
                                VIEW REQUESTS <HiOutlineArrowRight className="ms-1" size={12} />
                            </div>
                        </div>

                        <div className="action-card-minimal" onClick={() => window.location.href = '/supervisor/groups'}>
                            <div className="action-icon-minimal">
                                <HiOutlineUserGroup size={18} />
                            </div>
                            <h6>Assigned Groups</h6>
                            <p>Monitor progress and provide technical guidance to your active project teams.</p>
                            <div className="mt-3 d-flex align-items-center text-primary fw-bold" style={{ fontSize: '0.65rem' }}>
                                MANAGE GROUPS <HiOutlineArrowRight className="ms-1" size={12} />
                            </div>
                        </div>

                        <div className="action-card-minimal">
                            <div className="action-icon-minimal">
                                <HiOutlineClipboardList size={18} />
                            </div>
                            <h6>Evaluations</h6>
                            <p>Track project documentation, SRS reviews, and upcoming internal defenses.</p>
                            <div className="mt-3 d-flex align-items-center text-muted fw-bold" style={{ fontSize: '0.65rem' }}>
                                COMING SOON
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications & Recent Activity */}
                <div className="row g-4 pb-4">
                    <div className="col-lg-8">
                        <div className="notification-box h-100">
                            <h6 className="section-title mb-3">Recent Notifications</h6>
                            <div className="notification-list">
                                {stats.pendingRequests > 0 ? (
                                    <div className="notification-item">
                                        <div className="notif-icon">
                                            <HiOutlineBell size={16} />
                                        </div>
                                        <div className="notif-content">
                                            <p>Pending Group Requests</p>
                                            <span>You have {stats.pendingRequests} groups awaiting your approval.</span>
                                        </div>
                                        <button className="view-btn-minimal" onClick={() => window.location.href = '/supervisor/requests'}>
                                            View
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted small m-0">No new notifications. All requests handled.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="notification-box h-100">
                            <h6 className="section-title mb-2">Faculty Tip</h6>
                            <p className="text-muted m-0" style={{ fontSize: '0.7rem', lineHeight: '1.5' }}>
                                Regular meetings with your FYP groups increase success rates. Use the evaluation module to keep track of weekly milestones.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SupervisorDashboard;
