import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './StudentProposal.css';
import {
    HiOutlineDocumentText,
    HiOutlineUser,
    HiOutlineInformationCircle,
    HiOutlineLibrary,
    HiOutlinePencilAlt,
    HiOutlineCloudUpload,
    HiOutlineShieldCheck,
    HiOutlineExclamationCircle,
    HiOutlineBookOpen
} from 'react-icons/hi';

const DOMAINS = ['AI', 'ML', 'Deep Learning', 'CV', 'NLP', 'LLM', 'Web Development', 'Mobile Development', 'Desktop', 'AR/VR', 'Game', 'Software Engineering', 'Artificial Intelligence', 'Data Science', 'Cybersecurity'];

const StudentProposal = () => {
    const [group, setGroup] = useState(null);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingDomain, setEditingDomain] = useState(false);
    const [tempDomain, setTempDomain] = useState('');

    const [formData, setFormData] = useState({
        description: '',
        objectives: '',
        supervisorId: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { user } = useAuth();
    const isLeader = group && user && group.leader?._id === user._id;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const groupRes = await api.get('/groups/my-group');
            if (groupRes.data) {
                setGroup(groupRes.data);
                if (groupRes.data.supervisor) {
                    setFormData(prev => ({ ...prev, supervisorId: groupRes.data.supervisor._id }));
                }
                setFormData(prev => ({
                    ...prev,
                    description: groupRes.data.projectSummary || ''
                }));
            }

            const supervisorsRes = await api.get('/users/supervisors');
            setSupervisors(supervisorsRes.data.supervisors || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            if (formData.supervisorId && (!group.supervisor || formData.supervisorId !== group.supervisor._id)) {
                await api.post(`/groups/${group._id}/request-supervisor`, {
                    supervisorId: formData.supervisorId
                });
            }

            setSuccess('Project documentation and supervisor request updated successfully!');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit proposal');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateDetails = async (updates) => {
        try {
            setSubmitting(true);
            const res = await api.put(`/groups/${group._id}/details`, updates);
            setGroup(res.data.group);
            setSuccess('Project details updated successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update details');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Proposal Submission">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!group) {
        return (
            <DashboardLayout title="Project Proposal">
                <div className="proposal-container d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
                    <div className="glass-card text-center p-5" style={{ maxWidth: '450px' }}>
                        <div className="icon-circle mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
                            <HiOutlineExclamationCircle />
                        </div>
                        <h5 className="fw-bold text-dark mb-2">Group Not Found</h5>
                        <p className="text-muted small mb-4">You must initialize an FYP project group before you can access the proposal workspace.</p>
                        <button className="modern-btn btn btn-primary w-100" onClick={() => window.location.href = '/student/group'}>Form Group Now</button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Project Proposal">
            <div className="proposal-container">
                <div className="glass-card p-0 overflow-hidden bg-white border-0 shadow-sm">
                    {/* Minimalist Header */}
                    <div className="bg-white border-bottom p-4">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h5 className="fw-bold text-dark mb-1">Proposal Workspace</h5>
                                <p className="text-muted small mb-0">Define your project scope and request faculty guidance.</p>
                            </div>
                            <span className="badge bg-success text-white rounded-pill px-2 py-1 text-uppercase" style={{ fontSize: '0.55rem', fontWeight: '800' }}>
                                STATUS: {group.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="p-4">
                        {error && <div className="alert alert-danger py-2 px-3 small fw-bold mb-4">{error}</div>}
                        {success && <div className="alert alert-success py-2 px-3 small fw-bold mb-4">{success}</div>}

                        {group && (group.status.includes('rejected') || group.status === 'failed') && group.status !== 'proposal_rejected' && (
                            <div className="alert alert-danger border-0 rounded-3 shadow-sm mb-4 d-flex align-items-center gap-3 py-3">
                                <HiOutlineExclamationCircle size={24} className="flex-shrink-0" />
                                <div>
                                    <h6 className="fw-bold mb-1">Project Workflow Halted</h6>
                                    <p className="small mb-0 opacity-75">This project has been officially rejected by the review committee. No further modifications or document submissions are permitted for this group.</p>
                                </div>
                            </div>
                        )}

                        {group && group.status === 'proposal_rejected' && (
                            <div className="alert alert-primary border-0 rounded-3 shadow-sm mb-4 d-flex align-items-center gap-3 py-3">
                                <HiOutlineInformationCircle size={24} className="flex-shrink-0" />
                                <div>
                                    <h6 className="fw-bold mb-1">Re-Proposal Phase Active</h6>
                                    <p className="small mb-0 opacity-75">Your initial proposal was rejected. You are now permitted to revise your documentation and request a new supervisor if needed.</p>
                                </div>
                            </div>
                        )}

                        {!isLeader && (
                            <div className="view-only-alert mb-4">
                                <div className="d-flex align-items-center">
                                    <HiOutlineInformationCircle className="me-2" size={16} />
                                    <div>
                                        <strong>Read-Only View:</strong> Only the group leader ({group.leader?.firstName}) can modify the official proposal.
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                {/* Left Side: Identity & Supervisor */}
                                <div className="col-lg-5">
                                    <div className="mb-4">
                                        <h6 className="modern-label mb-3">Project Identity</h6>
                                        <div className="detail-box mb-3">
                                            <label>Working Title</label>
                                            <h5 className="text-dark m-0" style={{ fontSize: '0.9rem' }}>{group.projectTitle}</h5>
                                        </div>
                                        <div className="detail-box">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <label className="m-0">Academic Domain</label>
                                                {isLeader && group.status === 'proposal_rejected' && !submitting && !editingDomain && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-link p-0 text-primary small"
                                                        style={{ fontSize: '0.65rem', textDecoration: 'none' }}
                                                        onClick={() => {
                                                            setTempDomain(group.projectDomain);
                                                            setEditingDomain(true);
                                                        }}
                                                    >
                                                        Change Domain
                                                    </button>
                                                )}
                                            </div>

                                            {editingDomain ? (
                                                <div className="d-flex gap-2">
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={tempDomain}
                                                        onChange={(e) => setTempDomain(e.target.value)}
                                                        style={{ fontSize: '0.8rem' }}
                                                    >
                                                        <option value="">Select Domain</option>
                                                        {DOMAINS.map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-success px-2 py-0"
                                                        style={{ fontSize: '0.7rem' }}
                                                        onClick={() => {
                                                            if (tempDomain && tempDomain !== group.projectDomain) {
                                                                handleUpdateDetails({ projectDomain: tempDomain });
                                                            }
                                                            setEditingDomain(false);
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary px-2 py-0"
                                                        style={{ fontSize: '0.7rem' }}
                                                        onClick={() => setEditingDomain(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="d-flex align-items-center text-primary" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                                    <HiOutlineLibrary className="me-2" />
                                                    {group.projectDomain}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h6 className="modern-label mb-3">Faculty Advisor</h6>
                                        <div className="supervisor-card shadow-none">
                                            <label className="modern-label">Supervisor</label>
                                            <select
                                                className="modern-select mb-3"
                                                value={formData.supervisorId}
                                                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                                                required
                                                disabled={(group.supervisorStatus === 'approved' && group.status !== 'proposal_rejected') || !isLeader}
                                            >
                                                <option value="">Choose Advisor...</option>
                                                {supervisors.map(s => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.firstName} {s.lastName} — {s.domain}
                                                    </option>
                                                ))}
                                            </select>

                                            <div className="d-flex align-items-center justify-content-between">
                                                <span className="text-muted" style={{ fontSize: '0.65rem' }}>Current Status:</span>
                                                {group.supervisorStatus === 'pending' ? (
                                                    <span className="badge bg-warning text-dark border-0 px-2 py-1 rounded-pill" style={{ fontSize: '0.55rem' }}>Pending</span>
                                                ) : group.supervisorStatus === 'approved' ? (
                                                    <span className="badge bg-success text-white border-0 px-2 py-1 rounded-pill" style={{ fontSize: '0.55rem' }}>Confirmed</span>
                                                ) : (
                                                    <span className="text-muted italic small" style={{ fontSize: '0.65rem' }}>Not Requested</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Content */}
                                <div className="col-lg-7">
                                    <h6 className="modern-label mb-3">Project Scope & Abstract</h6>
                                    <div className="position-relative">
                                        <textarea
                                            className="modern-textarea"
                                            rows="12"
                                            placeholder="Outline your project vision, methodology, and objectives..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            required
                                            disabled={!isLeader || (group.status.includes('rejected') && group.status !== 'proposal_rejected') || group.status === 'failed'}
                                            style={{ fontSize: '0.85rem', lineHeight: '1.6' }}
                                        ></textarea>
                                        {isLeader && <HiOutlinePencilAlt className="position-absolute top-0 end-0 m-3 text-muted opacity-25" size={18} />}
                                    </div>

                                    {isLeader && (
                                        <div className="mt-4">
                                            <button
                                                type="submit"
                                                className="modern-btn btn btn-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                                                disabled={submitting || group.status === 'proposal_submitted' || (group.status.includes('rejected') && group.status !== 'proposal_rejected') || group.status === 'failed'}
                                            >
                                                {submitting ? (
                                                    <div className="spinner-border spinner-border-sm"></div>
                                                ) : (
                                                    <>
                                                        <HiOutlineCloudUpload size={18} />
                                                        {group.proposalDocument ? 'Update Submission' : 'Commit Proposal'}
                                                    </>
                                                )}
                                            </button>
                                            <div className="text-center mt-2">
                                                <small className="text-muted" style={{ fontSize: '0.6rem' }}>
                                                    Collective work of the group. Coordinator review follows submission.
                                                </small>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Compliance Verification Footer */}
                <div className="mt-4 p-3 bg-white border rounded shadow-sm d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <HiOutlineShieldCheck className="text-success me-2" size={24} />
                        <div>
                            <h6 className="fw-bold m-0" style={{ fontSize: '0.8rem' }}>Compliance Check</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '0.65rem' }}>All submissions are monitored for originality and alignment with LGU standards.</p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <HiOutlineBookOpen className="text-muted" size={16} />
                        <span className="text-muted fw-bold" style={{ fontSize: '0.65rem' }}>PHASE: PROPOSAL</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProposal;
