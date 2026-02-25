import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import './SupervisorEvaluations.css';
import {
    HiOutlineClipboardCheck,
    HiOutlineExclamationCircle,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineX,
    HiOutlineCollection
} from 'react-icons/hi';

const SupervisorEvaluations = () => {
    const [panels, setPanels] = useState([]);
    const [activePhases, setActivePhases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [evaluatingGroup, setEvaluatingGroup] = useState(null);
    const [filter, setFilter] = useState('active');
    const [evaluationData, setEvaluationData] = useState({
        status: '',
        remarks: '',
        phase: '',
        marks: {
            understanding: 0,
            design: 0,
            originality: 0,
            presentation: 0
        }
    });

    useEffect(() => {
        fetchEvaluationData();
    }, []);

    const fetchEvaluationData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/groups/supervisor/evaluations');
            setPanels(res.data.panels || []);
            setActivePhases(res.data.activePhases || []);
        } catch (err) {
            console.error('Error fetching evaluations:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPanels = panels.map(panel => ({
        ...panel,
        assignedGroups: (panel.assignedGroups || []).filter(g => {
            // General Exclusions
            const isCompleted = g.status === 'completed';
            const isFailed = g.status === 'failed';

            // Define relevance to active phases
            const isRelevantToActivePhase = activePhases.some(phase => {
                if (phase === 'proposal' || phase === 're-proposal') {
                    return ['registered', 'proposal_submitted', 'proposal_revision', 're-proposal', 'proposal_rejected'].includes(g.status);
                }
                if (phase === 'srs' || phase === 're-srs') {
                    return ['proposal_approved', 'srs_submitted', 'srs_revision', 'srs_rejected'].includes(g.status);
                }
                if (phase === 'internal' || phase === 're-internal') {
                    return ['srs_approved', 'internal_minor_revision', 'internal_rejected'].includes(g.status); // internal_submitted? usually implied by srs_approved
                }
                if (phase === 'external') {
                    return ['internal_approved'].includes(g.status);
                }
                return false;
            });

            if (filter === 'active') {
                if (isCompleted || isFailed) return false;
                if (!isRelevantToActivePhase) return false;

                // Explicitly exclude revision statuses from pending active view
                if (g.status.includes('revision') || g.status.includes('minor_revision')) return false;

                // Hide if approved for the specific active phase AND next phase is not active
                if (g.status === 'proposal_approved' && !activePhases.includes('srs')) return false;
                if (g.status === 'srs_approved' && !activePhases.includes('internal')) return false;
                if (g.status === 'internal_approved' && !activePhases.includes('external')) return false;

                return true;
            }

            // For other tabs (Revision, Approved, Rejected), also enforce active phase relevance?
            // "only show that specific phase pending approve rejected accepted"
            // Yes, user wants to see only relevant data.
            // But if I want to see history? Maybe not.
            // But the prompt says "when a specific phase is active then only show that specific phase"
            // So strictly filter by relevance to active phases for ALL tabs.

            if (!isRelevantToActivePhase && activePhases.length > 0) return false;

            if (filter === 'revision') return g.status.includes('revision') || g.status.includes('minor_revision');
            if (filter === 'approved') return g.status.includes('approved') || g.status === 'completed';
            if (filter === 'rejected') return g.status.includes('rejected') || g.status === 'failed';

            return true;
        })
    })).filter(p => p.assignedGroups.length > 0);

    const handleOpenModal = (group, status) => {
        // Determine phase automatically based on Group Status + Active Timeline
        let defaultPhase = activePhases[0] || 'proposal';

        // Priority: Match Group Status to Next Phase
        if (group.status === 'proposal_approved' && activePhases.includes('srs')) {
            defaultPhase = 'srs';
        } else if (group.status === 'srs_approved' && activePhases.includes('internal')) {
            defaultPhase = 'internal';
        } else if (group.status === 'internal_approved' && activePhases.includes('external')) {
            defaultPhase = 'external';
        }

        // Re-defense priorities
        else if ((group.status === 'proposal_rejected' || group.status === 'proposal_revision' || group.status === 're-proposal') && activePhases.includes('re-proposal')) {
            defaultPhase = 're-proposal';
        }
        else if ((group.status === 'srs_rejected' || group.status === 'srs_revision') && activePhases.includes('re-srs')) {
            defaultPhase = 're-srs';
        }
        else if ((group.status === 'internal_rejected' || group.status === 'internal_minor_revision') && activePhases.includes('re-internal')) {
            defaultPhase = 're-internal';
        }

        // Fallback: If currently in a revision state, stick to that phase
        else if (group.status.includes('proposal') && activePhases.includes('proposal')) defaultPhase = 'proposal';
        else if (group.status.includes('srs') && activePhases.includes('srs')) defaultPhase = 'srs';
        else if (group.status.includes('internal') && activePhases.includes('internal')) defaultPhase = 'internal';

        setEvaluatingGroup(group);
        setEvaluationData({
            status: status,
            remarks: '',
            phase: defaultPhase,
            marks: {
                understanding: 0,
                design: 0,
                originality: 0,
                presentation: 0
            }
        });
    };

    const handleSubmitEvaluation = async () => {
        if (!evaluationData.remarks) {
            alert('Please provide evaluation remarks');
            return;
        }

        // Basic validation for marks
        const { marks } = evaluationData;
        const invalid = Object.values(marks).some(v => v === '' || v < 0 || v > 5);
        if (invalid) {
            alert('Please provide valid marks (0-5) for all sections');
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
                            className={`btn btn-sm rounded-2 px-3 fw-bold transition-all ${filter === 'revision' ? 'bg-white shadow-sm text-warning' : 'text-muted border-0'}`}
                            onClick={() => setFilter('revision')}
                            style={{ fontSize: '0.7rem' }}
                        >
                            REVISE
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

                {filteredPanels.length === 0 ? (
                    <div className="text-center py-5 bg-white border rounded-3 shadow-sm">
                        <HiOutlineClipboardCheck size={48} className="text-muted opacity-20 mb-3" />
                        <h6 className="fw-bold text-dark">No Groups Found</h6>
                        <p className="text-muted small">All evaluations for your panels are complete.</p>
                    </div>
                ) : (
                    <div className="panels-list">
                        {filteredPanels.map((panel) => (
                            <div key={panel._id} className="panel-section mb-5">
                                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                            <HiOutlineCollection size={20} />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold m-0" style={{ fontSize: '0.95rem' }}>{panel.panelName}</h5>
                                            <div className="text-muted x-small text-uppercase fw-bold" style={{ fontSize: '0.6rem' }}>
                                                {panel.panelType.replace('-', ' ')} PANEL • {panel.academicYear}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '0.65rem' }}>
                                        {panel.assignedGroups.length} Groups Assigned
                                    </span>
                                </div>

                                <div className="row g-3">
                                    {panel.assignedGroups.map((group) => (
                                        <div key={group._id} className="col-md-6 col-xl-4">
                                            <div className="eval-card-minimal">
                                                <div className="eval-body">
                                                    <div className="eval-meta">
                                                        <span className="eval-badge">{group.groupName}</span>
                                                        <span className="text-muted" style={{ fontSize: '0.6rem' }}>SEM {group.semester}</span>
                                                    </div>
                                                    <h6 className="eval-title text-truncate" title={group.projectTitle}>{group.projectTitle}</h6>
                                                    <div className="mb-3 d-flex flex-wrap gap-1">
                                                        {[group.student1, group.student2].filter(Boolean).map((s, i) => (
                                                            <span key={i} className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '0.65rem' }}>
                                                                {s.firstName} {s.lastName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className={`p-2 rounded bg-light border-start border-${group.status.includes('rejected') || group.status === 'failed' ? 'danger' : group.status.includes('approved') ? 'success' : 'primary'} border-4 mb-2`}>
                                                        <div className="text-uppercase fw-800 text-muted mb-1" style={{ fontSize: '0.55rem' }}>Milestone Status</div>
                                                        <div className={`fw-bold ${group.status.includes('rejected') || group.status === 'failed' ? 'text-danger' : 'text-dark'} text-uppercase`} style={{ fontSize: '0.75rem' }}>
                                                            {group.status.replace('_', ' ')}
                                                        </div>
                                                    </div>

                                                    {/* Supervisor Approval Status */}
                                                    {(() => {
                                                        const phase = activePhases[0]; // Simplified: use first active phase
                                                        let approval = group[`${phase}SupervisorApproval`];
                                                        let remarks = group[`${phase}SupervisorRemarks`];

                                                        if (!approval) return null;

                                                        return (
                                                            <div className={`p-2 rounded mb-2 ${approval === 'approved' ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'} border-start border-${approval === 'approved' ? 'success' : 'warning'} border-4`}>
                                                                <div className="text-uppercase fw-800 text-muted mb-1" style={{ fontSize: '0.55rem' }}>Supervisor Decision</div>
                                                                <div className={`fw-bold ${approval === 'approved' ? 'text-success' : 'text-warning'} text-uppercase`} style={{ fontSize: '0.7rem' }}>
                                                                    {approval}
                                                                </div>
                                                                {remarks && <div className="text-muted mt-1 italic" style={{ fontSize: '0.65rem' }}>"{remarks}"</div>}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {activePhases.length > 0 && (
                                                    <div className="eval-actions">
                                                        {(() => {
                                                            const phase = activePhases[0];
                                                            const isSupervisorApproved = group[`${phase}SupervisorApproval`] === 'approved';
                                                            const isReDefense = phase.includes('re-');

                                                            // Allow evaluation if supervisor approved OR if it's a re-defense (re-defense rules might vary, but usually implies they were already in the loop)
                                                            // For simplicity and matching requirement: Block if not approved.
                                                            const canEvaluate = isSupervisorApproved || isReDefense;

                                                            return (
                                                                <>
                                                                    <button
                                                                        className={`eval-btn btn-approve ${!canEvaluate ? 'disabled opacity-50' : ''}`}
                                                                        onClick={() => canEvaluate && handleOpenModal(group, 'approved')}
                                                                        disabled={!canEvaluate}
                                                                    >
                                                                        Approve
                                                                    </button>

                                                                    {(() => {
                                                                        // Logic to hide revision after 2 attempts
                                                                        let attempts = 0;
                                                                        if (phase.includes('internal')) attempts = group.internalAttempts || 0;
                                                                        else if (phase.includes('srs')) attempts = group.srsAttempts || 0;
                                                                        else attempts = group.proposalAttempts || 0;

                                                                        if (attempts < 2) {
                                                                            return (
                                                                                <button
                                                                                    className={`eval-btn btn-revision ${!canEvaluate ? 'disabled opacity-50' : ''}`}
                                                                                    onClick={() => canEvaluate && handleOpenModal(group, 'revision')}
                                                                                    disabled={!canEvaluate}
                                                                                >
                                                                                    Revision
                                                                                </button>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}

                                                                    <button
                                                                        className={`eval-btn btn-reject ${!canEvaluate ? 'disabled opacity-50' : ''}`}
                                                                        onClick={() => canEvaluate && handleOpenModal(group, 'rejected')}
                                                                        disabled={!canEvaluate}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* Evaluation Modal - Portaled to body to ensure full screen overlay */}
            {evaluatingGroup && createPortal(
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
                            <label className="eval-form-label">Defense Marking (Max 20)</label>
                            <div className="row g-2 mb-3">
                                <div className="col-6 col-md-3">
                                    <label className="x-small text-muted fw-bold d-block mb-1">Understanding (5)</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm bg-light border-0"
                                        min="0" max="5"
                                        value={evaluationData.marks.understanding}
                                        onChange={(e) => setEvaluationData({
                                            ...evaluationData,
                                            marks: { ...evaluationData.marks, understanding: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="col-6 col-md-3">
                                    <label className="x-small text-muted fw-bold d-block mb-1">Design (5)</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm bg-light border-0"
                                        min="0" max="5"
                                        value={evaluationData.marks.design}
                                        onChange={(e) => setEvaluationData({
                                            ...evaluationData,
                                            marks: { ...evaluationData.marks, design: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="col-6 col-md-3">
                                    <label className="x-small text-muted fw-bold d-block mb-1">Originality (5)</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm bg-light border-0"
                                        min="0" max="5"
                                        value={evaluationData.marks.originality}
                                        onChange={(e) => setEvaluationData({
                                            ...evaluationData,
                                            marks: { ...evaluationData.marks, originality: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="col-6 col-md-3">
                                    <label className="x-small text-muted fw-bold d-block mb-1">Presentation (5)</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm bg-light border-0"
                                        min="0" max="5"
                                        value={evaluationData.marks.presentation}
                                        onChange={(e) => setEvaluationData({
                                            ...evaluationData,
                                            marks: { ...evaluationData.marks, presentation: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 d-flex justify-content-between align-items-center mb-3">
                                <span className="small fw-bold">Calculated Total Marks:</span>
                                <span className="h5 m-0 fw-800">
                                    {Number(evaluationData.marks.understanding) +
                                        Number(evaluationData.marks.design) +
                                        Number(evaluationData.marks.originality) +
                                        Number(evaluationData.marks.presentation)} / 20
                                </span>
                            </div>

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
                </div>,
                document.body
            )}
        </DashboardLayout>
    );
};

export default SupervisorEvaluations;
