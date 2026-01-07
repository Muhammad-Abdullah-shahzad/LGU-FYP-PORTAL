import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorUsers.css';
import { HiOutlineTrash, HiOutlineBan, HiOutlineCheckCircle } from 'react-icons/hi';

const CoordinatorUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: 'supervisor', domain: '' });
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: 'password123',
        firstName: '',
        lastName: '',
        role: 'supervisor',
        registrationNumber: '',
        domain: 'AI',
        designation: 'Assistant Professor'
    });

    const specialities = [
        'AI',
        'ML',
        'Deep Learning',
        'CV',
        'NLP',
        'Cybersecurity',
        'Web Development',
        'Mobile Development',
        'AR/VR',
        'Data Science',
        'Software Engineering'
    ];

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filter.role) queryParams.append('role', filter.role);
            if (filter.domain) queryParams.append('domain', filter.domain);

            const res = await api.get(`/users?${queryParams.toString()}`);
            setUsers(res.data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await api.put(`/users/${user._id}`, { isActive: !user.isActive });
            setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !user.isActive } : u));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this supervisor? This action cannot be undone.')) return;
        try {
            await api.delete(`/users/${id}`);
            alert('Supervisor deleted successfully');
            fetchUsers();
        } catch (err) {
            alert('Failed to delete supervisor');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            alert('Supervisor added successfully');
            setShowModal(false);
            fetchUsers();
            setFormData({
                email: '', password: 'password123', firstName: '', lastName: '',
                role: 'supervisor', registrationNumber: '', domain: 'AI', designation: 'Assistant Professor'
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add supervisor');
        }
    };

    return (
        <DashboardLayout title="Faculty Management">
            <div className="users-page">
                <div className="action-bar px-3">
                    <div>
                        <h2 className="fw-bold m-0 font-outfit">Supervisors</h2>
                        <p className="text-muted small">Manage faculty members and their specialities.</p>
                    </div>
                    <div className="d-flex gap-3 align-items-center">
                        <select
                            className="form-select border-0 shadow-sm bg-white py-2"
                            style={{ borderRadius: '12px', minWidth: '180px' }}
                            value={filter.domain}
                            onChange={(e) => setFilter({ ...filter, domain: e.target.value })}
                        >
                            <option value="">All Specialities</option>
                            {specialities.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-primary-modern d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
                            <span>+ Add Supervisor</span>
                        </button>
                    </div>
                </div>

                <div className="table-container card border-0 shadow-sm rounded-4 overflow-hidden mt-4">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Faculty Name</th>
                                <th>Registration No</th>
                                <th>Email</th>
                                <th>Speciality</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <strong>{user.firstName} {user.lastName}</strong>
                                    </td>
                                    <td><code className="text-secondary fw-bold">{user.registrationNumber || 'N/A'}</code></td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className="badge bg-info bg-opacity-10 text-info border-0 rounded-pill px-3 py-2 fw-semibold" style={{ fontSize: '11px' }}>
                                            {user.domain?.[0] || user.domain || 'General CS'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`}></span>
                                            <span className="small fw-medium">{user.isActive ? 'Active' : 'Deactivated'}</span>
                                        </div>
                                    </td>
                                    <td className="text-end px-4">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button
                                                className={`btn btn-sm ${user.isActive ? 'btn-light text-warning' : 'btn-light text-success'} border-0 rounded-circle p-2`}
                                                onClick={() => handleToggleStatus(user)}
                                                title={user.isActive ? "Deactivate" : "Activate"}
                                                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                {user.isActive ? <HiOutlineBan size={18} /> : <HiOutlineCheckCircle size={18} />}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-light text-danger border-0 rounded-circle p-2"
                                                onClick={() => handleDelete(user._id)}
                                                title="Delete Permanently"
                                                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <HiOutlineTrash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="p-5 text-center text-muted">Loading supervisors...</div>}
                    {!loading && users.length === 0 && <div className="p-5 text-center text-muted">No supervisors found.</div>}
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-dialog-modern" style={{ maxWidth: '550px' }}>
                            <div className="modal-content card border-0 shadow-lg p-4 rounded-4">
                                <div className="modal-header border-0 mb-4 pb-0">
                                    <h3 className="fw-bold m-0 font-outfit">Add New Supervisor</h3>
                                    <button className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <form onSubmit={handleCreateUser}>
                                    <div className="row g-3">
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">FIRST NAME</label>
                                            <input type="text" className="form-control rounded-3 p-3 bg-light border-0" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="e.g. Abdullah" />
                                        </div>
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">LAST NAME</label>
                                            <input type="text" className="form-control rounded-3 p-3 bg-light border-0" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="e.g. Shahzad" />
                                        </div>
                                        <div className="col-md-12 text-start">
                                            <label className="form-label small fw-bold text-muted">EMAIL ADDRESS</label>
                                            <input type="email" className="form-control rounded-3 p-3 bg-light border-0" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="name@lgu.edu.pk" />
                                        </div>
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">FACULTY REGISTRATION NO</label>
                                            <input type="text" className="form-control rounded-3 p-3 bg-light border-0" required value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="LGU-FAC-001" />
                                        </div>
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">SPECIALITY (DOMAIN)</label>
                                            <select className="form-select rounded-3 p-3 bg-light border-0" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })}>
                                                {specialities.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="info-alert mt-4 bg-light border-0 text-muted rounded-3">
                                        <p className="small m-0">Default password will be <strong>password123</strong>. The faculty member can change it after their first login.</p>
                                    </div>

                                    <div className="modal-footer border-0 px-0 mt-4 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Add Supervisor</button>
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

export default CoordinatorUsers;
