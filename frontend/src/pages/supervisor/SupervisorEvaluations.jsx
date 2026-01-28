import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './SupervisorEvaluations.css';
import {
    HiOutlineClipboardCheck,
    HiOutlineExclamationCircle,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineX
} from 'react-icons/hi';

const SupervisorEvaluations = () => {
    const [groups, setGroups] = useState([]);
    const [activePhases, setActivePhases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [evaluatingGroup, setEvaluatingGroup] = useState(null);
    const [filter, setFilter] = useState('active'); // 'active', 'approved', 'rejected'
    const [evaluationData, setEvaluationData] = useState({
        status: '',
        remarks: '',
        phase: ''
    });

    useEffect(() => {
        fetchEvaluationData();
    }, []);

    const fetchEvaluationData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/groups/supervisor/evaluations');
            setGroups(res.data.groups || []);
            setActivePhases(res.data.activePhases || []);
        } catch (err) {
            console.error('Error fetching evaluations:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredGroups = groups.filter(g => {
        if (filter === 'active') return !g.status.includes('approved') && !g.status.includes('rejected') && g.status !== 'completed' && g.status !== 'failed';
        if (filter === 'approved') return g.status.includes('approved') || g.status === 'completed';
        if (filter === 'rejected') return g.status.includes('rejected') || g.status === 'failed';
        return true;
    });

    const handleOpenModal = (group, status) => {
        // Determine phase automatically if possible, otherwise let user choose
        // Since activePhases might have multiple, we default to the first one
        // or the one most relevant to the group's current status
        let defaultPhase = activePhases[0] || 'proposal';
        if (group.status.includes('proposal') && activePhases.includes('proposal')) defaultPhase = 'proposal';
        else if (group.status.includes('internal') && activePhases.includes('internal')) defaultPhase = 'internal';
        else if (group.status.includes('srs') && activePhases.includes('srs')) defaultPhase = 'srs';

        setEvaluatingGroup(group);
        setEvaluationData({
            status: status,
            remarks: '',
            phase: defaultPhase
        });
    };

    const handleSubmitEvaluation = async () => {
        if (!evaluationData.remarks) {
            alert('Please provide evaluation remarks');
            return;
        }

        try {
            await api.put(`/groups/${evaluatingGroup._id}/evaluate`, evaluationData);
            setEvaluatingGroup(null);
            fetchEvaluationData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit evaluation');
        }
    };

    if (loading) return (
        <DashboardLayout title="Evaluation Control">
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="Performance Evaluations">
            <div className="evaluations-container">
                {/* Active Phase Notification */}
                {activePhases.length > 0 ? (
                    <div className="phase-active-badge">
                        <HiOutlineCheckCircle size={20} />
                        <div>
                            <span>Active Defense Phase: </span>
                            <span className="text-uppercase">{activePhases.join(', ')} Defense</span>
                        </div>
                    </div>
                ) : (
                    <div className="phase-alert">
                        <HiOutlineExclamationCircle size={20} />
                        <span>No defense phases are currently active in the academic timeline.</span>
                    </div>
                )}

                <div className="mb-4 d-flex justify-content-between align-items-end">
                    <div>
                        <h5 className="fw-bold text-dark mb-1">Assigned Groups Evaluation</h5>
                        <p className="text-muted small mb-0">Perform academic grading and provide constructive feedback for your FYP groups.</p>
                    </div>

                    <div className="d-flex gap-2 bg-light p-1 rounded-3">
                        <button
                            className={`btn btn-sm rounded-2 px-3 fw-bold transition-all ${filter === 'active' ? 'bg-white shadow-sm text-primary' : 'text-muted border-0'}`}
                            onClick={() => setFilter('active')}
                            style={{ fontSize: '0.7rem' }}
                        >
                            PENDING
                        </button>
                        <button
                            className={`btn btn-sm rounded-2 px-3 fw-bold transition-all ${filter === 'approved' ? 'bg-white shadow-sm text-success' : 'text-muted border-0'}`}
                            onClick={() => setFilter('approved')}
                            style={{ fontSize: '0.7rem' }}
                        >
                            APPROVED
                        </button>
                        <button
                            className={`btn btn-sm rounded-2 px-3 fw-bold transition-all ${filter === 'rejected' ? 'bg-white shadow-sm text-danger' : 'text-muted border-0'}`}
                            onClick={() => setFilter('rejected')}
                            style={{ fontSize: '0.7rem' }}
                        >
                            REJECTED
                        </button>
                    </div>
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="text-center py-5 bg-white border rounded-3 shadow-sm">
                        <HiOutlineClipboardCheck size={48} className="text-muted opacity-20 mb-3" />
                        <h6 className="fw-bold text-dark">No Groups in this Category</h6>
                        <p className="text-muted small">All records are up to date.</p>
                    </div>
                ) : (
                    <div className="row g-3">
                        {filteredGroups.map((group) => (
                            <div key={group._id} className="col-md-6 col-xl-4">
                                <div className="eval-card-minimal">
                                    <div className="eval-body">
                                        <div className="eval-meta">
                                            <span className="eval-badge">{group.groupName}</span>
                                            <span className="text-muted" style={{ fontSize: '0.6rem' }}>SEM {group.semester}</span>
                                        </div>
                                        <h6 className="eval-title">{group.projectTitle}</h6>
                                        <div className="mb-3 d-flex gap-1">
                                            {[group.student1, group.student2].filter(Boolean).map((s, i) => (
                                                <span key={i} className="badge bg-light text-dark border fw-normal" style={{ fontSize: '0.65rem' }}>
                                                    {s.firstName} {s.lastName}
                                                </span>
                                            ))}
                                        </div>
                                        <div className={`p-2 rounded bg-light border-start border-${group.status.includes('rejected') || group.status === 'failed' ? 'danger' : group.status.includes('approved') ? 'success' : 'primary'} border-4 mb-3`}>
                                            <div className="text-uppercase fw-800 text-muted mb-1" style={{ fontSize: '0.55rem' }}>Current Milestones status</div>
                                            <div className={`fw-bold ${group.status.includes('rejected') || group.status === 'failed' ? 'text-danger' : 'text-dark'} text-uppercase`} style={{ fontSize: '0.75rem' }}>
                                                {group.status.replace('_', ' ')}
                                            </div>
                                        </div>
                                    </div>

                                    {activePhases.length > 0 && (
                                        <div className="eval-actions">
                                            <button
                                                className="eval-btn btn-approve"
                                                onClick={() => handleOpenModal(group, 'approved')}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="eval-btn btn-revision"
                                                onClick={() => handleOpenModal(group, 'revision')}
                                            >
                                                Revision
                                            </button>
                                            <button
                                                className="eval-btn btn-reject"
                                                onClick={() => handleOpenModal(group, 'rejected')}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Evaluation Modal */}
                {evaluatingGroup && (
                    <div className="eval-modal-overlay">
                        <div className="eval-modal">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="m-0">Submit Evaluation</h4>
                                <button className="btn btn-link text-muted p-0" onClick={() => setEvaluatingGroup(null)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="eval-form-label">Evaluation Phase</label>
                                <select
                                    className="form-select border-0 bg-light p-2 rounded-3"
                                    style={{ fontSize: '0.85rem' }}
                                    value={evaluationData.phase}
                                    onChange={(e) => setEvaluationData({ ...evaluationData, phase: e.target.value })}
                                >
                                    {activePhases.map(p => (
                                        <option key={p} value={p} className="text-uppercase">{p} Defense</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="eval-form-label">Decision: <span className="text-uppercase text-primary">{evaluationData.status}</span></label>
                                <label className="eval-form-label mt-3">Final Remarks & Feedback</label>
                                <textarea
                                    className="eval-textarea"
                                    placeholder="Provide detailed feedback for the students..."
                                    value={evaluationData.remarks}
                                    onChange={(e) => setEvaluationData({ ...evaluationData, remarks: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="eval-modal-footer">
                                <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setEvaluatingGroup(null)}>Cancel</button>
                                <button className="btn btn-primary rounded-pill px-4 fw-bold" onClick={handleSubmitEvaluation}>
                                    Confirm Decision
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SupervisorEvaluations;
