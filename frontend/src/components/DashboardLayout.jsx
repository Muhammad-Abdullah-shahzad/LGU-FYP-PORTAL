import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';
import {
    HiOutlineViewGrid,
    HiOutlineUserGroup,
    HiOutlineDocumentText,
    HiOutlineAcademicCap,
    HiOutlineUsers,
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlineLogout,
    HiOutlineShieldCheck,
    HiOutlineMail
} from 'react-icons/hi';

const DashboardLayout = ({ children, title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    const getNavItems = () => {
        switch (user?.role) {
            case 'student':
                return [
                    { to: '/student/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid size={20} /> },
                    { to: '/student/group', label: 'My Group', icon: <HiOutlineUserGroup size={20} /> },
                    { to: '/student/proposal', label: 'Proposal', icon: <HiOutlineDocumentText size={20} /> },
                    { to: '/student/defense', label: 'Defense', icon: <HiOutlineAcademicCap size={20} /> },
                ];
            case 'supervisor':
                return [
                    { to: '/supervisor/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid size={20} /> },
                    { to: '/supervisor/requests', label: 'Requests', icon: <HiOutlineMail size={20} /> },
                    { to: '/supervisor/groups', label: 'My Groups', icon: <HiOutlineUserGroup size={20} /> },
                ];
            case 'panel_member':
                return [
                    { to: '/panel/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid size={20} /> },
                    { to: '/panel/defenses', label: 'Defenses', icon: <HiOutlineAcademicCap size={20} /> },
                ];
            case 'coordinator':
                return [
                    { to: '/coordinator/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid size={20} /> },
                    { to: '/coordinator/users', label: 'Users', icon: <HiOutlineUsers size={20} /> },
                    { to: '/coordinator/groups', label: 'Groups', icon: <HiOutlineUserGroup size={20} /> },
                    { to: '/coordinator/panels', label: 'Panels', icon: <HiOutlineShieldCheck size={20} /> },
                    { to: '/coordinator/timeline', label: 'Timeline', icon: <HiOutlineCalendar size={20} /> },
                ];
            default:
                return [];
        }
    };

    return (
        <div className="container-fluid p-0 d-flex vh-100 overflow-hidden bg-light">
            {/* Sidebar */}
            <aside className="d-none d-lg-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm" style={{ width: '280px' }}>
                <Link to="/" className="d-flex flex-column mb-3 text-decoration-none">
                    <span className="fs-3 fw-bold text-primary font-outfit lh-1">LGU FYP</span>
                    <span className="fs-6 fw-bold text-muted font-outfit">PORTAL</span>
                </Link>
                <div className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill py-2 px-3 mt-2 mb-4 d-inline-block text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05rem', width: 'fit-content' }}>
                    {user?.role?.replace('_', ' ')}
                </div>

                <hr className="text-muted opacity-25" />

                <ul className="nav nav-pills flex-column mb-auto gap-1">
                    {getNavItems().map((item) => (
                        <li key={item.to} className="nav-item">
                            <Link
                                to={item.to}
                                className={`nav-link d-flex align-items-center py-2 px-3 rounded-3 text-secondary ${window.location.pathname === item.to ? 'active shadow-sm text-white' : 'hover-bg-light text-secondary'}`}
                            >
                                <span className="me-3 fs-5">{item.icon}</span>
                                <span className="fw-medium">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <hr className="text-muted opacity-25" />

                <button
                    onClick={handleLogout}
                    className="btn btn-light d-flex align-items-center justify-content-center py-2 rounded-3 border-0 text-danger fw-600 hover-bg-danger-subtle"
                >
                    <HiOutlineLogout className="me-2" size={20} />
                    <span>Sign Out</span>
                </button>
            </aside>

            {/* Main Content */}
            <div className="d-flex flex-column flex-grow-1 overflow-auto">
                {/* Navbar / Header */}
                <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 shadow-sm">
                    <div className="container-fluid p-0">
                        <h4 className="m-0 fw-bold font-outfit">{title || 'Dashboard'}</h4>

                        <div className="ms-auto d-flex align-items-center gap-3">
                            <div className="text-end d-none d-md-block">
                                <p className="m-0 small fw-bold">{user?.firstName} {user?.lastName}</p>
                                <p className="m-0 x-small text-muted" style={{ fontSize: '0.75rem' }}>{user?.email}</p>
                            </div>
                            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                                {user?.firstName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <main className="p-4 p-md-5">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
