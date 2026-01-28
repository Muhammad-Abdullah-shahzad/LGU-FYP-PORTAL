import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorUsers.css';
import {
    HiOutlineTrash,
    HiOutlineBan,
    HiOutlineCheckCircle,
    HiOutlinePlus,
    HiOutlineX
} from 'react-icons/hi';

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
        'AI', 'ML', 'Deep Learning', 'CV', 'NLP', 'Cybersecurity',
        'Web Development', 'Mobile Development', 'AR/VR', 'Data Science', 'Software Engineering'
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
        if (!window.confirm('Permanent deletion is irreversible. Continue?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
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
        <DashboardLayout title="Faculty Roster">
            <div className="users-container">
                {/* Header & Filter Bar */}
                <div className="action-bar-minimal">
                    <div>
                        <h5 className="fw-bold text-dark mb-1">Supervisors</h5>
                        <p className="text-muted small mb-0">Manage faculty credentials and specializations.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <select
                            className="filter-select-minimal"
                            value={filter.domain}
                            onChange={(e) => setFilter({ ...filter, domain: e.target.value })}
                        >
                            <option value="">All Specializations</option>
                            {specialities.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="btn-add-minimal d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
                            <HiOutlinePlus size={16} /> <span>Add Roster</span>
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="table-glass-card shadow-sm mt-4">
                    <table className="minimal-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Ref ID</th>
                                <th>Email Address</th>
                                <th>Domain</th>
                                <th>Auth Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <div className="user-name-bold">{user.firstName} {user.lastName}</div>
                                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>{user.designation || 'Faculty Member'}</div>
                                    </td>
                                    <td><span className="reg-no-code">{user.registrationNumber || 'N/A'}</span></td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className="domain-pill-outline">
                                            {typeof user.domain === 'string' ? user.domain : user.domain?.[0] || 'General'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="status-pill">
                                            <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`}></span>
                                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>{user.isActive ? 'ACTIVE' : 'LOCKED'}</span>
                                        </div>
                                    </td>
                                    <td className="text-end">
                                        <button
                                            className="action-btn-minimal"
                                            onClick={() => handleToggleStatus(user)}
                                            title={user.isActive ? "Lock Account" : "Unlock Account"}
                                        >
                                            {user.isActive ? <HiOutlineBan size={14} /> : <HiOutlineCheckCircle size={14} />}
                                        </button>
                                        <button
                                            className="action-btn-minimal delete"
                                            onClick={() => handleDelete(user._id)}
                                            title="Permanently Delete"
                                        >
                                            <HiOutlineTrash size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="p-4 text-center text-muted small italic">Refreshing directory...</div>}
                    {!loading && users.length === 0 && <div className="p-4 text-center text-muted small">No faculty members found in the current directory.</div>}
                </div>

                {/* Add User Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-minimal">
                            <div className="modal-header-minimal">
                                <h3>Register New Faculty</h3>
                                <button className="btn btn-link link-secondary p-0" onClick={() => setShowModal(false)}>
                                    <HiOutlineX size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser}>
                                <div className="row g-2 mb-3">
                                    <div className="col-6">
                                        <label className="modal-form-label">First Name</label>
                                        <input type="text" className="modal-input-minimal" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="e.g. Abdullah" />
                                    </div>
                                    <div className="col-6">
                                        <label className="modal-form-label">Last Name</label>
                                        <input type="text" className="modal-input-minimal" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="e.g. Shahzad" />
                                    </div>
                                </div>
                                <label className="modal-form-label">LGU Email Address</label>
                                <input type="email" className="modal-input-minimal" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="faculty@lgu.edu.pk" />

                                <div className="row g-2 mb-3">
                                    <div className="col-6">
                                        <label className="modal-form-label">Registration No</label>
                                        <input type="text" className="modal-input-minimal" required value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="LGU-FAC-001" />
                                    </div>
                                    <div className="col-6">
                                        <label className="modal-form-label">Core Domain</label>
                                        <select className="modal-input-minimal" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })}>
                                            {specialities.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-2 bg-light rounded-2 mb-4" style={{ border: '1px solid #e2e8f0' }}>
                                    <p className="m-0 text-muted" style={{ fontSize: '0.65rem' }}>Default credential: <strong>password123</strong>. Role set to <strong>Supervisor</strong>.</p>
                                </div>

                                <div className="modal-footer-minimal">
                                    <button type="button" className="btn btn-light btn-sm px-3 fw-bold" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-add-minimal">Authorize Faculty</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CoordinatorUsers;
