import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import {
    HiOutlineUserGroup,
    HiOutlineClipboardCheck,
    HiOutlineOfficeBuilding,
    HiOutlineArrowRight,
    HiOutlineStar
} from 'react-icons/hi';
import './ExternalSupervisor.css';

const ExternalSupervisorDashboard = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [evaluatingGroup, setEvaluatingGroup] = useState(null);
    const [evaluationData, setEvaluationData] = useState({
        understanding: 0,
        design: 0,
        originality: 0,
        presentation: 0,
        remarks: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups/external/my-groups');
            setGroups(res.data.groups || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluateClick = (group) => {
        setEvaluatingGroup(group);
        setEvaluationData({
            understanding: group.evaluationMarks?.external?.understanding || 0,
            design: group.evaluationMarks?.external?.design || 0,
            originality: group.evaluationMarks?.external?.originality || 0,
            presentation: group.evaluationMarks?.external?.presentation || 0,
            remarks: group.evaluationMarks?.external?.remarks || ''
        });
        setMessage({ type: '', text: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEvaluationData({
            ...evaluationData,
            [name]: value
        });
    };

    const handleSubmitEvaluation = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/groups/${evaluatingGroup._id}/external-evaluate`, evaluationData);
            setMessage({ type: 'success', text: 'Evaluation submitted successfully!' });
            fetchGroups();
            setTimeout(() => setEvaluatingGroup(null), 2000);
        } catch (error) {
            setMessage({ type: 'danger', text: error.response?.data?.message || 'Failed to submit evaluation' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <DashboardLayout title="External Supervisor">
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="External Dashboard">
            <div className="external-container p-3">
                {/* Header */}
                <div className="row mb-4 align-items-center">
                    <div className="col-md-8">
                        <h4 className="fw-bold text-dark font-outfit mb-1">External Supervisor Hub</h4>
                        <div className="d-flex align-items-center text-muted small">
                            <HiOutlineOfficeBuilding className="me-1" />
                            <span className="fw-semibold">{user?.companyName || 'Guest'}</span>
                            <span className="mx-2">|</span>
                            <span>{user?.firstName} {user?.lastName}</span>
                        </div>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                        <div className="badge bg-primary-soft text-primary p-2 px-3 rounded-pill fw-bold" style={{ fontSize: '0.7rem' }}>
                            {groups.length} ASSIGNED GROUPS
                        </div>
                    </div>
                </div>

                {/* Groups List */}
                <div className="row g-4">
                    {groups.length === 0 ? (
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                                <div className="display-4 text-muted mb-3 opacity-25">
                                    <HiOutlineUserGroup />
                                </div>
                                <h5 className="fw-bold text-secondary">No Groups Assigned Yet</h5>
                                <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
                                    The FYP Coordinator has not assigned any groups to you for external evaluation. You will receive an email once assigned.
                                </p>
                            </div>
                        </div>
                    ) : (
                        groups.map(group => (
                            <div key={group._id} className="col-lg-6 col-xl-4">
                                <div className="card h-100 border-0 shadow-soft-hover rounded-4 overflow-hidden group-card-minimal position-relative">
                                    <div className={`status-indicator ${group.evaluationMarks?.external?.status === 'completed' ? 'status-done text-success' : 'status-pending'}`}></div>
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <span className="badge bg-light text-primary fw-bold px-2 py-1 rounded-3" style={{ fontSize: '0.65rem' }}>
                                                {group.groupName}
                                            </span>
                                            {group.evaluationMarks?.external?.status === 'completed' && (
                                                <span className="text-success" title="Evaluation Completed">
                                                    <HiOutlineClipboardCheck size={20} />
                                                </span>
                                            )}
                                        </div>

                                        <h6 className="fw-bold text-dark mb-3 text-truncate-2" style={{ minHeight: '2.5rem' }}>{group.projectTitle}</h6>

                                        <div className="student-list mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <div className="avatar-xs me-2">S1</div>
                                                <div className="small">
                                                    <div className="fw-bold text-dark">{group.student1?.firstName} {group.student1?.lastName}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>{group.student1?.registrationNumber}</div>
                                                </div>
                                            </div>
                                            {group.student2 && (
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-xs me-2">S2</div>
                                                    <div className="small">
                                                        <div className="fw-bold text-dark">{group.student2?.firstName} {group.student2?.lastName}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>{group.student2?.registrationNumber}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-top mt-auto">
                                            <button
                                                className={`btn w-100 rounded-3 fw-bold font-outfit btn-sm d-flex align-items-center justify-content-center ${group.evaluationMarks?.external?.status === 'completed' ? 'btn-outline-primary' : 'btn-primary'}`}
                                                onClick={() => handleEvaluateClick(group)}
                                            >
                                                {group.evaluationMarks?.external?.status === 'completed' ? 'RE-EVALUATE' : 'EVALUATE GROUP'}
                                                <HiOutlineArrowRight className="ms-2" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Evaluation Modal/Side Panel */}
                {evaluatingGroup && (
                    <div className="custom-modal-overlay">
                        <div className="custom-modal shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header-custom p-4 text-white bg-primary d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold font-outfit">Group Evaluation</h5>
                                <button className="btn-close btn-close-white" onClick={() => setEvaluatingGroup(null)}></button>
                            </div>
                            <div className="card-body p-4 bg-white overflow-auto" style={{ maxHeight: '80vh' }}>
                                <div className="mb-4">
                                    <span className="badge bg-primary-soft text-primary mb-1">{evaluatingGroup.groupName}</span>
                                    <h6 className="fw-bold text-dark">{evaluatingGroup.projectTitle}</h6>
                                </div>

                                {message.text && (
                                    <div className={`alert alert-${message.type} py-2 small fw-bold mb-4`} role="alert">
                                        {message.text}
                                    </div>
                                )}

                                <form onSubmit={handleSubmitEvaluation}>
                                    <div className="row g-4 mb-4">
                                        {[
                                            { name: 'understanding', label: 'Understanding of Problem', icon: <HiOutlineStar /> },
                                            { name: 'design', label: 'System Design / Architecture', icon: <HiOutlineStar /> },
                                            { name: 'originality', label: 'Originality / Innovation', icon: <HiOutlineStar /> },
                                            { name: 'presentation', label: 'Presentation & Demo', icon: <HiOutlineStar /> }
                                        ].map(field => (
                                            <div key={field.name} className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary d-flex align-items-center mb-1">
                                                    {field.icon} <span className="ms-2">{field.label}</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control border-0 bg-light rounded-3 font-outfit fw-bold"
                                                    name={field.name}
                                                    value={evaluationData[field.name]}
                                                    onChange={handleInputChange}
                                                    min="0" max="25"
                                                    required
                                                />
                                                <div className="form-text x-small text-muted">Max marks: 25</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-secondary mb-1">External Supervisor Remarks</label>
                                        <textarea
                                            className="form-control border-0 bg-light rounded-3 small"
                                            rows="4"
                                            name="remarks"
                                            value={evaluationData.remarks}
                                            onChange={handleInputChange}
                                            placeholder="Provide detailed feedback for the students..."
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="mt-3 bg-light rounded-3 p-3 mb-4 text-center">
                                        <div className="text-secondary small fw-bold mb-1">TOTAL AGGREGATE MARKS</div>
                                        <div className="display-6 fw-bold text-primary">
                                            {(Number(evaluationData.understanding) || 0) +
                                                (Number(evaluationData.design) || 0) +
                                                (Number(evaluationData.originality) || 0) +
                                                (Number(evaluationData.presentation) || 0)}
                                            <span className="text-muted h4">/100</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 py-3 fw-bold rounded-3 font-outfit shadow-sm"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'SUBMITTING...' : 'SUBMIT EVALUATION'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ExternalSupervisorDashboard;
