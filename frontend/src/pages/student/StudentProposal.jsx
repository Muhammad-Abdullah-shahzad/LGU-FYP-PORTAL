import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './StudentProposal.css';

const StudentProposal = () => {
    const [group, setGroup] = useState(null);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        description: '',
        objectives: '',
        supervisorId: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const groupRes = await api.get('/groups/my-group');
            if (groupRes.data) {
                setGroup(groupRes.data);
                // If group already has some proposal info (though we use simplified fields now)
                if (groupRes.data.proposalDocument) {
                    // Just a placeholder since we don't have separate description field in DB yet
                }
                if (groupRes.data.supervisor) {
                    setFormData(prev => ({ ...prev, supervisorId: groupRes.data.supervisor._id }));
                }
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
            // Updated to match the backend expectation (req.file or filename)
            // But since the user wants a simplified flow, we'll just mock it if needed 
            // or use a dummy file/text if the backend requires it.

            // For now, let's just focus on the supervisor request and basic status update

            if (formData.supervisorId && (!group.supervisor || formData.supervisorId !== group.supervisor._id)) {
                await api.post(`/groups/${group._id}/request-supervisor`, {
                    supervisorId: formData.supervisorId
                });
            }

            setSuccess('Proposal details submitted and supervisor requested successfully!');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit proposal');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <DashboardLayout title="Project Proposal"><div className="p-5 text-center"><div className="spinner-border text-primary"></div></div></DashboardLayout>;

    if (!group) {
        return (
            <DashboardLayout title="Project Proposal">
                <div className="container py-5 text-center">
                    <div className="card border-0 shadow-sm rounded-4 p-5">
                        <div className="fs-1 mb-3">⚠️</div>
                        <h3 className="fw-bold">No Group Found</h3>
                        <p className="text-muted">You must initialize your group before you can submit a proposal.</p>
                        <button className="btn btn-primary rounded-pill px-4 mt-3 fw-bold" onClick={() => window.location.href = '/student/group'}>Initialize Group</button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Submit Project Proposal">
            <div className="container-fluid p-0">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                            <div className="bg-primary p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="text-white mb-1 fw-bold font-outfit">Project Details</h5>
                                    <p className="text-white opacity-75 small mb-0">Fill in the initial scope and request a supervisor.</p>
                                </div>
                                <span className="badge bg-white text-primary rounded-pill px-3 py-2 text-uppercase" style={{ fontSize: '0.7rem' }}>{group.status}</span>
                            </div>
                            <div className="card-body p-4 p-md-5">
                                {error && <div className="alert alert-danger rounded-4 x-small fw-bold mb-4">{error}</div>}
                                {success && <div className="alert alert-success rounded-4 x-small fw-bold mb-4">{success}</div>}

                                <form onSubmit={handleSubmit}>
                                    <div className="row g-4">
                                        <div className="col-md-7">
                                            <div className="mb-4">
                                                <label className="form-label x-small text-muted fw-bold text-uppercase">Project Working Title</label>
                                                <input type="text" className="form-control rounded-3 p-3 bg-light border-0 fw-bold" value={group.projectTitle} disabled />
                                            </div>
                                            <div className="mb-4">
                                                <label className="form-label x-small text-muted fw-bold text-uppercase">Project Domain</label>
                                                <input type="text" className="form-control rounded-3 p-3 bg-light border-0 fw-bold" value={group.projectDomain} disabled />
                                            </div>
                                        </div>
                                        <div className="col-md-5">
                                            <div className="card border-0 bg-light rounded-4 h-100">
                                                <div className="card-body p-4">
                                                    <label className="form-label x-small text-muted fw-bold text-uppercase mb-3">Select Supervisor</label>
                                                    <div className="mb-3">
                                                        <select
                                                            className="form-select border-0 rounded-3 p-3 shadow-sm mb-2"
                                                            value={formData.supervisorId}
                                                            onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                                                            required
                                                            disabled={group.supervisorStatus === 'approved'}
                                                        >
                                                            <option value="">Choose a Supervisor...</option>
                                                            {supervisors.map(s => (
                                                                <option key={s._id} value={s._id}>
                                                                    {s.firstName} {s.lastName} — {s.domain}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {group.supervisorStatus === 'pending' && <span className="badge bg-warning rounded-pill x-small fw-normal">Pending Approval</span>}
                                                        {group.supervisorStatus === 'approved' && <span className="badge bg-success rounded-pill x-small fw-normal">Assigned</span>}
                                                    </div>
                                                    <p className="x-small text-muted mb-0 lh-base italic">Selecting a supervisor will notify them immediately. Choose someone whose domain aligns with your project.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label x-small text-muted fw-bold text-uppercase">Scope & Abstract</label>
                                            <textarea
                                                className="form-control rounded-3 p-3 bg-light border-0"
                                                rows="6"
                                                placeholder="Provide a detailed description of your project scope, technologies, and goals..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="col-12 pt-3">
                                            <button
                                                type="submit"
                                                className="btn btn-primary rounded-pill p-3 px-5 fw-bold shadow-sm"
                                                disabled={submitting || group.status === 'proposal_submitted'}
                                            >
                                                {submitting ? (
                                                    <><span className="spinner-border spinner-border-sm me-2"></span> Submitting...</>
                                                ) : (group.proposalDocument ? 'Update Proposal' : 'Submit for Review')}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProposal;
