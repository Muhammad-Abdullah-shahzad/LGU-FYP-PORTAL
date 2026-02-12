import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import {
    HiOutlineArrowLeft,
    HiOutlineDocumentText,
    HiOutlineUserGroup,
    HiOutlineCalendar,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineExclamationCircle,
    HiOutlineClock
} from 'react-icons/hi';
import './GroupDetails.css';

const GroupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroupDetails();
    }, [id]);

    const fetchGroupDetails = async () => {
        try {
            const res = await api.get(`/groups/supervisor/${id}/details`);
            setGroup(res.data.group);
        } catch (err) {
            console.error('Error fetching group details:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusIcon = (status) => {
        if (status?.includes('approved')) return <HiOutlineCheckCircle size={20} />;
        if (status?.includes('rejected') || status === 'failed') return <HiOutlineXCircle size={20} />;
        if (status?.includes('revision')) return <HiOutlineExclamationCircle size={20} />;
        return <HiOutlineClock size={20} />;
    };

    const getStatusColor = (status) => {
        if (status?.includes('approved')) return 'success';
        if (status?.includes('rejected') || status === 'failed') return 'danger';
        if (status?.includes('revision')) return 'warning';
        return 'primary';
    };

    const [approvalRemarks, setApprovalRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleDefenseApproval = async (phase, action) => {
        if (!approvalRemarks.trim()) {
            alert('Please provide remarks before taking action.');
            return;
        }

        try {
            setSubmitting(true);
            await api.put(`/groups/${id}/defense-approval`, {
                phase,
                action,
                remarks: approvalRemarks
            });
            await fetchGroupDetails();
            setApprovalRemarks('');
            alert(`Defense request ${action} successfully.`);
        } catch (err) {
            console.error('Error approving defense:', err);
            alert(err.response?.data?.message || 'Error processing request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Group Details">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!group) {
        return (
            <DashboardLayout title="Group Details">
                <div className="text-center py-5">
                    <p className="text-muted">Group not found</p>
                </div>
            </DashboardLayout>
        );
    }

    const renderApprovalSection = (phase, currentApproval) => {
        if (currentApproval !== 'pending') return null;

        return (
            <div className="approval-form mt-3 border-top pt-3">
                <label className="remarks-label">Supervisor Approval for {phase.toUpperCase()} Defense</label>
                <textarea
                    className="form-control mb-2"
                    placeholder="Enter approval/rejection remarks..."
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    rows="2"
                    style={{ fontSize: '0.85rem' }}
                />
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-success btn-sm flex-grow-1"
                        onClick={() => handleDefenseApproval(phase, 'approved')}
                        disabled={submitting}
                    >
                        {submitting ? 'Processing...' : 'Approve for Defense'}
                    </button>
                    <button
                        className="btn btn-danger btn-sm flex-grow-1"
                        onClick={() => handleDefenseApproval(phase, 'rejected')}
                        disabled={submitting}
                    >
                        {submitting ? 'Processing...' : 'Reject Defense'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout title="Group Details">
            <div className="group-details-container">
                {/* Header */}
                <div className="details-header">
                    <button className="back-btn" onClick={() => navigate('/supervisor/groups')}>
                        <HiOutlineArrowLeft size={18} />
                        <span>Back to Groups</span>
                    </button>
                    <div className="header-info">
                        <div className="group-id-badge">{group.groupName}</div>
                        <h2 className="project-title">{group.projectTitle}</h2>
                        <div className="meta-info">
                            <span className="meta-item">
                                <HiOutlineUserGroup size={16} />
                                {group.batch} {group.year}
                            </span>
                            <span className="meta-item">
                                <HiOutlineCalendar size={16} />
                                Registered: {formatDate(group.createdAt)}
                            </span>
                            <span className={`status-pill status-${getStatusColor(group.status)}`}>
                                {getStatusIcon(group.status)}
                                {group.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="details-grid">
                    {/* Left Column */}
                    <div className="details-column">
                        {/* Team Members */}
                        <div className="detail-card">
                            <div className="card-header">
                                <HiOutlineUserGroup size={20} />
                                <h3>Team Members</h3>
                            </div>
                            <div className="card-body">
                                <div className="member-item">
                                    <div className="member-avatar">{group.student1?.firstName?.charAt(0)}{group.student1?.lastName?.charAt(0)}</div>
                                    <div className="member-info">
                                        <div className="member-name">
                                            {group.student1?.firstName} {group.student1?.lastName}
                                            {group.leader?._id === group.student1?._id && <span className="leader-badge">Leader</span>}
                                        </div>
                                        <div className="member-reg">{group.student1?.registrationNumber}</div>
                                        <div className="member-email">{group.student1?.email}</div>
                                    </div>
                                </div>
                                {group.student2 && (
                                    <div className="member-item">
                                        <div className="member-avatar">{group.student2?.firstName?.charAt(0)}{group.student2?.lastName?.charAt(0)}</div>
                                        <div className="member-info">
                                            <div className="member-name">
                                                {group.student2?.firstName} {group.student2?.lastName}
                                                {group.leader?._id === group.student2?._id && <span className="leader-badge">Leader</span>}
                                            </div>
                                            <div className="member-reg">{group.student2?.registrationNumber}</div>
                                            <div className="member-email">{group.student2?.email}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Project Information */}
                        <div className="detail-card">
                            <div className="card-header">
                                <HiOutlineDocumentText size={20} />
                                <h3>Project Information</h3>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="info-label">Domain</span>
                                    <span className="domain-tag">{group.projectDomain}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Summary</span>
                                    <p className="project-summary">{group.projectSummary}</p>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="detail-card">
                            <div className="card-header">
                                <HiOutlineDocumentText size={20} />
                                <h3>Submitted Documents</h3>
                            </div>
                            <div className="card-body">
                                {group.proposalDocument && (
                                    <a href={group.proposalDocument} target="_blank" rel="noopener noreferrer" className="doc-link">
                                        <HiOutlineDocumentText size={18} />
                                        <span>Proposal Document</span>
                                    </a>
                                )}
                                {group.srsDocument && (
                                    <a href={group.srsDocument} target="_blank" rel="noopener noreferrer" className="doc-link">
                                        <HiOutlineDocumentText size={18} />
                                        <span>SRS Document</span>
                                    </a>
                                )}
                                {group.finalReport && (
                                    <a href={group.finalReport} target="_blank" rel="noopener noreferrer" className="doc-link">
                                        <HiOutlineDocumentText size={18} />
                                        <span>Final Report</span>
                                    </a>
                                )}
                                {!group.proposalDocument && !group.srsDocument && !group.finalReport && (
                                    <p className="text-muted small">No documents submitted yet</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="details-column">
                        {/* Defense Phases */}
                        <div className="detail-card">
                            <div className="card-header">
                                <HiOutlineClock size={20} />
                                <h3>Defense Phases</h3>
                            </div>
                            <div className="card-body">
                                {/* Proposal Defense */}
                                <div className="phase-section">
                                    <div className="phase-header">
                                        <h4>Proposal Defense</h4>
                                        <div className="d-flex gap-2 align-items-center">
                                            {group.proposalSupervisorApproval && (
                                                <span className={`badge bg-${group.proposalSupervisorApproval === 'approved' ? 'success' : group.proposalSupervisorApproval === 'rejected' ? 'danger' : 'warning'}`}>
                                                    Supervisor: {group.proposalSupervisorApproval.toUpperCase()}
                                                </span>
                                            )}
                                            <span className="attempt-badge">Attempts: {group.proposalAttempts || 0}</span>
                                        </div>
                                    </div>
                                    {group.proposalPanel && (
                                        <div className="panel-info">
                                            <span className="panel-label">Panel:</span>
                                            <span className="panel-name">{group.proposalPanel.name}</span>
                                        </div>
                                    )}
                                    {group.proposalDefenseDate && (
                                        <div className="phase-date">
                                            <HiOutlineCalendar size={14} />
                                            {formatDate(group.proposalDefenseDate)}
                                        </div>
                                    )}
                                    {group.proposalSupervisorRemarks && (
                                        <div className="remarks-box mb-2" style={{ borderLeft: '3px solid #13633d' }}>
                                            <div className="remarks-label">Supervisor Remarks:</div>
                                            <p className="remarks-text">{group.proposalSupervisorRemarks}</p>
                                        </div>
                                    )}
                                    {group.proposalRemarks && (
                                        <div className="remarks-box">
                                            <div className="remarks-label">Panel Evaluation Remarks:</div>
                                            <p className="remarks-text">{group.proposalRemarks}</p>
                                        </div>
                                    )}
                                    {renderApprovalSection('proposal', group.proposalSupervisorApproval)}
                                    {!group.proposalRemarks && group.proposalSupervisorApproval === 'pending' && <p className="text-muted small mt-2">Awaiting supervisor approval for defense</p>}
                                </div>

                                {/* SRS Defense */}
                                <div className="phase-section">
                                    <div className="phase-header">
                                        <h4>SRS Defense</h4>
                                        <div className="d-flex gap-2 align-items-center">
                                            {group.srsSupervisorApproval && (
                                                <span className={`badge bg-${group.srsSupervisorApproval === 'approved' ? 'success' : group.srsSupervisorApproval === 'rejected' ? 'danger' : 'warning'}`}>
                                                    Supervisor: {group.srsSupervisorApproval.toUpperCase()}
                                                </span>
                                            )}
                                            <span className="attempt-badge">Attempts: {group.srsAttempts || 0}</span>
                                        </div>
                                    </div>
                                    {group.srsPanel && (
                                        <div className="panel-info">
                                            <span className="panel-label">Panel:</span>
                                            <span className="panel-name">{group.srsPanel.name}</span>
                                        </div>
                                    )}
                                    {group.srsDefenseDate && (
                                        <div className="phase-date">
                                            <HiOutlineCalendar size={14} />
                                            {formatDate(group.srsDefenseDate)}
                                        </div>
                                    )}
                                    {group.srsSupervisorRemarks && (
                                        <div className="remarks-box mb-2" style={{ borderLeft: '3px solid #13633d' }}>
                                            <div className="remarks-label">Supervisor Remarks:</div>
                                            <p className="remarks-text">{group.srsSupervisorRemarks}</p>
                                        </div>
                                    )}
                                    {group.srsRemarks && (
                                        <div className="remarks-box">
                                            <div className="remarks-label">Panel Evaluation Remarks:</div>
                                            <p className="remarks-text">{group.srsRemarks}</p>
                                        </div>
                                    )}
                                    {renderApprovalSection('srs', group.srsSupervisorApproval)}
                                    {!group.srsRemarks && group.srsSupervisorApproval === 'pending' && <p className="text-muted small mt-2">Awaiting supervisor approval for defense</p>}
                                </div>

                                {/* Internal Defense */}
                                <div className="phase-section">
                                    <div className="phase-header">
                                        <h4>Internal Defense</h4>
                                        <div className="d-flex gap-2 align-items-center">
                                            {group.internalSupervisorApproval && (
                                                <span className={`badge bg-${group.internalSupervisorApproval === 'approved' ? 'success' : group.internalSupervisorApproval === 'rejected' ? 'danger' : 'warning'}`}>
                                                    Supervisor: {group.internalSupervisorApproval.toUpperCase()}
                                                </span>
                                            )}
                                            <span className="attempt-badge">Attempts: {group.internalAttempts || 0}</span>
                                        </div>
                                    </div>
                                    {group.internalPanel && (
                                        <div className="panel-info">
                                            <span className="panel-label">Panel:</span>
                                            <span className="panel-name">{group.internalPanel.name}</span>
                                        </div>
                                    )}
                                    {group.internalDefenseDate && (
                                        <div className="phase-date">
                                            <HiOutlineCalendar size={14} />
                                            {formatDate(group.internalDefenseDate)}
                                        </div>
                                    )}
                                    {group.internalSupervisorRemarks && (
                                        <div className="remarks-box mb-2" style={{ borderLeft: '3px solid #13633d' }}>
                                            <div className="remarks-label">Supervisor Remarks:</div>
                                            <p className="remarks-text">{group.internalSupervisorRemarks}</p>
                                        </div>
                                    )}
                                    {group.internalRemarks && (
                                        <div className="remarks-box">
                                            <div className="remarks-label">Panel Evaluation Remarks:</div>
                                            <p className="remarks-text">{group.internalRemarks}</p>
                                        </div>
                                    )}
                                    {renderApprovalSection('internal', group.internalSupervisorApproval)}
                                    {!group.internalRemarks && group.internalSupervisorApproval === 'pending' && <p className="text-muted small mt-2">Awaiting supervisor approval for defense</p>}
                                </div>

                                {/* External Defense */}
                                {group.externalPanel && (
                                    <div className="phase-section">
                                        <div className="phase-header">
                                            <h4>External Defense</h4>
                                        </div>
                                        <div className="panel-info">
                                            <span className="panel-label">Panel:</span>
                                            <span className="panel-name">{group.externalPanel.name}</span>
                                        </div>
                                        {group.externalDefenseDate && (
                                            <div className="phase-date">
                                                <HiOutlineCalendar size={14} />
                                                {formatDate(group.externalDefenseDate)}
                                            </div>
                                        )}
                                        {group.externalRemarks && (
                                            <div className="remarks-box">
                                                <div className="remarks-label">Remarks:</div>
                                                <p className="remarks-text">{group.externalRemarks}</p>
                                            </div>
                                        )}
                                        {group.finalGrade && (
                                            <div className="grade-display">
                                                Final Grade: <strong>{group.finalGrade}</strong>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status History */}
                        <div className="detail-card">
                            <div className="card-header">
                                <HiOutlineClock size={20} />
                                <h3>Status History</h3>
                            </div>
                            <div className="card-body">
                                <div className="timeline">
                                    {group.statusHistory?.slice().reverse().map((history, index) => (
                                        <div key={index} className="timeline-item">
                                            <div className="timeline-marker" />
                                            <div className="timeline-content">
                                                <div className="timeline-header">
                                                    <span className={`timeline-status status-${getStatusColor(history.status)}`}>
                                                        {history.status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="timeline-date">{formatDate(history.timestamp)}</span>
                                                </div>
                                                {history.remarks && <p className="timeline-remarks">{history.remarks}</p>}
                                                {history.changedBy && (
                                                    <div className="timeline-user">
                                                        by {history.changedBy.firstName} {history.changedBy.lastName} ({history.changedBy.role})
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GroupDetails;
