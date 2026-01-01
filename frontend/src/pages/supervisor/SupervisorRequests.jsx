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
            // Success toast/alert would go here
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update request');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <DashboardLayout title="Supervision Requests">
            <div className="d-flex justify-content-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="Supervision Requests">
            <div className="container-fluid p-0 requests-container">
                {requests.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                            <HiOutlineMail size={40} className="text-muted opacity-50" />
                        </div>
                        <h3 className="fw-bold font-outfit">No Pending Requests</h3>
                        <p className="text-muted">You don't have any new supervision requests right now.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {requests.map((group) => (
                            <div key={group._id} className="col-md-6 col-xl-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden request-card-modern">
                                    <div className="card-header bg-white py-3 px-4 border-bottom-0 d-flex flex-column align-items-start gap-1">
                                        <span className="badge rounded-pill domain-badge-glass text-uppercase">{group.projectDomain || 'General'}</span>
                                        <div className="fw-bold text-muted x-small font-outfit">ID: #{group.groupName}</div>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <h5 className="fw-bold mb-3 font-outfit text-dark lh-base" style={{ minHeight: '3rem' }}>{group.projectTitle}</h5>
                                        <p className="text-muted small mb-4 summary-text">{group.projectSummary}</p>

                                        <div className="members-list-modern p-3 rounded-4 mb-4">
                                            <h6 className="x-small fw-bold text-uppercase text-muted mb-3 opacity-75">Team Members</h6>
                                            <div className="d-flex flex-column gap-2">
                                                {[group.student1, group.student2].filter(Boolean).map((student, idx) => (
                                                    <div key={student._id} className="d-flex align-items-center">
                                                        <div className="member-avatar me-2 text-primary">
                                                            {student.firstName[0]}{student.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold small">{student.firstName} {student.lastName}</div>
                                                            <div className="x-small text-muted">{student.registrationNumber}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="d-flex gap-3 mt-auto">
                                            <button
                                                className="btn btn-success flex-grow-1 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center border-0 shadow-sm transition-all"
                                                onClick={() => handleAction(group._id, 'approve')}
                                                disabled={actionLoading === group._id}
                                            >
                                                {actionLoading === group._id ? (
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                ) : <HiOutlineCheck className="me-2" size={18} />}
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-outline-danger flex-grow-1 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center transition-all"
                                                onClick={() => handleAction(group._id, 'reject')}
                                                disabled={actionLoading === group._id}
                                            >
                                                <HiOutlineX className="me-2" size={18} /> Reject
                                            </button>
                                        </div>
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
