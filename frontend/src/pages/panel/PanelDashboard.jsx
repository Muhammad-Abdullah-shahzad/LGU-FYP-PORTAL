import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';

import StatsCard from '../../components/StatsCard';
import { HiOutlinePresentationChartBar } from 'react-icons/hi';

const PanelDashboard = () => {
    const [panels, setPanels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPanels();
    }, []);

    const fetchPanels = async () => {
        try {
            const res = await api.get('/panels/my-panels');
            setPanels(res.data.panels || []);
        } catch (err) {
            console.error('Error fetching panels:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="Panel Dashboard">
            <div className="container-fluid p-0">
                <div className="row g-4 mb-3">
                    <div className="col-md-4">
                        <StatsCard
                            title="Assigned Panels"
                            value={panels.length}
                            icon={<HiOutlinePresentationChartBar size={28} />}
                            color="primary"
                            subtitle="Defense Schedule"
                        />
                    </div>
                </div>

                <div className="mb-3 d-flex align-items-center justify-content-between">
                    <h6 className="fw-bold m-0 font-outfit text-dark">Upcoming Defense Panels</h6>
                </div>

                {panels.length === 0 ? (
                    <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                        <div className="mb-3 fs-1">📅</div>
                        <h5 className="text-secondary">No panels assigned yet</h5>
                        <p className="text-muted small">You will see your defense panel schedule here once assigned by the coordinator.</p>
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-2 border-0 small text-uppercase fw-bold text-secondary">Panel Name</th>
                                        <th className="py-2 border-0 small text-uppercase fw-bold text-secondary">Date</th>
                                        <th className="py-2 border-0 small text-uppercase fw-bold text-secondary">Type</th>
                                        <th className="py-2 border-0 small text-uppercase fw-bold text-secondary">Semester</th>
                                        <th className="py-2 border-0 small text-uppercase fw-bold text-secondary">Status</th>
                                        <th className="py-2 border-0 small text-uppercase fw-bold text-secondary text-end px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {panels.map((p) => (
                                        <tr key={p._id}>
                                            <td className="px-4 py-2">
                                                <span className="fw-bold text-dark">{p.panelName}</span>
                                            </td>
                                            <td className="py-2 text-secondary">
                                                {new Date(p.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="py-2">
                                                <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-3 py-2 text-uppercase" style={{ fontSize: '0.65rem' }}>
                                                    {p.type}
                                                </span>
                                            </td>
                                            <td className="py-2 text-secondary">
                                                Sem {p.semester}
                                            </td>
                                            <td className="py-2">
                                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2 text-uppercase" style={{ fontSize: '0.65rem' }}>
                                                    Upcoming
                                                </span>
                                            </td>
                                            <td className="py-2 text-end px-4">
                                                <Link to={`/panel/${p._id}/groups`} className="btn btn-primary btn-sm rounded-pill px-4 fw-bold">
                                                    View Groups
                                                </Link>
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

export default PanelDashboard;
