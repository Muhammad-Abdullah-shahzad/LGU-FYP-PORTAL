import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorTimeline.css';
import {
    FaUsers,
    FaFileContract,
    FaChalkboardTeacher,
    FaCalendarCheck,
    FaPlus,
    FaTrash,
    FaChevronRight,
    FaRegClock,
    FaCheckCircle,
    FaTimesCircle
} from 'react-icons/fa';

const CoordinatorTimeline = () => {
    const [timelines, setTimelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
    const batchYears = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    const [formData, setFormData] = useState({
        batch: 'Fall',
        year: currentYear,
        batchYear: currentYear - 3, // Default to a realistic batch year
        semester: 7,
        isActive: true
    });

    useEffect(() => {
        fetchTimelines();
    }, []);

    const fetchTimelines = async () => {
        try {
            const res = await api.get('/timeline');
            setTimelines(res.data.timelines || []);
        } catch (err) {
            console.error('Error fetching timelines:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTimeline = async (e) => {
        e.preventDefault();
        try {
            await api.post('/timeline', formData);
            alert('Academic session created successfully');
            setShowModal(false);
            fetchTimelines();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create session');
        }
    };

    const togglePhase = async (timelineId, phase, currentStatus) => {
        const newStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
        try {
            await api.put(`/timeline/${timelineId}`, {
                [`${phase}Status`]: newStatus
            });
            fetchTimelines();
        } catch (err) {
            alert('Failed to update phase status');
        }
    };

    const updatePhaseDates = async (timelineId, phase, startDate, endDate) => {
        try {
            await api.put(`/timeline/${timelineId}`, {
                [`${phase}Start`]: startDate,
                [`${phase}End`]: endDate
            });
            fetchTimelines();
        } catch (err) {
            alert('Failed to update phase dates');
        }
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            await api.put(`/timeline/${id}`, { isActive: !currentStatus });
            fetchTimelines();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Not Set';
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        });
    };

    const deleteTimeline = async (id) => {
        if (!window.confirm('Are you sure you want to delete this session? All phases will be removed.')) return;
        try {
            await api.delete(`/timeline/${id}`);
            fetchTimelines();
        } catch (err) {
            alert('Failed to delete session');
        }
    };

    const PhaseCard = ({ timeline, phase, title, icon: Icon }) => {
        const isOpen = timeline[`${phase}Status`] === 'Open';
        const start = timeline[`${phase}Start`] ? timeline[`${phase}Start`].split('T')[0] : '';
        const end = timeline[`${phase}End`] ? timeline[`${phase}End`].split('T')[0] : '';

        const colClass = "col-12 col-md-6 col-lg-4 col-xl-3";

        return (
            <div className={colClass}>
                <div className={`phase-card ${isOpen ? 'active-phase' : ''}`}>
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="icon-box">
                            <Icon size={18} />
                        </div>
                        <div className="form-check form-switch p-0">
                            <input
                                className="form-check-input toggle-switch shadow-none m-0"
                                type="checkbox"
                                checked={isOpen}
                                onChange={() => togglePhase(timeline._id, phase, timeline[`${phase}Status`])}
                            />
                        </div>
                    </div>

                    <h6 className="fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>{title}</h6>

                    <div className="status-label">
                        <span className={`status-indicator ${isOpen ? 'open' : 'closed'}`}></span>
                        <span style={{ color: isOpen ? 'var(--success)' : 'var(--text-muted)' }}>
                            {isOpen ? 'Open' : 'Closed'}
                        </span>
                    </div>

                    <div className="date-group">
                        <div className="date-item">
                            <label className="date-label">Start</label>
                            <input
                                type="date"
                                className="form-control-modern"
                                value={start}
                                onChange={(e) => updatePhaseDates(timeline._id, phase, e.target.value, end)}
                            />
                        </div>
                        <div className="date-item">
                            <label className="date-label">End</label>
                            <input
                                type="date"
                                className="form-control-modern"
                                value={end}
                                onChange={(e) => updatePhaseDates(timeline._id, phase, start, e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout title="Academic Timeline">
            <div className="coordinator-timeline-container">
                <div className="header-section d-flex align-items-center justify-content-between">
                    <div>
                        <h2 className="font-outfit">Academic Timelines</h2>
                        <p>Manage registration and submission deadlines for all batches.</p>
                    </div>
                    <button className="btn btn-primary-modern" onClick={() => setShowModal(true)}>
                        <FaPlus size={14} /> <span>New Session</span>
                    </button>
                </div>

                <div className="timelines-list">
                    {timelines.map((t) => (
                        <div key={t._id} className="timeline-session">
                            <div className="session-header">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="session-badge">
                                        {t.batch === 'Fall' ? '🍂' : '🌸'}
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <h4 className="fw-bold mb-0 font-outfit" style={{ fontSize: '1.25rem' }}>
                                                {t.batch} {t.batchYear}
                                            </h4>
                                            <span className="badge-modern">Semester {t.semester}</span>
                                        </div>
                                        <div className="status-dot-container">
                                            <span className={`status-dot ${t.isActive ? 'active' : 'inactive'}`}></span>
                                            <span className="small text-muted fw-medium">
                                                {t.isActive ? 'Active Session' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-4">
                                    <div className="form-check form-switch m-0 p-0 d-flex align-items-center gap-2">
                                        <label className="small fw-semibold text-muted">Session Active</label>
                                        <input
                                            className="form-check-input m-0 cursor-pointer"
                                            type="checkbox"
                                            checked={t.isActive}
                                            onChange={() => toggleActive(t._id, t.isActive)}
                                        />
                                    </div>
                                    <button className="btn-icon-danger" onClick={() => deleteTimeline(t._id)} title="Delete Session">
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="row g-4">
                                {t.semester === 7 ? (
                                    <>
                                        <PhaseCard timeline={t} phase="groupRegistration" title="Groups" icon={FaUsers} />
                                        <PhaseCard timeline={t} phase="proposalSubmission" title="Proposals" icon={FaFileContract} />
                                        <PhaseCard timeline={t} phase="proposalDefense" title="Prop. Defense" icon={FaChalkboardTeacher} />
                                        <PhaseCard timeline={t} phase="reProposalSubmission" title="Re-Proposals" icon={FaFileContract} />
                                        <PhaseCard timeline={t} phase="reProposalDefense" title="Re-Prop. Def." icon={FaChalkboardTeacher} />
                                        <PhaseCard timeline={t} phase="srsSubmission" title="SRS Sub." icon={FaFileContract} />
                                        <PhaseCard timeline={t} phase="srsDefense" title="SRS Defense" icon={FaChalkboardTeacher} />
                                        <PhaseCard timeline={t} phase="reSrsDefense" title="Re-SRS Def." icon={FaChalkboardTeacher} />
                                    </>
                                ) : (
                                    <>
                                        <PhaseCard timeline={t} phase="internalDefense" title="Internal Def." icon={FaCalendarCheck} />
                                        <PhaseCard timeline={t} phase="reInternalDefense" title="Re-Internal" icon={FaCalendarCheck} />
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {timelines.length === 0 && !loading && (
                        <div className="empty-state">
                            <div className="text-muted mb-3">
                                <FaCalendarCheck size={48} opacity={0.2} />
                            </div>
                            <h4 className="fw-bold text-dark">No Timelines Found</h4>
                            <p className="text-muted mb-4">Create your first academic session to get started.</p>
                            <button className="btn btn-primary-modern mx-auto" onClick={() => setShowModal(true)}>
                                Create Session
                            </button>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content-modern" onClick={e => e.stopPropagation()}>
                            <div className="modal-header-modern">
                                <h4 className="fw-bold m-0 font-outfit">New Session</h4>
                                <button className="btn-close-modern" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleCreateTimeline}>
                                <div className="mb-4">
                                    <label className="form-label-modern">Batch Season</label>
                                    <div className="d-flex gap-2">
                                        <div
                                            className={`batch-option ${formData.batch === 'Fall' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, batch: 'Fall' })}
                                        >
                                            🍂 Fall
                                        </div>
                                        <div
                                            className={`batch-option ${formData.batch === 'Spring' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, batch: 'Spring' })}
                                        >
                                            🌸 Spring
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <label className="form-label-modern">Year</label>
                                        <select className="form-select-modern" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}>
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label-modern">Batch Year</label>
                                        <select className="form-select-modern" value={formData.batchYear} onChange={(e) => setFormData({ ...formData, batchYear: parseInt(e.target.value) })}>
                                            {batchYears.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label-modern">Semester</label>
                                    <select className="form-select-modern" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}>
                                        <option value={7}>7th Semester</option>
                                        <option value={8}>8th Semester</option>
                                    </select>
                                </div>

                                <div className="info-alert mb-4">
                                    <FaRegClock size={16} style={{ marginTop: '2px' }} />
                                    <span>Phase dates and status can be configured after the session is created.</span>
                                </div>

                                <div className="d-flex gap-2 justify-content-end">
                                    <button type="button" className="btn-modern-light" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-modern-primary">Create Session</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CoordinatorTimeline;
