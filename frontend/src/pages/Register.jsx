import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        firstName: '',
        lastName: '',
        rollSequence: '',
        batch: 'Fa',
        enrolledYear: new Date().getFullYear(),
        semester: 7,
        degree: 'BSCS',
        domain: '',
        designation: ''
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Prepare data
        const { confirmPassword, domain, designation, ...registerData } = formData;

        const result = await register(registerData);

        if (result.success) {
            navigate('/student/dashboard');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-5">
            <div className="card shadow-lg border-0" style={{ maxWidth: '600px', width: '100%', borderRadius: '1.25rem' }}>
                <div className="card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                        <h2 className="fw-bold text-primary mb-1">Create Account</h2>
                        <p className="text-muted small">Join the LGU FYP PORTAL as a Student</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger py-2 small border-0 mb-4" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-secondary" htmlFor="firstName">First Name *</label>
                                <input
                                    type="text"
                                    className="form-control border-0 bg-light fs-6"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-secondary" htmlFor="lastName">Last Name *</label>
                                <input
                                    type="text"
                                    className="form-control border-0 bg-light fs-6"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-12">
                                <label className="form-label small fw-semibold text-secondary" htmlFor="email">Email Address *</label>
                                <input
                                    type="email"
                                    className="form-control border-0 bg-light fs-6"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@lgu.edu.pk"
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-secondary">Batch *</label>
                                <select
                                    className="form-select border-0 bg-light fs-6"
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleChange}
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                >
                                    <option value="Fa">Fa (Fall)</option>
                                    <option value="Sp">Sp (Spring)</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-secondary">Degree *</label>
                                <select
                                    className="form-select border-0 bg-light fs-6"
                                    name="degree"
                                    value={formData.degree}
                                    onChange={handleChange}
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                >
                                    <option value="BSCS">BSCS</option>
                                    <option value="BSSE">BSSE</option>
                                    <option value="BSIT">BSIT</option>
                                    <option value="BSAI">BS AI</option>
                                    <option value="BSDS">BS DS</option>
                                    <option value="BSCY">BS CY</option>
                                </select>
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-secondary">Enrollment Year *</label>
                                <select
                                    className="form-select border-0 bg-light fs-6"
                                    name="enrolledYear"
                                    value={formData.enrolledYear}
                                    onChange={handleChange}
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-secondary" htmlFor="rollSequence">Roll Sequence No *</label>
                                <input
                                    type="number"
                                    className="form-control border-0 bg-light fs-6"
                                    id="rollSequence"
                                    name="rollSequence"
                                    value={formData.rollSequence}
                                    onChange={handleChange}
                                    placeholder="e.g. 158"
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                />
                                {formData.rollSequence && (
                                    <div className="mt-1 x-small fw-bold text-primary">
                                        Generated Roll No: {formData.batch}-{formData.enrolledYear}/{formData.degree}/{formData.rollSequence}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-secondary" htmlFor="password">Password *</label>
                                <input
                                    type="password"
                                    className="form-control border-0 bg-light fs-6"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength="6"
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-secondary" htmlFor="confirmPassword">Confirm *</label>
                                <input
                                    type="password"
                                    className="form-control border-0 bg-light fs-6"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    minLength="6"
                                    style={{ borderRadius: '0.75rem' }}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-100 fw-bold shadow-sm mb-3 font-outfit"
                            disabled={loading}
                            style={{ borderRadius: '0.75rem' }}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : null}
                            {loading ? 'Registering...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="text-center mt-3">
                        <p className="text-muted small">
                            Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Login here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
