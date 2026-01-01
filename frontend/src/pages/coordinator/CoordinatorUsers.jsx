import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorUsers.css';

const CoordinatorUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: '', domain: '' });
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: 'password123',
        firstName: '',
        lastName: '',
        role: 'student',
        registrationNumber: '',
        domain: '',
        designation: ''
    });

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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            alert('User deactivated successfully');
            fetchUsers();
        } catch (err) {
            alert('Failed to deactivate user');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            alert('User created successfully');
            setShowModal(false);
            fetchUsers();
            setFormData({
                email: '', password: 'password123', firstName: '', lastName: '',
                role: 'student', registrationNumber: '', domain: '', designation: ''
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create user');
        }
    };

    return (
        <DashboardLayout title="User Management">
            <div className="users-page">
                <div className="action-bar">
                    <div className="filters">
                        <select value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value })}>
                            <option value="">All Roles</option>
                            <option value="student">Student</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="panel_member">Panel Member</option>
                        </select>
                        <select value={filter.domain} onChange={(e) => setFilter({ ...filter, domain: e.target.value })}>
                            <option value="">All Domains</option>
                            <option value="Software Engineering">Software Engineering</option>
                            <option value="Artificial Intelligence">Artificial Intelligence</option>
                            <option value="Data Science">Data Science</option>
                        </select>
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>+ Create New User</button>
                </div>

                <div className="table-container card">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Details</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td><strong>{user.firstName} {user.lastName}</strong></td>
                                    <td>{user.email}</td>
                                    <td><span className={`role-tag ${user.role}`}>{user.role.replace('_', ' ')}</span></td>
                                    <td>
                                        {user.role === 'student' ? user.registrationNumber : user.domain || 'N/A'}
                                    </td>
                                    <td>
                                        <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`}></span>
                                        {user.isActive ? 'Active' : 'Deactivated'}
                                    </td>
                                    <td>
                                        <button className="btn-delete" onClick={() => handleDelete(user._id)}>Deactivate</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="loading-overlay">Loading...</div>}
                    {!loading && users.length === 0 && <div className="empty-table">No users found match your filters.</div>}
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content card">
                            <h2>Add New User</h2>
                            <form onSubmit={handleCreateUser}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="student">Student</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="panel_member">Panel Member</option>
                                    </select>
                                </div>

                                {formData.role === 'student' ? (
                                    <div className="form-group">
                                        <label>Registration Number</label>
                                        <input type="text" required value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} />
                                    </div>
                                ) : (
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Domain</label>
                                            <input type="text" required value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Designation</label>
                                            <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Create User</button>
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
