import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { HiOutlineUserGroup, HiOutlineExternalLink } from 'react-icons/hi';
import './SupervisorGroups.css';

const SupervisorGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
        <DashboardLayout title="Faculty Roster">
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="My Supervised Groups">
            <div className="groups-container-wrapper">
                {groups.length === 0 ? (
                    <div className="text-center py-5 bg-white border rounded-3 shadow-sm">
                        <HiOutlineUserGroup size={48} className="text-muted mb-3 opacity-30" />
                        <h6 className="fw-bold text-dark">No Active Assignments</h6>
                        <p className="text-muted small">You are not currently supervising any approved FYP groups.</p>
                    </div>
                ) : (
                    <div className="table-glass-card shadow-sm">
                        <div className="table-responsive">
                            <table className="table minimal-table mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th>Ref ID</th>
                                        <th>Project Title</th>
                                        <th>Academic Domain</th>
                                        <th>Current Status</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map((group) => (
                                        <tr key={group._id}>
                                            <td>
                                                <div className="group-name-bold">{group.groupName}</div>
                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>{group.batch}-{group.year}</div>
                                            </td>
                                            <td>
                                                <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem', maxWidth: '300px' }}>{group.projectTitle}</div>
                                            </td>
                                            <td>
                                                <span className="domain-pill-outline">{group.projectDomain}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge-minimal ${group.status === 'completed' ? 'status-success' : 'status-primary'}`}>
                                                    {group.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    className="action-btn-sharp"
                                                    onClick={() => navigate(`/supervisor/groups/${group._id}`)}
                                                >
                                                    Review <HiOutlineExternalLink size={14} className="ms-1" />
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

