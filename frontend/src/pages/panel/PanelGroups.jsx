import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';

const PanelGroups = () => {
    const { panelId } = useParams();
    const [groups, setGroups] = useState([]);
    const [panel, setPanel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPanelData();
    }, [panelId]);

    const fetchPanelData = async () => {
        try {
            const res = await api.get(`/panels/${panelId}/groups`);
            setGroups(res.data.groups || []);
            setPanel(res.data.panel);
        } catch (err) {
            console.error('Error fetching panel groups:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading Groups...</div>;

    return (
        <DashboardLayout title={`Panel: ${panel?.panelName || 'Groups'}`}>
            <div className="container-fluid p-0">
                <div className="mb-4">
                    <Link to="/panel/dashboard" className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="mb-4 d-flex align-items-center justify-content-between">
                    <h5 className="fw-bold m-0 font-outfit">Groups for Evaluation</h5>
                    <span className="badge bg-primary rounded-pill px-3 py-2">{groups.length} Groups Assigned</span>
                </div>

                {groups.length === 0 ? (
                    <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                        <div className="mb-3 fs-1">👥</div>
                        <h5 className="text-secondary">No groups assigned yet</h5>
                        <p className="text-muted small">Groups will appear here once the coordinator assigns them to this panel.</p>
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-secondary">Group ID</th>
                                        <th className="py-3 border-0 small text-uppercase fw-bold text-secondary">Project Name</th>
                                        <th className="py-3 border-0 small text-uppercase fw-bold text-secondary">Members</th>
                                        <th className="py-3 border-0 small text-uppercase fw-bold text-secondary">Supervisor</th>
                                        <th className="py-3 border-0 small text-uppercase fw-bold text-secondary text-end px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map((g) => (
                                        <tr key={g._id}>
                                            <td className="px-4 py-3 fw-bold text-primary">{g.groupId}</td>
                                            <td className="py-3">
                                                <span className="fw-bold text-dark d-block">{g.projectName || 'Not Set'}</span>
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex flex-wrap gap-1">
                                                    {g.members?.map(m => (
                                                        <span key={m._id} className="badge bg-light text-dark border rounded-pill fw-normal px-2">
                                                            {m.firstName}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar px-2 py-1 bg-primary bg-opacity-10 text-primary rounded-circle small me-2" style={{ fontSize: '0.7rem' }}>
                                                        {g.supervisor?.firstName?.charAt(0)}
                                                    </div>
                                                    <span className="text-secondary small">{g.supervisor?.firstName} {g.supervisor?.lastName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-end px-4">
                                                <button
                                                    className="btn btn-primary btn-sm rounded-pill px-4 fw-bold"
                                                    onClick={() => window.alert('Evaluation form coming soon!')}
                                                >
                                                    Evaluate
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

export default PanelGroups;
