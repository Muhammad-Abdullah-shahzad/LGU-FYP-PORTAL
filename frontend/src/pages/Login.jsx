import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
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

        const result = await login(formData.email, formData.password);

        if (result.success) {
            // Redirect based on role
            const role = result.user.role;
            switch (role) {
                case 'coordinator':
                    navigate('/coordinator/dashboard');
                    break;
                case 'supervisor':
                    navigate('/supervisor/dashboard');
                    break;
                case 'panel_member':
                    navigate('/panel/dashboard');
                    break;
                case 'student':
                    navigate('/student/dashboard');
                    break;
                case 'external_supervisor':
                    navigate('/external-supervisor/dashboard');
                    break;
                default:
                    navigate('/');
            }
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
            <div className="card border" style={{ maxWidth: '500px', width: '100%', borderRadius: '1.25rem' }}>
                <div className="card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                        <h2 className="fw-bold text-success mb-1">LGU FYP PORTAL</h2>
                        <p className="text-muted">Login to your account</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger py-2 small border-0 mb-4" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-secondary" htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                className="form-control form-control-lg border-0 bg-light fs-6"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@lgu.edu.pk"
                                style={{ borderRadius: '0.75rem' }}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label small fw-semibold text-secondary" htmlFor="password">Password</label>
                            <input
                                type="password"
                                className="form-control form-control-lg border-0 bg-light fs-6"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                style={{ borderRadius: '0.75rem' }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success btn-lg w-100 fw-bold shadow-sm mb-3"
                            disabled={loading}
                            style={{ borderRadius: '0.75rem' }}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : null}
                            {loading ? 'Logging in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="text-center mt-3">
                        <p className="text-muted small">
                            Don't have an account? <Link to="/register" className="text-primary fw-bold text-decoration-none">Register here</Link>
                        </p>
                    </div>

                    <hr className="my-4 text-muted" />

                    {import.meta.env.VITE_SHOW_DEMO_BTN === 'true' && (
                        <div className="demo-access">
                            <p className="text-center text-secondary x-small mb-3 fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05rem' }}>
                                Quick Access (Demo)
                            </p>
                            <div className="d-flex flex-wrap gap-2 justify-content-center">
                                <button
                                    className="btn btn-outline-secondary btn-sm px-3"
                                    style={{ borderRadius: '2rem', fontSize: '0.8rem' }}
                                    onClick={() => setFormData({ email: 'coordinator@lgu.edu.pk', password: 'password123' })}
                                >
                                    Coordinator
                                </button>
                                <button
                                    className="btn btn-outline-secondary btn-sm px-3"
                                    style={{ borderRadius: '2rem', fontSize: '0.8rem' }}
                                    onClick={() => setFormData({ email: 'supervisor1@lgu.edu.pk', password: 'password123' })}
                                >
                                    Supervisor
                                </button>
                                <button
                                    className="btn btn-outline-secondary btn-sm px-3"
                                    style={{ borderRadius: '2rem', fontSize: '0.8rem' }}
                                    onClick={() => setFormData({ email: 'student1@lgu.edu.pk', password: 'password123' })}
                                >
                                    Student
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
