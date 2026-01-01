import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';

const CoordinatorGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        batch: '',
        year: '',
        semester: ''
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i + 1);

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

    return (
        <DashboardLayout title="Group Oversight">
            <div className="container-fluid p-0">
                {/* Filters */}
                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body p-4">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label small fw-bold text-muted text-uppercase">Batch</label>
                                <select className="form-select border-0 bg-light rounded-3" value={filters.batch} onChange={(e) => setFilters({ ...filters, batch: e.target.value })}>
                                    <option value="">All Batches</option>
                                    <option value="Fall">Fall</option>
                                    <option value="Spring">Spring</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-bold text-muted text-uppercase">Year</label>
                                <select className="form-select border-0 bg-light rounded-3" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
                                    <option value="">All Years</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-bold text-muted text-uppercase">Semester</label>
                                <select className="form-select border-0 bg-light rounded-3" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
                                    <option value="">All Semesters</option>
                                    <option value="7">7th Semester</option>
                                    <option value="8">8th Semester</option>
                                </select>
                            </div>
                            <div className="col-md-3 d-flex align-items-end">
                                <button className="btn btn-primary w-100 rounded-pill fw-bold" onClick={fetchGroups}>
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Groups Table */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 border-0">Group Info</th>
                                    <th className="border-0 text-center">Batch/Sem</th>
                                    <th className="border-0">Supervisor</th>
                                    <th className="border-0 text-center">Members</th>
                                    <th className="border-0 pe-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map((group) => (
                                    <tr key={group._id}>
                                        <td className="ps-4 py-3">
                                            <div className="fw-bold text-primary mb-0">{group.groupName}</div>
                                            <div className="small text-muted">{group.projectTitle}</div>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                                                {group.batch} {group.year}
                                            </span>
                                            <div className="x-small text-muted mt-1">Semester {group.semester}</div>
                                        </td>
                                        <td>
                                            {group.supervisor ? (
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-light rounded-circle p-2 me-2" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>👨‍🏫</div>
                                                    <span className="small fw-bold">{group.supervisor.firstName} {group.supervisor.lastName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted small italic">Not Assigned</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <div className="avatar-group d-flex justify-content-center">
                                                {group.student1 && <span className="badge bg-light text-dark rounded-circle border p-2" title={`${group.student1.firstName} (Leader)`} style={{ width: '30px', height: '30px' }}>{group.student1.firstName[0]}</span>}
                                                {group.student2 && <span className="badge bg-light text-dark rounded-circle border p-2 ms-n2" title={group.student2.firstName} style={{ width: '30px', height: '30px' }}>{group.student2.firstName[0]}</span>}
                                            </div>
                                        </td>
                                        <td className="pe-4">
                                            <span className={`badge bg-${group.status === 'completed' ? 'success' : (group.status.includes('rejected') ? 'danger' : 'info')}-subtle text-${group.status === 'completed' ? 'success' : (group.status.includes('rejected') ? 'danger' : 'info')} rounded-pill px-3 py-2 text-uppercase`} style={{ fontSize: '0.65rem' }}>
                                                {group.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {groups.length === 0 && !loading && (
                        <div className="p-5 text-center">
                            <div className="fs-1 opacity-25">👥</div>
                            <h5 className="text-secondary mt-3">No groups found mapping these filters</h5>
                        </div>
                    )}
                    {loading && (
                        <div className="p-5 text-center">
                            <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                            <span className="text-muted">Loading groups...</span>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CoordinatorGroups;
