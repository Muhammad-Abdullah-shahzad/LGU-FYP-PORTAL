import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { HiOutlineMail, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import './SupervisorRequests.css';

const SupervisorRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/groups/supervisor/requests');
            setRequests(res.data.requests || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (groupId, action) => {
        setActionLoading(groupId);
        try {
            await api.put(`/groups/${groupId}/supervisor-response`, { action });
            setRequests(requests.filter(req => req._id !== groupId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update request');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <DashboardLayout title="Requests Pool">
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="Supervision Requests">
            <div className="requests-grid-wrapper">
                {requests.length === 0 ? (
                    <div className="text-center py-5 bg-white border rounded-3 shadow-sm">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                            <HiOutlineMail size={32} className="text-muted opacity-40" />
                        </div>
                        <h6 className="fw-bold text-dark">No Pending Invitations</h6>
                        <p className="text-muted small">New supervision requests from student groups will appear here.</p>
                    </div>
                ) : (
                    <div className="row g-3">
                        {requests.map((group) => (
                            <div key={group._id} className="col-md-6 col-xl-4">
                                <div className="request-card-minimal">
                                    <div className="request-body">
                                        <span className="domain-pill">{group.projectDomain || 'General SE'}</span>
                                        <h6 className="request-title">{group.projectTitle}</h6>
                                        <p className="request-summary">{group.projectSummary}</p>

                                        <div className="member-box">
                                            <h6 className="modern-label mb-2" style={{ fontSize: '0.6rem', color: '#94a3b8' }}>PROPOSED TEAM</h6>
                                            {[group.student1, group.student2].filter(Boolean).map((student) => (
                                                <div key={student._id} className="member-item">
                                                    <div className="member-initials">
                                                        {student.firstName[0]}{student.lastName[0]}
                                                    </div>
                                                    <div className="member-meta">
                                                        <p>{student.firstName} {student.lastName}</p>
                                                        <span>{student.registrationNumber}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="request-footer">
                                        <button
                                            className="btn-minimal-success"
                                            onClick={() => handleAction(group._id, 'approve')}
                                            disabled={actionLoading === group._id}
                                        >
                                            {actionLoading === group._id ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                <><HiOutlineCheck className="me-1" size={14} /> Accept Request</>
                                            )}
                                        </button>
                                        <button
                                            className="btn-minimal-danger"
                                            onClick={() => handleAction(group._id, 'reject')}
                                            disabled={actionLoading === group._id}
                                        >
                                            <HiOutlineX size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SupervisorRequests;
