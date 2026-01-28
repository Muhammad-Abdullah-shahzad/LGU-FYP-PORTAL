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

    const PhaseCard = ({ timeline, phase, title, icon: Icon, color }) => {
        const isOpen = timeline[`${phase}Status`] === 'Open';
        const start = timeline[`${phase}Start`] ? timeline[`${phase}Start`].split('T')[0] : '';
        const end = timeline[`${phase}End`] ? timeline[`${phase}End`].split('T')[0] : '';

        const colClass = timeline.semester === 7 ? "col-md-6 col-xl-2" : "col-md-6";

        return (
            <div className={colClass}>
                <div className={`card phase-card border-0 shadow-sm ${isOpen ? 'active-phase' : ''}`}>
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className={`icon-box bg-${color}-subtle text-${color}`}>
                                <Icon size={22} />
                            </div>
                            <div className="form-check form-switch ps-0">
                                <input
                                    className="form-check-input ms-0 toggle-switch shadow-none"
                                    type="checkbox"
                                    checked={isOpen}
                                    onChange={() => togglePhase(timeline._id, phase, timeline[`${phase}Status`])}
                                />
                            </div>
                        </div>

                        <h6 className="fw-bold mb-1 font-outfit">{title}</h6>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className={`status-indicator ${isOpen ? 'open' : 'closed'}`}></span>
                            <span className={`x-small fw-bold text-uppercase ${isOpen ? 'text-success' : 'text-danger'}`}>
                                {isOpen ? 'Open for Students' : 'Closed'}
                            </span>
                        </div>

                        <div className="date-inputs mt-4">
                            <div className="mb-3">
                                <label className="date-label">START DATE</label>
                                <div className="input-group-modern">
                                    <input
                                        type="date"
                                        className="form-control-modern"
                                        value={start}
                                        onChange={(e) => updatePhaseDates(timeline._id, phase, e.target.value, end)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="date-label">END DATE</label>
                                <div className="input-group-modern">
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
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout title="FYP Timelines">
            <div className="coordinator-timeline-container p-0">
                <div className="header-section d-flex align-items-center justify-content-between mb-5">
                    <div>
                        <h2 className="fw-bold m-0 font-outfit text-gray-900">Manage Deadlines</h2>
                        <p className="text-secondary m-0 mt-1">Easily open and close registration or defense phases for students.</p>
                    </div>
                    <button className="btn btn-primary-modern d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
                        <FaPlus /> <span>New Session</span>
                    </button>
                </div>

                <div className="timelines-list">
                    {timelines.map((t) => (
                        <div key={t._id} className="timeline-session mb-5">
                            <div className="session-header bg-white rounded-4 shadow-sm p-4 mb-4 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-4">
                                    <div className={`session-badge ${t.batch === 'Fall' ? 'fall' : 'spring'}`}>
                                        {t.batch === 'Fall' ? '🍂' : '🌸'}
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <h3 className="fw-bold mb-0 font-outfit">{t.batch}-{t.batchYear}</h3>
                                            <span className="badge bg-primary bg-opacity-10 text-primary border-0 rounded-pill px-2 py-1 small fw-bold" style={{ fontSize: '10px' }}>BATCH BOTTLE</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 mt-1">
                                            <span className="badge-modern">Semester {t.semester} ({t.year})</span>
                                            <div className="status-dot-container">
                                                <span className={`status-dot ${t.isActive ? 'active' : 'inactive'}`}></span>
                                                <span className="small text-muted fw-medium">{t.isActive ? 'Active Session' : 'Inactive Session'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="form-check form-switch m-0 p-0 d-flex align-items-center gap-2">
                                        <label className="small fw-bold text-muted">Session Status</label>
                                        <input
                                            className="form-check-input m-0 cursor-pointer"
                                            type="checkbox"
                                            checked={t.isActive}
                                            onChange={() => toggleActive(t._id, t.isActive)}
                                        />
                                    </div>
                                    <button className="btn btn-icon-danger" onClick={() => deleteTimeline(t._id)} title="Delete Session">
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="row g-4 mb-4">
                                {t.semester === 7 ? (
                                    <>
                                        <PhaseCard
                                            timeline={t}
                                            phase="groupRegistration"
                                            title="Group Registration"
                                            icon={FaUsers}
                                            color="primary"
                                        />
                                        <PhaseCard
                                            timeline={t}
                                            phase="proposalSubmission"
                                            title="Proposal Submission"
                                            icon={FaFileContract}
                                            color="info"
                                        />
                                        <PhaseCard
                                            timeline={t}
                                            phase="proposalDefense"
                                            title="Proposal Defense"
                                            icon={FaChalkboardTeacher}
                                            color="warning"
                                        />
                                        <PhaseCard
                                            timeline={t}
                                            phase="reProposalSubmission"
                                            title="Re-Proposal Submission"
                                            icon={FaFileContract}
                                            color="info"
                                        />
                                        <PhaseCard
                                            timeline={t}
                                            phase="reProposalDefense"
                                            title="Re-Proposal Defense"
                                            icon={FaChalkboardTeacher}
                                            color="danger"
                                        />
                                        <PhaseCard
                                            timeline={t}
                                            phase="internalDefense"
                                            title="Internal Defense"
                                            icon={FaCalendarCheck}
                                            color="success"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <PhaseCard
                                            timeline={t}
                                            phase="groupRegistration"
                                            title="Group Registration"
                                            icon={FaUsers}
                                            color="primary"
                                        />
                                        <PhaseCard
                                            timeline={t}
                                            phase="srsDefense"
                                            title="SRS Defense"
                                            icon={FaFileContract}
                                            color="info"
                                        />
                                        {/* Add other 8th sem phases if needed later */}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {timelines.length === 0 && !loading && (
                        <div className="empty-state">
                            <div className="empty-icon text-primary-subtle">
                                <FaCalendarCheck size={80} />
                            </div>
                            <h4 className="fw-bold text-dark mt-4">No Timelines Created</h4>
                            <p className="text-muted">Start by creating a new academic session for a specific batch and year.</p>
                            <button className="btn btn-primary-modern mt-3" onClick={() => setShowModal(true)}>
                                Create First Session
                            </button>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-dialog-modern">
                            <div className="modal-content-modern border-0 shadow-lg p-4">
                                <div className="modal-header-modern mb-4">
                                    <h4 className="fw-bold m-0 font-outfit">New Academic Session</h4>
                                    <button className="btn-close-modern" onClick={() => setShowModal(false)}>×</button>
                                </div>
                                <form onSubmit={handleCreateTimeline}>
                                    <div className="modal-body-modern">
                                        <div className="mb-4">
                                            <label className="form-label-modern">Batch</label>
                                            <div className="d-flex gap-3">
                                                <div className={`batch-option ${formData.batch === 'Fall' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, batch: 'Fall' })}>
                                                    🍂 Fall
                                                </div>
                                                <div className={`batch-option ${formData.batch === 'Spring' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, batch: 'Spring' })}>
                                                    🌸 Spring
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label-modern">Academic Year</label>
                                                <select className="form-select-modern" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}>
                                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                                <small className="text-muted x-small">The calendar year this timeline applies to.</small>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label-modern">Batch Starting Year</label>
                                                <select className="form-select-modern" value={formData.batchYear} onChange={(e) => setFormData({ ...formData, batchYear: parseInt(e.target.value) })}>
                                                    {batchYears.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                                <small className="text-muted x-small">The year the batch was admitted (e.g. 2023).</small>
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
                                            <FaRegClock className="text-primary me-2" />
                                            <span>After creating, you can individually open/close registration and defense phases.</span>
                                        </div>
                                    </div>
                                    <div className="modal-footer-modern border-0 mt-2 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn-modern-light" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn-modern-primary">Create Session</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CoordinatorTimeline;
