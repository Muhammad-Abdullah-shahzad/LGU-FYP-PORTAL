import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentGroup from './pages/student/StudentGroup';
import StudentProposal from './pages/student/StudentProposal';
import SupervisorRequests from './pages/supervisor/SupervisorRequests';
import SupervisorGroups from './pages/supervisor/SupervisorGroups';
import GroupDetails from './pages/supervisor/GroupDetails';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CoordinatorUsers from './pages/coordinator/CoordinatorUsers';
import CoordinatorGroups from './pages/coordinator/CoordinatorGroups';
import CoordinatorTimeline from './pages/coordinator/CoordinatorTimeline';
import CoordinatorPanels from './pages/coordinator/CoordinatorPanels';
import PanelDashboard from './pages/panel/PanelDashboard';
import PanelGroups from './pages/panel/PanelGroups';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import SupervisorEvaluations from './pages/supervisor/SupervisorEvaluations';
import './App.css';


const Unauthorized = () => (
  <div className="container min-vh-100 d-flex align-items-center justify-content-center">
    <div className="card border-0 shadow-lg rounded-4 p-5 text-center" style={{ maxWidth: '500px' }}>
      <div className="fs-1 mb-3">⛔</div>
      <h2 className="fw-bold font-outfit text-danger">Access Denied</h2>
      <p className="text-muted">You do not have the required permissions to view this section of the system.</p>
      <button className="btn btn-primary rounded-pill px-4 mt-3 fw-bold" onClick={() => window.location.href = '/'}>
        Go to Home
      </button>
    </div>
  </div>
);

const Home = () => {
  const { user } = useAuth();

  if (user) {
    // Redirect based on role
    switch (user.role) {
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      case 'supervisor':
        return <Navigate to="/supervisor/dashboard" replace />;
      case 'panel_member':
        return <Navigate to="/panel/dashboard" replace />;
      case 'coordinator':
        return <Navigate to="/coordinator/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Navigate to="/login" replace />;
};



function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/group"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentGroup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/proposal"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProposal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/defense"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/requests"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/groups"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorGroups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/groups/:id"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <GroupDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/evaluations"
            element={
              <ProtectedRoute allowedRoles={['supervisor', 'panel_member']}>
                <SupervisorEvaluations />
              </ProtectedRoute>
            }
          />

          {/* Panel Member Routes */}
          <Route
            path="/panel/dashboard"
            element={
              <ProtectedRoute allowedRoles={['panel_member']}>
                <PanelDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/panel/:panelId/groups"
            element={
              <ProtectedRoute allowedRoles={['panel_member']}>
                <PanelGroups />
              </ProtectedRoute>
            }
          />

          {/* Coordinator Routes */}
          <Route
            path="/coordinator/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/users"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/groups"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorGroups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/timeline"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorTimeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/panels"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorPanels />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
