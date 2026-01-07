import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './StudentGroup.css';
import {
    HiOutlineUserGroup,
    HiOutlineShieldCheck,
    HiOutlineIdentification,
    HiOutlineBriefcase,
    HiOutlineDocumentDuplicate,
    HiOutlinePlus,
    HiOutlineUserCircle,
    HiOutlineBookOpen,
    HiOutlineUser,
    HiOutlineLockClosed,
    HiOutlineClock
} from 'react-icons/hi';

const StudentGroup = () => {
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTimelines, setActiveTimelines] = useState([]);

    const [formData, setFormData] = useState({
        projectTitle: '',
        projectDomain: 'Software Engineering',
        projectSummary: '',
        student2Email: '',
        batch: '',
        year: '',
        batchYear: '',
        semester: 7
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const groupRes = await api.get('/groups/my-group');
            if (groupRes.data) {
                setGroup(groupRes.data);
            }
        } catch (err) {
            // No group found is fine here
        }

        try {
            const timelineRes = await api.get('/timeline?isActive=true');
            const timelines = (timelineRes.data.timelines || []).filter(t => t.groupRegistrationStatus === 'Open');
            setActiveTimelines(timelines);

            if (timelines.length > 0) {
                // Try to find timeline matching student's batch and enrolledYear
                const studentMatch = timelines.find(t =>
                    t.batch === user?.batch &&
                    t.batchYear === user?.enrolledYear
                );

                const defaultTimeline = studentMatch || timelines[0];

                setFormData(prev => ({
                    ...prev,
                    batch: defaultTimeline.batch,
                    year: defaultTimeline.year,
                    batchYear: defaultTimeline.batchYear,
                    semester: defaultTimeline.semester
                }));
            }
        } catch (err) {
            console.error('Error fetching timelines:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/groups', formData);
            setGroup(res.data.group);
            setSuccess('Group initialized successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create group');
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

    if (loading) return <DashboardLayout title="Group Management"><div className="p-5 text-center"><div className="spinner-border text-primary"></div></div></DashboardLayout>;

    return (
        <DashboardLayout title="My FYP Group">
            <div className="container-fluid p-0">
                {group ? (
                    <div className="row g-4">
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                                <div className="card-header bg-primary py-3 px-4 d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <HiOutlineUserGroup className="text-white me-2" size={24} />
                                        <h5 className="text-white mb-0 fw-bold font-outfit">{group.groupName}</h5>
                                    </div>
                                    <span className="badge bg-white text-primary rounded-pill px-3 py-2 text-uppercase" style={{ fontSize: '0.7rem' }}>{group.status}</span>
                                </div>
                                <div className="card-body p-4">
                                    <div className="mb-4">
                                        <label className="x-small text-muted fw-bold text-uppercase d-block mb-1">Project Title</label>
                                        <div className="d-flex align-items-start">
                                            <HiOutlineBookOpen className="text-primary me-2 mt-1" size={20} />
                                            <h4 className="fw-bold text-dark mb-0">{group.projectTitle}</h4>
                                        </div>
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="x-small text-muted fw-bold text-uppercase d-block mb-1">Domain</label>
                                            <span className="badge bg-light text-primary border px-3 py-2 rounded-pill fw-normal">{group.projectDomain}</span>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="x-small text-muted fw-bold text-uppercase d-block mb-1">Academic Batch</label>
                                            <p className="mb-0 fw-bold">{group.batch}-{group.batchYear || group.year} (Sem {group.semester})</p>
                                        </div>
                                    </div>
                                    <div className="mb-0">
                                        <label className="x-small text-muted fw-bold text-uppercase d-block mb-1">Project Summary</label>
                                        <p className="text-muted small lh-lg">{group.projectSummary}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-transparent border-0 pt-4 px-4">
                                    <h5 className="fw-bold m-0 font-outfit text-primary">Team Members</h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        {[group.student1, group.student2].filter(Boolean).map((student, idx) => (
                                            <div key={student._id} className="col-md-6">
                                                <div className="d-flex align-items-center p-3 border rounded-4 bg-light bg-opacity-50">
                                                    <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px' }}>
                                                        {idx === 0 ? <HiOutlineShieldCheck className="text-primary" size={24} /> : <HiOutlineUser className="text-secondary" size={24} />}
                                                    </div>
                                                    <div>
                                                        <h6 className="fw-bold mb-0 small">{student.firstName} {student.lastName}</h6>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm rounded-4 mb-4">
                                <div className="card-header bg-transparent border-0 pt-4 px-4">
                                    <h5 className="fw-bold m-0 font-outfit">Supervisor</h5>
                                </div>
                                <div className="card-body p-4">
                                    {group.supervisor ? (
                                        <div className="text-center py-2">
                                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                                                <HiOutlineIdentification size={40} />
                                            </div>
                                            <h6 className="fw-bold mb-1">{group.supervisor.firstName} {group.supervisor.lastName}</h6>
                                            <p className="small text-muted mb-3">{group.supervisor.email}</p>
                                            <span className={`badge bg-${group.supervisorStatus === 'approved' ? 'success' : 'warning'}-subtle text-${group.supervisorStatus === 'approved' ? 'success' : 'warning'} rounded-pill px-4 py-2`}>
                                                {group.supervisorStatus === 'approved' ? 'Assigned' : 'Approval Pending'}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-muted small mb-4">You haven't requested a supervisor yet. This is typically done during proposal submission.</p>
                                            <button className="btn btn-outline-primary rounded-pill w-100 fw-bold shadow-sm" onClick={() => window.location.href = '/student/proposal'}>Request Supervisor</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTimelines.length > 0 ? (
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="bg-primary p-4 text-center">
                                    <h3 className="text-white fw-bold font-outfit mb-2">Initialize FYP Group</h3>
                                    <p className="text-white opacity-75 small mb-0">Start your final year journey by forming a group and defining your project.</p>
                                </div>
                                <div className="card-body p-4 p-md-5">
                                    {error && <div className="alert alert-danger rounded-4 x-small fw-bold mb-4">{error}</div>}
                                    {success && <div className="alert alert-success rounded-4 x-small fw-bold mb-4">{success}</div>}

                                    <form onSubmit={handleCreateGroup}>
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <label className="form-label x-small text-muted fw-bold text-uppercase">Project Working Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-3 p-3 bg-light border-0"
                                                    placeholder="Enter your initial project idea..."
                                                    value={formData.projectTitle}
                                                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label x-small text-muted fw-bold text-uppercase">Project Domain</label>
                                                <select
                                                    className="form-select rounded-3 p-3 bg-light border-0"
                                                    value={formData.projectDomain}
                                                    onChange={(e) => setFormData({ ...formData, projectDomain: e.target.value })}
                                                    required
                                                >
                                                    <option value="Software Engineering">Software Engineering</option>
                                                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                                                    <option value="Data Science">Data Science</option>
                                                    <option value="Cybersecurity">Cybersecurity</option>
                                                    <option value="Web Development">Web Development</option>
                                                    <option value="Mobile Development">Mobile Development</option>
                                                    <option value="AR/VR">AR/VR</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label x-small text-muted fw-bold text-uppercase">Active Timeline</label>
                                                <select
                                                    className="form-select rounded-3 p-3 bg-light border-0 shadow-sm"
                                                    value={`${formData.batch}-${formData.year}-${formData.batchYear}-${formData.semester}`}
                                                    onChange={(e) => {
                                                        const [batch, year, bYear, sem] = e.target.value.split('-');
                                                        setFormData({ ...formData, batch, year: parseInt(year), batchYear: parseInt(bYear), semester: parseInt(sem) });
                                                    }}
                                                    required
                                                >
                                                    {activeTimelines.map(t => (
                                                        <option key={t._id} value={`${t.batch}-${t.year}-${t.batchYear}-${t.semester}`}>
                                                            {t.batch}-{t.batchYear} (Sem {t.semester})
                                                        </option>
                                                    ))}
                                                </select>
                                                {activeTimelines.length > 0 && (
                                                    <div className="mt-2 px-2">
                                                        {(() => {
                                                            const selected = activeTimelines.find(t => `${t.batch}-${t.year}-${t.batchYear}-${t.semester}` === `${formData.batch}-${formData.year}-${formData.batchYear}-${formData.semester}`);
                                                            if (selected) {
                                                                return (
                                                                    <div className="d-flex flex-column gap-1">
                                                                        <small className="text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                                                                            Registration Window: {formatDate(selected.groupRegistrationStart)} - {formatDate(selected.groupRegistrationEnd)}
                                                                        </small>
                                                                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                                                            Academic Session: {selected.year}
                                                                        </small>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label x-small text-muted fw-bold text-uppercase">Partner Email (Optional)</label>
                                                <input
                                                    type="email"
                                                    className="form-control rounded-3 p-3 bg-light border-0"
                                                    placeholder="Registration number/email of team member"
                                                    value={formData.student2Email}
                                                    onChange={(e) => setFormData({ ...formData, student2Email: e.target.value })}
                                                />
                                                <small className="text-muted">You can initialize as a single person and add partner later.</small>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label x-small text-muted fw-bold text-uppercase">Project Summary (Min 50 chars)</label>
                                                <textarea
                                                    className="form-control rounded-3 p-3 bg-light border-0"
                                                    rows="4"
                                                    placeholder="Briefly describe what you plan to build..."
                                                    value={formData.projectSummary}
                                                    onChange={(e) => setFormData({ ...formData, projectSummary: e.target.value })}
                                                    required
                                                ></textarea>
                                            </div>
                                            <div className="col-12 pt-3">
                                                <button type="submit" className="btn btn-primary w-100 rounded-pill p-3 fw-bold shadow-sm" disabled={activeTimelines.length === 0}>
                                                    Initialize Project & Group
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="row justify-content-center py-5">
                        <div className="col-lg-6 text-center">
                            <div className="fallback-ui-card p-5 bg-white shadow-sm rounded-4 border-0">
                                <div className="icon-wrapper mb-4 text-warning">
                                    <HiOutlineLockClosed size={80} className="bg-warning bg-opacity-10 p-3 rounded-circle" />
                                </div>
                                <h3 className="fw-bold font-outfit text-dark mb-3">Registration Closed</h3>
                                <p className="text-muted mb-4 px-4">
                                    Group registration hasn't started yet for your batch. The portal is currently locked by the coordinator.
                                    Please check with the FYP office or wait for the official notification.
                                </p>
                                <div className="d-flex align-items-center justify-content-center gap-2 text-primary fw-bold small">
                                    <HiOutlineClock size={18} />
                                    <span>Check back later for updates</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentGroup;
