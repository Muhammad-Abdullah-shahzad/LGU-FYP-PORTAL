import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorGroups.css';
import { HiOutlineUserGroup, HiOutlineSearch } from 'react-icons/hi';

const CoordinatorGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        batch: '',
        batchYear: '',
        semester: '',
        status: '',
        supervisorStatus: ''
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i + 1);

    useEffect(() => {
        // Initialize filters from URL search params
        const params = new URLSearchParams(window.location.search);
        const urlFilters = {
            batch: params.get('batch') || '',
            batchYear: params.get('batchYear') || '',
            semester: params.get('semester') || '',
            status: params.get('status') || '',
            supervisorStatus: params.get('supervisorStatus') || ''
        };
        setFilters(urlFilters);
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [filters]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters).toString();
            const res = await api.get(`/groups?${query}`);
            setGroups(res.data.groups || []);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPanelInfo = (group) => {
        if (group.externalPanel) return { label: 'EXTERNAL', type: 'external', members: group.externalPanel.members };
        if (group.internalPanel) return { label: 'INTERNAL', type: 'internal', members: group.internalPanel.members };
        if (group.srsPanel) return { label: 'SRS', type: 'srs', members: group.srsPanel.members };
        if (group.proposalPanel) return { label: 'PROPOSAL', type: 'proposal', members: group.proposalPanel.members };
        return null;
    };

    return (
        <DashboardLayout title="Project Oversight">
            <div className="groups-container">
                {/* Header Section */}
                <div className="mb-4">
                    <h5 className="fw-bold text-dark mb-1">Group Directory</h5>
                    <p className="text-muted small">Monitor formations, supervisor assignments, and defense panels.</p>
                </div>

                {/* Filters Bar */}
                <div className="filter-card-minimal shadow-sm">
                    <div className="filter-grid">
                        <div>
                            <label className="filter-label-minimal">Academic Batch</label>
                            <select className="filter-select-minimal" value={filters.batch} onChange={(e) => setFilters({ ...filters, batch: e.target.value })}>
                                <option value="">All Batches</option>
                                <option value="Fall">Fall</option>
                                <option value="Spring">Spring</option>
                            </select>
                        </div>
                        <div>
                            <label className="filter-label-minimal">Enrollment Year</label>
                            <select className="filter-select-minimal" value={filters.batchYear} onChange={(e) => setFilters({ ...filters, batchYear: e.target.value })}>
                                <option value="">All Years</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="filter-label-minimal">Active Semester</label>
                            <select className="filter-select-minimal" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
                                <option value="">All Semesters</option>
                                <option value="7">Semester 7</option>
                                <option value="8">Semester 8</option>
                            </select>
                        </div>
                        <div>
                            <label className="filter-label-minimal">Status</label>
                            <select className="filter-select-minimal" value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <option value="">All Statuses</option>
                                <option value="completed">Passed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div>
                            <label className="filter-label-minimal">Supervisor Approval</label>
                            <select className="filter-select-minimal" value={filters.supervisorStatus || ''} onChange={(e) => setFilters({ ...filters, supervisorStatus: e.target.value })}>
                                <option value="">All Statuses</option>
                                <option value="pending">Pending Response</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <button className="btn-filter-minimal w-100 d-flex align-items-center justify-content-center gap-2" onClick={fetchGroups}>
                                <HiOutlineSearch size={14} /> Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Groups Directory Table */}
                <div className="table-glass-card shadow-sm">
                    <div className="table-responsive">
                        <table className="minimal-table align-middle">
                            <thead>
                                <tr>
                                    <th>Identifer & Title</th>
                                    <th>Session</th>
                                    <th>Supervisor</th>
                                    <th>Assigned Panel</th>
                                    <th className="text-center">Team</th>
                                    <th className="text-end">Lifecycle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map((group) => {
                                    const panel = getPanelInfo(group);
                                    return (
                                        <tr key={group._id}>
                                            <td style={{ minWidth: '240px' }}>
                                                <div className="group-id-bold">{group.groupName}</div>
                                                <div className="project-title-sub text-truncate" style={{ maxWidth: '280px' }} title={group.projectTitle}>
                                                    {group.projectTitle}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="batch-pill-minimal">
                                                    {group.batch} {group.batchYear || group.year}
                                                </span>
                                                <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>Sem {group.semester}</div>
                                            </td>
                                            <td>
                                                {group.supervisor ? (
                                                    <div className="person-tag-minimal flex-column align-items-start">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="person-initials-minimal">
                                                                {group.supervisor.firstName[0]}{group.supervisor.lastName[0]}
                                                            </div>
                                                            <span className="fw-semibold" style={{ fontSize: '0.75rem' }}>{group.supervisor.firstName} {group.supervisor.lastName}</span>
                                                        </div>
                                                        {group.supervisorStatus === 'pending' && (
                                                            <span className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.55rem', padding: '0.15rem 0.35rem' }}>PENDING RESPONSE</span>
                                                        )}
                                                        {group.supervisorStatus === 'rejected' && (
                                                            <span className="badge bg-danger mt-1" style={{ fontSize: '0.55rem', padding: '0.15rem 0.35rem' }}>REJECTED</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small opacity-50 italic">TBD</span>
                                                )}
                                            </td>
                                            <td>
                                                {panel ? (
                                                    <div>
                                                        <span className={`panel-label-minimal panel-${panel.type}`}>
                                                            {panel.label} PANEL
                                                        </span>
                                                        <div className="text-muted text-truncate" style={{ fontSize: '0.65rem', maxWidth: '150px' }}>
                                                            {panel.members?.map(m => `${m.firstName[0]}. ${m.lastName}`).join(', ')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small opacity-50 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-1">
                                                    {[group.student1, group.student2].filter(Boolean).map((s, i) => (
                                                        <div key={i} className="person-initials-minimal bg-white" title={`${s.firstName} ${s.lastName}`}>
                                                            {s.firstName[0]}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <span className={`status-badge-minimal ${group.status === 'completed' ? 'status-success' : (group.status.includes('rejected') ? 'status-danger' : 'status-info')}`}>
                                                    {group.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {groups.length === 0 && !loading && (
                        <div className="p-5 text-center">
                            <HiOutlineUserGroup size={40} className="text-muted opacity-20 mb-3" />
                            <h6 className="text-muted">No student groups found match these criteria</h6>
                        </div>
                    )}

                    {loading && (
                        <div className="p-5 text-center">
                            <div className="spinner-border text-primary spinner-border-sm mb-2"></div>
                            <div className="text-muted small">Synchronizing directory...</div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CoordinatorGroups;
