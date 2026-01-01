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
    HiOutlineClipboardList
} from 'react-icons/hi';
import './SupervisorDashboard.css';

import StatsCard from '../../components/StatsCard';

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
                    studentCount += 1; // student1
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
        <DashboardLayout title="Loading...">
            <div className="d-flex justify-content-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title={`Welcome, ${user?.firstName}!`}>
            <div className="container-fluid p-0">
                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <StatsCard
                            title="Pending Requests"
                            value={stats.pendingRequests}
                            icon={<HiOutlineMail size={28} />}
                            color="warning"
                            subtitle="Requires Action"
                        />
                    </div>

                    <div className="col-md-4">
                        <StatsCard
                            title="Active Groups"
                            value={stats.activeGroups}
                            icon={<HiOutlineUserGroup size={28} />}
                            color="success"
                            subtitle="Ongoing FYP"
                        />
                    </div>

                    <div className="col-md-4">
                        <StatsCard
                            title="Supervised Students"
                            value={stats.totalStudents}
                            icon={<HiOutlineAcademicCap size={28} />}
                            color="primary"
                            subtitle="Total Enrolled"
                        />
                    </div>
                </div>


                <div className="row mb-3">
                    <div className="col-12">
                        <h6 className="fw-bold mb-3 font-outfit text-dark">Quick Management Actions</h6>
                        <div className="row g-4">
                            <div className="col-sm-6 col-md-4 col-lg-3">
                                <div
                                    className="card action-card border-0 shadow-sm rounded-4 h-100 p-3 cursor-pointer"
                                    onClick={() => window.location.href = '/supervisor/requests'}
                                >
                                    <div className="card-body">
                                        <div className="action-icon-wrapper bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center mb-4">
                                            <HiOutlineMail size={24} />
                                        </div>
                                        <h6 className="fw-bold text-dark mb-2">Review Requests</h6>
                                        <p className="text-muted small mb-3">Handle incoming supervision requests from student groups.</p>
                                        <div className="text-primary fw-bold small d-flex align-items-center">
                                            View Requests <span className="ms-2">→</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-6 col-md-4 col-lg-3">
                                <div
                                    className="card action-card border-0 shadow-sm rounded-4 h-100 p-3 cursor-pointer"
                                    onClick={() => window.location.href = '/supervisor/groups'}
                                >
                                    <div className="card-body">
                                        <div className="action-icon-wrapper bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center mb-4">
                                            <HiOutlineUserGroup size={24} />
                                        </div>
                                        <h6 className="fw-bold text-dark mb-2">Manage Groups</h6>
                                        <p className="text-muted small mb-3">Monitor and guide your assigned final year project groups.</p>
                                        <div className="text-success fw-bold small d-flex align-items-center">
                                            Manage Groups <span className="ms-2">→</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 p-3">
                            <h6 className="fw-bold mb-3 font-outfit text-dark">Recent Notifications</h6>
                            <div className="list-group list-group-flush">
                                {stats.pendingRequests > 0 ? (
                                    <div className="list-group-item px-0 py-3 border-0 border-bottom">
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle bg-warning bg-opacity-10 p-2 me-3 text-warning">
                                                <HiOutlineBell size={20} />
                                            </div>
                                            <div>
                                                <p className="mb-0 fw-bold">Pending Supervision Requests</p>
                                                <p className="mb-0 small text-muted">You have <strong>{stats.pendingRequests}</strong> groups waiting for your approval.</p>
                                            </div>
                                            <Link to="/supervisor/requests" className="ms-auto btn btn-light btn-sm rounded-pill px-3 py-1 fw-bold">
                                                View <HiOutlineChevronRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted small">No new notifications. Everything is up to date!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SupervisorDashboard;
