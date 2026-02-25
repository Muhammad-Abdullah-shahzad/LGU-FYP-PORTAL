import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    HiOutlineLockClosed,
    HiOutlineKey,
    HiOutlineShieldCheck,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlineInformationCircle
} from 'react-icons/hi';
import './SupervisorSettings.css';

const SupervisorSettings = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const toggleVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await api.put('/auth/change-password', formData);
            setSuccess(res.data.message || 'Password changed successfully!');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="Account Settings">
            <div className="settings-container">
                <div className="row justify-content-center">
                    <div className="col-lg-7">
                        {/* Profile Info Card */}
                        <div className="settings-profile-card mb-4">
                            <div className="profile-avatar shadow-sm">
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </div>
                            <div className="profile-info">
                                <h5 className="fw-bold mb-0">{user?.firstName} {user?.lastName}</h5>
                                <p className="text-muted mb-0 small">{user?.email}</p>
                                <span className="badge rounded-pill mt-2 px-3 py-1 supervisor-role-badge">
                                    {user?.role?.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Change Password Card */}
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="header-icon">
                                    <HiOutlineLockClosed size={20} />
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0">Change Password</h6>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>Update your account security credentials</p>
                                </div>
                            </div>

                            <div className="settings-card-body">
                                {error && (
                                    <div className="alert-custom alert-error">
                                        <HiOutlineInformationCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="alert-custom alert-success-custom">
                                        <HiOutlineShieldCheck size={16} />
                                        <span>{success}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="password-field-group">
                                        <label className="field-label">
                                            <HiOutlineKey className="label-icon" size={14} />
                                            Current Password
                                        </label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPasswords.current ? 'text' : 'password'}
                                                name="currentPassword"
                                                className="password-input"
                                                placeholder="Enter your current password"
                                                value={formData.currentPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="visibility-toggle"
                                                onClick={() => toggleVisibility('current')}
                                            >
                                                {showPasswords.current ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="password-divider">
                                        <span>New Credentials</span>
                                    </div>

                                    <div className="password-field-group">
                                        <label className="field-label">
                                            <HiOutlineLockClosed className="label-icon" size={14} />
                                            New Password
                                        </label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPasswords.new ? 'text' : 'password'}
                                                name="newPassword"
                                                className="password-input"
                                                placeholder="Min 6 characters"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                className="visibility-toggle"
                                                onClick={() => toggleVisibility('new')}
                                            >
                                                {showPasswords.new ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="password-field-group">
                                        <label className="field-label">
                                            <HiOutlineShieldCheck className="label-icon" size={14} />
                                            Confirm New Password
                                        </label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                name="confirmPassword"
                                                className="password-input"
                                                placeholder="Re-enter new password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="visibility-toggle"
                                                onClick={() => toggleVisibility('confirm')}
                                            >
                                                {showPasswords.confirm ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="change-password-btn"
                                        disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                                    >
                                        {loading ? (
                                            <div className="spinner-border spinner-border-sm" />
                                        ) : (
                                            <>
                                                <HiOutlineLockClosed size={16} />
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            <div className="settings-card-footer">
                                <HiOutlineInformationCircle size={14} />
                                <span>For security, you will remain logged in after changing your password. Use a strong, unique password.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SupervisorSettings;
