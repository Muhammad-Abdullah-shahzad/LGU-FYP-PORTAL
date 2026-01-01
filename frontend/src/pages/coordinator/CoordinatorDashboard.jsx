import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorDashboard.css';

import { HiOutlineUsers, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCalendar } from 'react-icons/hi';
import StatsCard from '../../components/StatsCard';

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
        <DashboardLayout title="Coordinator Overview">
            <div className="d-flex justify-content-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="Coordinator Overview">
            <div className="container-fluid p-0">
                <div className="row g-4 mb-5">
                    <div className="col-md-6 col-xl-3">
                        <StatsCard
                            title="Total Students"
                            value={stats.students}
                            icon={<HiOutlineUsers size={28} />}
                            color="primary"
                        />
                    </div>
                    <div className="col-md-6 col-xl-3">
                        <StatsCard
                            title="Supervisors"
                            value={stats.supervisors}
                            icon={<HiOutlineAcademicCap size={28} />}
                            color="info"
                        />
                    </div>
                    <div className="col-md-6 col-xl-3">
                        <StatsCard
                            title="Total Groups"
                            value={stats.groups}
                            icon={<HiOutlineUserGroup size={28} />}
                            color="success"
                        />
                    </div>
                    <div className="col-md-6 col-xl-3">
                        <StatsCard
                            title="Active Timelines"
                            value={stats.activeTimelines}
                            icon={<HiOutlineCalendar size={28} />}
                            color="warning"
                        />
                    </div>
                </div>

                <div className="welcome-banner rounded-4 p-4 mb-4 text-white shadow">
                    <div className="welcome-banner-content">
                        <h4 className="fw-bold mb-2 font-outfit">System Administration Control Panel</h4>
                        <p className="small mb-0 opacity-75" style={{ maxWidth: '800px' }}>
                            Welcome to the FYP Management System administration hub. Oversee project groups,
                            manage users, schedule defense panels, and maintain the academic timeline for the university.
                        </p>
                    </div>
                </div>

                <div className="mb-3">
                    <h6 className="fw-bold font-outfit text-dark mb-3">Quick Management Actions</h6>
                    <div className="row g-4">
                        {[
                            { title: 'User Administration', desc: 'Manage accounts for students, supervisors, and panel members.', icon: <HiOutlineUsers size={24} />, link: '/coordinator/users', color: 'primary' },
                            { title: 'Project Oversight', desc: 'Monitor group formations, project domains, and supervisor matches.', icon: <HiOutlineUserGroup size={24} />, link: '/coordinator/groups', color: 'success' },
                            { title: 'Defense Scheduling', desc: 'Create panels and schedule defense sessions for groups.', icon: <HiOutlineAcademicCap size={24} />, link: '/coordinator/panels', color: 'info' },
                            { title: 'System Timeline', desc: 'Setup phases for registration, submission, and defenses.', icon: <HiOutlineCalendar size={24} />, link: '/coordinator/timeline', color: 'warning' },
                        ].map((action, idx) => (
                            <div key={idx} className="col-md-6 col-lg-3">
                                <div
                                    className="card action-card border-0 shadow-sm rounded-4 h-100 p-3 cursor-pointer"
                                    onClick={() => window.location.href = action.link}
                                >
                                    <div className="card-body">
                                        <div className={`action-icon-wrapper bg-${action.color} bg-opacity-10 text-${action.color} rounded-3 d-flex align-items-center justify-content-center mb-4`}>
                                            {action.icon}
                                        </div>
                                        <h6 className="fw-bold text-dark mb-2">{action.title}</h6>
                                        <p className="text-muted small mb-3">{action.desc}</p>
                                        <div className={`text-${action.color} fw-bold small d-flex align-items-center`}>
                                            Manage Now <span className="ms-2">→</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CoordinatorDashboard;
