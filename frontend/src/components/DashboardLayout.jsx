import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
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
                    { to: '/student/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
                    { to: '/student/group', label: 'My Group', icon: <HiOutlineUserGroup /> },
                    { to: '/student/proposal', label: 'Proposal', icon: <HiOutlineDocumentText /> },
                    { to: '/student/defense', label: 'Defense', icon: <HiOutlineAcademicCap /> },
                ];
            case 'supervisor':
                return [
                    { to: '/supervisor/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
                    { to: '/supervisor/requests', label: 'Requests', icon: <HiOutlineMail /> },
                    { to: '/supervisor/groups', label: 'My Groups', icon: <HiOutlineUserGroup /> },
                    { to: '/supervisor/evaluations', label: 'Evaluations', icon: <HiOutlineClipboardList /> },
                ];
            case 'panel_member':
                return [
                    { to: '/panel/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
                    { to: '/supervisor/evaluations', label: 'Evaluations', icon: <HiOutlineClipboardList /> },
                ];
            case 'coordinator':
                return [
                    { to: '/coordinator/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
                    { to: '/coordinator/users', label: 'Users', icon: <HiOutlineUsers /> },
                    { to: '/coordinator/groups', label: 'Groups', icon: <HiOutlineUserGroup /> },
                    { to: '/coordinator/panels', label: 'Panels', icon: <HiOutlineShieldCheck /> },
                    { to: '/coordinator/timeline', label: 'Timeline', icon: <HiOutlineCalendar /> },
                ];
            default:
                return [];
        }
    };

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="sidebar-container d-none d-lg-flex p-3">
                <Link to="/" className="d-flex flex-column mb-3 text-decoration-none px-2">
                    <span className="fs-4 fw-bold text-dark font-outfit lh-1">LGU FYP</span>
                    <span className="fs-8 fw-bold text-muted font-outfit mt-1">MANAGEMENT PORTAL</span>
                </Link>

                <div className="badge bg-light text-dark border rounded-pill py-2 px-3 mt-2 mb-4 d-inline-block text-uppercase mx-2" style={{ fontSize: '0.6rem', letterSpacing: '0.05rem', width: 'fit-content' }}>
                    {user?.role?.replace('_', ' ')}
                </div>

                <ul className="nav nav-pills flex-column mb-auto gap-1 px-1">
                    {getNavItems().map((item) => (
                        <li key={item.to} className="nav-item">
                            <Link
                                to={item.to}
                                className={`nav-link d-flex align-items-center py-2 px-3 rounded-2 ${location.pathname === item.to ? 'active shadow-sm text-white' : 'text-secondary'}`}
                            >
                                <span className="me-3" style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                <span className="fw-medium" style={{ fontSize: '0.85rem' }}>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="px-2 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="btn btn-light d-flex align-items-center justify-content-center w-100 py-2 rounded-2 border-0 text-danger fw-600 hover-bg-danger-subtle"
                        style={{ fontSize: '0.85rem' }}
                    >
                        <HiOutlineLogout className="me-2" size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="content-area">
                {/* Fixed Top Header */}
                <header className="content-header">
                    <div className="d-flex align-items-center justify-content-between">
                        <h5 className="m-0 fw-bold font-outfit text-dark">{title || 'Portal'}</h5>

                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end d-none d-md-block">
                                <p className="m-0 small fw-bold text-dark">{user?.firstName} {user?.lastName}</p>
                                <p className="m-0 text-muted" style={{ fontSize: '0.65rem' }}>{user?.email}</p>
                            </div>
                            <div className="avatar bg-light border text-dark rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '1rem', fontWeight: '700' }}>
                                {user?.firstName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
