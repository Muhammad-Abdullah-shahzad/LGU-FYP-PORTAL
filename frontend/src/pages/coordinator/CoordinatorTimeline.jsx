import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorTimeline.css';

const CoordinatorTimeline = () => {
    const [timelines, setTimelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

    const [formData, setFormData] = useState({
        batch: 'Fall',
        year: currentYear,
        semester: 7,
        groupRegistrationStart: '', groupRegistrationEnd: '',
        proposalSubmissionStart: '', proposalSubmissionEnd: '',
        proposalDefenseStart: '', proposalDefenseEnd: '',
        internalDefenseStart: '', internalDefenseEnd: '',
        srsDefenseStart: '', srsDefenseEnd: '',
        externalDefenseStart: '', externalDefenseEnd: '',
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
            alert('Timeline created successfully');
            setShowModal(false);
            fetchTimelines();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create timeline');
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
        if (!date) return 'TBD';
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        });
    };

    const deleteTimeline = async (id) => {
        if (!window.confirm('Are you sure you want to delete this timeline?')) return;
        try {
            await api.delete(`/timeline/${id}`);
            fetchTimelines();
        } catch (err) {
            alert('Failed to delete timeline');
        }
    };

    return (
        <DashboardLayout title="Academic Timelines">
            <div className="container-fluid p-0">
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h4 className="fw-bold m-0 font-outfit">Manage FYP Schedule</h4>
                        <p className="text-muted small m-0">Define deadlines for group formation and defenses for each batch.</p>
                    </div>
                    <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={() => setShowModal(true)}>
                        + New Timeline
                    </button>
                </div>

                <div className="row g-4">
                    {timelines.map((t) => (
                        <div key={t._id} className="col-12">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="card-header bg-white border-bottom-0 pt-4 px-4 d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <div className={`rounded-circle p-2 me-3 ${t.batch === 'Fall' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning'}`} style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                                            {t.batch === 'Fall' ? '🍂' : '🌸'}
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-0">{t.batch} {t.year}</h5>
                                            <span className="badge bg-light text-secondary border rounded-pill">Semester {t.semester}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <div className="form-check form-switch me-3 d-flex align-items-center mt-2">
                                            <input
                                                className="form-check-input me-2"
                                                type="checkbox"
                                                checked={t.isActive}
                                                onChange={() => toggleActive(t._id, t.isActive)}
                                            />
                                            <label className="form-check-label small fw-bold text-muted">{t.isActive ? 'ACTIVE' : 'INACTIVE'}</label>
                                        </div>
                                        <button className="btn btn-outline-danger btn-sm rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }} onClick={() => deleteTimeline(t._id)}>×</button>
                                    </div>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <div className="p-3 bg-light rounded-3">
                                                <label className="x-small text-muted fw-bold d-block mb-1 text-uppercase">Group Registration</label>
                                                <p className="mb-0 small fw-bold">{formatDate(t.groupRegistrationStart)} - {formatDate(t.groupRegistrationEnd)}</p>
                                            </div>
                                        </div>

                                        {t.semester == 7 ? (
                                            <>
                                                <div className="col-md-3">
                                                    <div className="p-3 bg-light rounded-3">
                                                        <label className="x-small text-muted fw-bold d-block mb-1 text-uppercase">Proposal Submission</label>
                                                        <p className="mb-0 small fw-bold">{formatDate(t.proposalSubmissionStart)} - {formatDate(t.proposalSubmissionEnd)}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="p-3 bg-light rounded-3">
                                                        <label className="x-small text-muted fw-bold d-block mb-1 text-uppercase">Proposal Defense</label>
                                                        <p className="mb-0 small fw-bold">{formatDate(t.proposalDefenseStart)} - {formatDate(t.proposalDefenseEnd)}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="p-3 bg-light rounded-3">
                                                        <label className="x-small text-muted fw-bold d-block mb-1 text-uppercase">Internal Defense</label>
                                                        <p className="mb-0 small fw-bold">{formatDate(t.internalDefenseStart)} - {formatDate(t.internalDefenseEnd)}</p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="col-md-4">
                                                    <div className="p-3 bg-light rounded-3">
                                                        <label className="x-small text-muted fw-bold d-block mb-1 text-uppercase">SRS Defense</label>
                                                        <p className="mb-0 small fw-bold">{formatDate(t.srsDefenseStart)} - {formatDate(t.srsDefenseEnd)}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="p-3 bg-light rounded-3">
                                                        <label className="x-small text-muted fw-bold d-block mb-1 text-uppercase">External Defense</label>
                                                        <p className="mb-0 small fw-bold">{formatDate(t.externalDefenseStart)} - {formatDate(t.externalDefenseEnd)}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {timelines.length === 0 && !loading && (
                        <div className="col-12 text-center py-5">
                            <div className="fs-1 opacity-25">📅</div>
                            <h5 className="text-secondary mt-3 font-outfit">No timelines defined yet</h5>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0 shadow rounded-4 p-2">
                                <div className="modal-header border-0">
                                    <h5 className="modal-title fw-bold font-outfit">Create Academic Timeline</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <form onSubmit={handleCreateTimeline}>
                                    <div className="modal-body">
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold">Batch</label>
                                                <select className="form-select rounded-3" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })}>
                                                    <option value="Fall">Fall</option>
                                                    <option value="Spring">Spring</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold">Year</label>
                                                <select className="form-select rounded-3" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}>
                                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold">Semester</label>
                                                <select className="form-select rounded-3" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}>
                                                    <option value={7}>7th Semester</option>
                                                    <option value={8}>8th Semester</option>
                                                </select>
                                            </div>
                                        </div>

                                        <h6 className="fw-bold mb-3 text-primary font-outfit">Phase Deadlines</h6>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label small text-muted">Group Registration Start</label>
                                                <input type="date" className="form-control" required value={formData.groupRegistrationStart} onChange={(e) => setFormData({ ...formData, groupRegistrationStart: e.target.value })} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small text-muted">Group Registration End</label>
                                                <input type="date" className="form-control" required value={formData.groupRegistrationEnd} onChange={(e) => setFormData({ ...formData, groupRegistrationEnd: e.target.value })} />
                                            </div>
                                        </div>

                                        {formData.semester == 7 ? (
                                            <>
                                                <div className="row g-3 mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">Proposal Submission Start</label>
                                                        <input type="date" className="form-control" required value={formData.proposalSubmissionStart} onChange={(e) => setFormData({ ...formData, proposalSubmissionStart: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">Proposal Submission End</label>
                                                        <input type="date" className="form-control" required value={formData.proposalSubmissionEnd} onChange={(e) => setFormData({ ...formData, proposalSubmissionEnd: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="row g-3 mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">Proposal Defense Start</label>
                                                        <input type="date" className="form-control" required value={formData.proposalDefenseStart} onChange={(e) => setFormData({ ...formData, proposalDefenseStart: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">Proposal Defense End</label>
                                                        <input type="date" className="form-control" required value={formData.proposalDefenseEnd} onChange={(e) => setFormData({ ...formData, proposalDefenseEnd: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="row g-3 mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">Internal Defense Start</label>
                                                        <input type="date" className="form-control" required value={formData.internalDefenseStart} onChange={(e) => setFormData({ ...formData, internalDefenseStart: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">Internal Defense End</label>
                                                        <input type="date" className="form-control" required value={formData.internalDefenseEnd} onChange={(e) => setFormData({ ...formData, internalDefenseEnd: e.target.value })} />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="row g-3 mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">SRS Defense Start</label>
                                                        <input type="date" className="form-control" required value={formData.srsDefenseStart} onChange={(e) => setFormData({ ...formData, srsDefenseStart: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">SRS Defense End</label>
                                                        <input type="date" className="form-control" required value={formData.srsDefenseEnd} onChange={(e) => setFormData({ ...formData, srsDefenseEnd: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="row g-3 mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">External Defense Start</label>
                                                        <input type="date" className="form-control" required value={formData.externalDefenseStart} onChange={(e) => setFormData({ ...formData, externalDefenseStart: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted">External Defense End</label>
                                                        <input type="date" className="form-control" required value={formData.externalDefenseEnd} onChange={(e) => setFormData({ ...formData, externalDefenseEnd: e.target.value })} />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="modal-footer border-0 pt-0 px-4 pb-4">
                                        <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold">Save Timeline</button>
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
