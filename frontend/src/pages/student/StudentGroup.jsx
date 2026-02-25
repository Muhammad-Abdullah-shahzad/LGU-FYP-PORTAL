import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './StudentGroup.css';
import {
    HiOutlineUserGroup,
    HiOutlineShieldCheck,
    HiOutlineIdentification,
    HiOutlinePlus,
    HiOutlineUser,
    HiOutlineLockClosed,
    HiOutlineClock,
    HiOutlineLightBulb,
    HiOutlineStatusOnline,
    HiOutlineGlobe,
    HiOutlineAcademicCap
} from 'react-icons/hi';

const StudentGroup = () => {
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTimelines, setActiveTimelines] = useState([]);
    const [supervisors, setSupervisors] = useState([]);

    const [formData, setFormData] = useState({
        projectTitle: '',
        projectDomain: 'Software Engineering',
        projectSummary: '',
        partnerBatch: 'Fa',
        partnerYear: new Date().getFullYear(),
        partnerDegree: 'BSCS',
        partnerSequence: '',
        myRole: 'leader',
        supervisorId: '',
        batch: '',
        year: '',
        batchYear: '',
        semester: 7
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchingPartner, setSearchingPartner] = useState(false);
    const [partnerResults, setPartnerResults] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
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
            console.log('No group found');
        }

        try {
            const supervisorsRes = await api.get('/users/supervisors');
            setSupervisors(supervisorsRes.data.supervisors || []);
        } catch (err) {
            console.error('Error fetching supervisors:', err);
        }

        try {
            const timelineRes = await api.get('/timeline?isActive=true');
            const timelines = (timelineRes.data.timelines || []).filter(t => t.groupRegistrationStatus === 'Open');
            setActiveTimelines(timelines);

            if (timelines.length > 0) {
                const userBatchFull = user?.batch === 'Fa' ? 'Fall' : (user?.batch === 'Sp' ? 'Spring' : user?.batch);
                const studentMatch = timelines.find(t =>
                    t.batch === userBatchFull &&
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

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.partnerSequence) {
                handleSearchPartner();
            } else {
                setPartnerResults([]);
                setSelectedPartner(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.partnerBatch, formData.partnerYear, formData.partnerDegree, formData.partnerSequence]);

    const handleSearchPartner = async () => {
        const fullRegNum = `${formData.partnerBatch}-${formData.partnerYear}/${formData.partnerDegree}/${formData.partnerSequence}`;

        try {
            setSearchingPartner(true);
            const res = await api.get(`/users/students/search/${fullRegNum}`);
            setPartnerResults(res.data.students || []);
        } catch (err) {
            console.error('Error searching partner:', err);
        } finally {
            setSearchingPartner(false);
        }
    };

    const handleSelectPartner = (student) => {
        setSelectedPartner(student);
        setPartnerResults([]);

        // Format: Fa-2023/BSSE/158
        try {
            const reg = student.registrationNumber;
            const [batchYearPart, degree, sequence] = reg.split('/');
            const [batch, year] = batchYearPart.split('-');

            setFormData(prev => ({
                ...prev,
                partnerBatch: batch,
                partnerYear: year,
                partnerDegree: degree,
                partnerSequence: sequence
            }));
        } catch (err) {
            console.error('Error parsing registration number:', err);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.projectSummary.length < 20) {
            setError('Project abstract must be at least 20 characters long.');
            return;
        }

        try {
            const res = await api.post('/groups', formData);
            setGroup(res.data.group);
            setSuccess(formData.partnerSequence ? 'Group created and invitation sent to partner!' : 'Group initialized successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create group');
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Group Management">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Project Group Management">
            <div className="group-container">
                {group ? (
                    <div className="row g-3">
                        {/* Group Primary Info */}
                        <div className="col-lg-8">
                            <div className="glass-card">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h3 className="section-title mb-0">Project Details</h3>
                                    <span className="badge bg-success text-white rounded-pill px-2 py-1 text-uppercase" style={{ fontSize: '0.55rem', fontWeight: '800' }}>
                                        {group.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <div className="detail-box mb-3">
                                        <label>Working Title</label>
                                        <h4 className="text-dark">{group.projectTitle}</h4>
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-md-6">
                                            <div className="detail-box h-100">
                                                <label>Domain</label>
                                                <p className="text-primary d-flex align-items-center"><HiOutlineGlobe className="me-1" /> {group.projectDomain}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="detail-box h-100">
                                                <label>Batch / Semester</label>
                                                <p><HiOutlineAcademicCap className="me-1" /> {group.batch}-{group.batchYear || group.year} (Sem {group.semester})</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-box">
                                    <label>Summary</label>
                                    <p className="summary-text text-muted" style={{ fontWeight: '500', fontSize: '0.75rem' }}>{group.projectSummary}</p>
                                </div>

                                <div className="mt-4">
                                    <h6 className="modern-label mb-2">Team Composition</h6>
                                    <div className="row g-2">
                                        {[group.student1, group.student2].filter(Boolean).map((student, idx) => (
                                            <div key={student._id} className="col-md-6">
                                                <div className="team-member-card">
                                                    <div className="icon-circle">
                                                        {idx === 0 ? <HiOutlineShieldCheck /> : <HiOutlineUser />}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{student.firstName} {student.lastName}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>{student.registrationNumber}</div>
                                                    </div>
                                                    {group.leader === student._id && (
                                                        <span className="badge bg-primary text-white rounded-pill px-2 py-0" style={{ fontSize: '0.5rem' }}>LEADER</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="col-lg-4">
                            <div className="glass-card mb-3 text-center">
                                <h6 className="modern-label mb-3">Supervisor</h6>
                                {group.supervisor ? (
                                    <div className="py-1">
                                        <div className="icon-circle bg-light text-primary mx-auto mb-2" style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}>
                                            <HiOutlineIdentification />
                                        </div>
                                        <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{group.supervisor.firstName} {group.supervisor.lastName}</div>
                                        <p className="text-muted mb-3" style={{ fontSize: '0.7rem' }}>{group.supervisor.domain}</p>
                                        <div className={`badge bg-${group.supervisorStatus === 'approved' ? 'success' : 'warning'}-subtle text-${group.supervisorStatus === 'approved' ? 'success' : 'warning'} rounded-pill px-3 py-1 border w-100`} style={{ fontSize: '0.65rem' }}>
                                            <HiOutlineStatusOnline className="me-1" />
                                            {group.supervisorStatus === 'approved' ? 'Assigned' : 'Approval Pending'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        <p className="text-muted small mb-3 px-2" style={{ fontSize: '0.7rem' }}>No advisor assigned. Draft your proposal to request guidance.</p>
                                        <button className="modern-btn btn btn-primary w-100" onClick={() => window.location.href = '/student/proposal'}>Draft Proposal</button>
                                    </div>
                                )}
                            </div>

                            <div className="tip-card">
                                <div className="tip-header">
                                    <HiOutlineLightBulb size={14} />
                                    <span>Faculty Guidance</span>
                                </div>
                                <p className="tip-content">
                                    Your project title is a working draft. Final refinement usually occurs during the formal proposal phase with your supervisor.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : activeTimelines.length > 0 ? (
                    /* Initial Registration View - Compact Grid */
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="glass-card p-0 overflow-hidden border-0 shadow-sm bg-white">
                                <div className="registration-header">
                                    <h3>Project Registration</h3>
                                    <p>Initialize your final year project by providing following group and project details.</p>
                                </div>

                                <form onSubmit={handleCreateGroup}>
                                    <div className="compact-form-grid">
                                        {/* Status Messages */}
                                        {(error || success) && (
                                            <div className="span-12">
                                                {error && <div className="alert alert-danger py-2 px-3 small fw-bold mb-0">{error}</div>}
                                                {success && <div className="alert alert-success py-2 px-3 small fw-bold mb-0">{success}</div>}
                                            </div>
                                        )}

                                        <div className="form-section-title">Core Identity</div>

                                        <div className="span-8">
                                            <label className="modern-label">Project Working Title</label>
                                            <input
                                                type="text"
                                                className="modern-input"
                                                placeholder="e.g. AI Based Health Monitoring System"
                                                value={formData.projectTitle}
                                                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="span-4">
                                            <label className="modern-label">Thematic Domain</label>
                                            <select
                                                className="modern-select"
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

                                        <div className="span-6">
                                            <label className="modern-label">Faculty Supervisor</label>
                                            <select
                                                className="modern-select"
                                                value={formData.supervisorId}
                                                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                                                required
                                            >
                                                <option value="">Select advisor...</option>
                                                {supervisors.map(s => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.firstName} {s.lastName}{(() => { const spec = s.domain && s.domain.length > 0 ? (Array.isArray(s.domain) ? s.domain.join(', ') : s.domain) : s.areaOfExpertise; return spec ? ` — ${spec}` : ''; })()}
                                                    </option>
                                                ))}
                                            </select>
                                            {formData.supervisorId && supervisors.find(s => s._id === formData.supervisorId) && (
                                                <div className="mt-2 p-2 rounded-3" style={{ background: '#f8f9fa', borderLeft: '3px solid #4e73df' }}>
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <span className="text-uppercase fw-bold" style={{ fontSize: '0.55rem', color: '#4e73df', letterSpacing: '0.5px' }}>Specialization</span>
                                                    </div>
                                                    <div className="fw-semibold" style={{ fontSize: '0.75rem', color: '#2d3748' }}>
                                                        {(() => {
                                                            const s = supervisors.find(s => s._id === formData.supervisorId);
                                                            return s.domain && s.domain.length > 0 ? s.domain.join(', ') : s.areaOfExpertise;
                                                        })()}
                                                    </div>
                                                    {(() => {
                                                        const s = supervisors.find(s => s._id === formData.supervisorId);
                                                        return s.officeAddress && (
                                                            <div style={{ fontSize: '0.65rem', color: '#718096', marginTop: '4px' }}>
                                                                <span className="fw-bold">Office:</span> {s.officeAddress}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="span-3">
                                            <label className="modern-label">Target Cycle</label>
                                            <select
                                                className="modern-select"
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
                                        </div>

                                        <div className="span-3">
                                            <label className="modern-label">My Role</label>
                                            <div className="d-flex gap-2">
                                                <div className={`role-card ${formData.myRole === 'leader' ? 'active' : ''} py-2`} onClick={() => setFormData({ ...formData, myRole: 'leader' })}>
                                                    <div className="role-name">Leader</div>
                                                </div>
                                                <div className={`role-card ${formData.myRole === 'member' ? 'active' : ''} py-2`} onClick={() => setFormData({ ...formData, myRole: 'member' })}>
                                                    <div className="role-name">Member</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-section-title">Peer Connection (Optional)</div>

                                        <div className="partner-selection-grid">
                                            <div className="span-3">
                                                <label className="modern-label">Batch</label>
                                                <select className="modern-select" value={formData.partnerBatch} onChange={(e) => setFormData({ ...formData, partnerBatch: e.target.value })}>
                                                    <option value="Fa">Fall</option>
                                                    <option value="Sp">Spring</option>
                                                </select>
                                            </div>
                                            <div className="span-3">
                                                <label className="modern-label">Year</label>
                                                <input type="number" className="modern-input" value={formData.partnerYear} onChange={(e) => setFormData({ ...formData, partnerYear: e.target.value })} />
                                            </div>
                                            <div className="span-3">
                                                <label className="modern-label">Degree</label>
                                                <select className="modern-select" value={formData.partnerDegree} onChange={(e) => setFormData({ ...formData, partnerDegree: e.target.value })}>
                                                    <option value="BSCS">BSCS</option>
                                                    <option value="BSSE">BSSE</option>
                                                    <option value="BSIT">BSIT</option>
                                                    <option value="BSAI">BS AI</option>
                                                    <option value="BSDS">BS DS</option>
                                                    <option value="BSCY">BS CY</option>
                                                </select>
                                            </div>
                                            <div className="span-3">
                                                <label className="modern-label">Sequence</label>
                                                <input type="text" className="modern-input" placeholder="e.g. 158" value={formData.partnerSequence} onChange={(e) => setFormData({ ...formData, partnerSequence: e.target.value })} />
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {(searchingPartner || partnerResults.length > 0 || selectedPartner) && (
                                                <div className="span-12 mt-2">
                                                    {searchingPartner ? (
                                                        <div className="text-muted x-small p-2 bg-light rounded shadow-sm d-flex align-items-center gap-2">
                                                            <div className="spinner-border spinner-border-sm" style={{ width: '0.7rem', height: '0.7rem' }}></div>
                                                            Verifying partner roll number...
                                                        </div>
                                                    ) : selectedPartner ? (
                                                        <div className="selected-partner-badge p-2 rounded-3 border-start border-4 border-success d-flex align-items-center justify-content-between" style={{ background: '#f0fff4' }}>
                                                            <div>
                                                                <div className="fw-bold text-success" style={{ fontSize: '0.75rem' }}>Partner Found & Verified</div>
                                                                <div className="text-dark fw-bold" style={{ fontSize: '0.8rem' }}>{selectedPartner.firstName} {selectedPartner.lastName}</div>
                                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>{selectedPartner.registrationNumber} • {selectedPartner.email}</div>
                                                            </div>
                                                            <button type="button" className="btn btn-link text-danger p-0 text-decoration-none" onClick={() => { setSelectedPartner(null); setPartnerResults([]); }}>
                                                                Change
                                                            </button>
                                                        </div>
                                                    ) : partnerResults.length > 0 && (
                                                        <div className="search-results-list border rounded shadow-sm bg-white overflow-hidden">
                                                            <div className="px-2 py-1 bg-light border-bottom x-small fw-bold text-muted">Select Matching Student</div>
                                                            {partnerResults.map(s => (
                                                                <div key={s._id} className="search-result-item p-2 border-bottom hover-bg-light cursor-pointer" onClick={() => handleSelectPartner(s)}>
                                                                    <div className="fw-bold" style={{ fontSize: '0.75rem' }}>{s.firstName} {s.lastName}</div>
                                                                    <div className="text-muted" style={{ fontSize: '0.6rem' }}>{s.registrationNumber}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-section-title">Abstract Draft</div>

                                        <div className="span-12">
                                            <textarea
                                                className="modern-textarea"
                                                rows="2"
                                                placeholder="Brief objective of your project (min 50 chars)..."
                                                value={formData.projectSummary}
                                                onChange={(e) => setFormData({ ...formData, projectSummary: e.target.value })}
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="span-12 d-flex justify-content-end pt-2">
                                            <button type="submit" className="modern-btn btn btn-primary px-5 py-2">
                                                Create Project Group
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Locked View - Minimalist */
                    <div className="row justify-content-center py-5">
                        <div className="col-lg-6 text-center">
                            <div className="glass-card py-5">
                                <div className="icon-circle mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
                                    <HiOutlineLockClosed />
                                </div>
                                <h5 className="fw-bold text-dark mb-2">Portal Restricted</h5>
                                <p className="text-muted small mb-4 px-4">
                                    Registration is currently inactive for your profile. Please contact the FYP coordinator for assistance.
                                </p>
                                <div className="d-flex align-items-center justify-content-center gap-2 text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                                    <HiOutlineClock size={16} />
                                    <span>Monitoring active for timeline updates</span>
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
