import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineExternalLink } from 'react-icons/hi';
import './SupervisorGroups.css';

const SupervisorGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups/supervisor/my-groups');
            setGroups(res.data.groups || []);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <DashboardLayout title="My Supervised Groups">
            <div className="d-flex justify-content-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="My Supervised Groups">
            <div className="container-fluid p-0">
                {groups.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                        <HiOutlineUserGroup size={60} className="text-muted mb-3 opacity-25" />
                        <h3 className="fw-bold font-outfit">No Groups Assigned</h3>
                        <p className="text-muted">You are not currently supervising any approved FYP groups.</p>
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 border-0 small fw-bold text-uppercase text-muted">Group Name</th>
                                        <th className="py-3 border-0 small fw-bold text-uppercase text-muted">Project Title</th>
                                        <th className="py-3 border-0 small fw-bold text-uppercase text-muted">Domain</th>
                                        <th className="py-3 border-0 small fw-bold text-uppercase text-muted">Status</th>
                                        <th className="px-4 py-3 border-0 small fw-bold text-uppercase text-muted text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map((group) => (
                                        <tr key={group._id}>
                                            <td className="px-4">
                                                <div className="fw-bold text-dark">{group.groupName}</div>
                                                <div className="x-small text-muted">{group.batch} {group.year}</div>
                                            </td>
                                            <td>
                                                <div className="fw-bold small">{group.projectTitle}</div>
                                            </td>
                                            <td>
                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1">
                                                    {group.projectDomain}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge bg-${group.status === 'completed' ? 'success' : 'primary'}-subtle text-${group.status === 'completed' ? 'success' : 'primary'} rounded-pill px-3 py-1 text-uppercase`} style={{ fontSize: '0.65rem' }}>
                                                    {group.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 text-end">
                                                <button className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold" onClick={() => alert('Detailed view coming soon!')}>
                                                    View <HiOutlineExternalLink size={14} className="ms-1" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SupervisorGroups;
