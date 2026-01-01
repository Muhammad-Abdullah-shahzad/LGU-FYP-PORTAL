import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import {
    HiOutlineUserGroup,
    HiOutlinePlus,
    HiOutlineAcademicCap,
    HiOutlineSearch,
    HiOutlineFilter,
    HiOutlineTrash,
    HiOutlineEye,
    HiOutlineCheckCircle,
    HiOutlineUser,
    HiOutlineStar
} from 'react-icons/hi';
import './CoordinatorPanels.css';

const CoordinatorPanels = () => {
    const [panels, setPanels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]); // Supervisors and Panel Members
    const [groups, setGroups] = useState([]); // For assignment

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        panelType: 'proposal',
        members: [],
        chairperson: '',
        academicYear: new Date().getFullYear().toString(),
        semester: 7
    });

    const [assignmentData, setAssignmentData] = useState({
        groupId: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [panelsRes, usersRes, groupsRes] = await Promise.all([
                api.get('/panels'),
                api.get('/users'),
                api.get('/groups')
            ]);

            setPanels(panelsRes.data.panels || []);

            // Filter users to only include supervisors and panel members
            const facultyMembers = usersRes.data.users?.filter(u =>
                u.role === 'supervisor' || u.role === 'panel_member'
            ) || [];
            setUsers(facultyMembers);

            setGroups(groupsRes.data.groups || []);
        } catch (err) {
            console.error('Error fetching coordinator panels data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePanel = async (e) => {
        e.preventDefault();
        if (formData.members.length < 1) {
            alert('Panel must have at least 1 member');
            return;
        }
        if (!formData.chairperson) {
            alert('Please select a chairperson');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/panels', formData);
            setPanels([res.data.panel, ...panels]);
            setShowCreateModal(false);
            setFormData({
                panelType: 'proposal',
                members: [],
                chairperson: '',
                academicYear: new Date().getFullYear().toString(),
                semester: 7
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create panel');
        } finally {
            setSubmitting(false);
        }
    };



    const exportToCSV = (panel) => {
        if (!panel.assignedGroups || panel.assignedGroups.length === 0) {
            alert('No groups assigned to this panel yet.');
            return;
        }

        const headers = ['Group Registration', 'Project Title', 'Domain', 'Student 1', 'Student 2', 'Supervisor'];
        const rows = panel.assignedGroups.map(g => [
            g.groupName,
            g.projectTitle,
            g.projectDomain,
            g.student1 ? `${g.student1.firstName} ${g.student1.lastName}` : 'N/A',
            g.student2 ? `${g.student2.firstName} ${g.student2.lastName}` : 'N/A',
            g.supervisor ? `${g.supervisor.firstName} ${g.supervisor.lastName}` : 'Not Assigned'
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${panel.panelName}_Groups.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAssignGroup = async (e) => {
        e.preventDefault();
        if (!assignmentData.groupId) return;

        setSubmitting(true);
        try {
            const res = await api.post(`/panels/${selectedPanel._id}/assign-group`, {
                groupId: assignmentData.groupId
            });

            // Update local state
            setPanels(panels.map(p => p._id === selectedPanel._id ? res.data.panel : p));
            setShowAssignModal(false);
            setAssignmentData({ groupId: '' });
            alert('Group assigned successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to assign group');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleMemberSelection = (userId) => {
        const newMembers = formData.members.includes(userId)
            ? formData.members.filter(id => id !== userId)
            : [...formData.members, userId];

        setFormData({ ...formData, members: newMembers });

        // If removed member was chairperson, reset chairperson
        if (formData.chairperson === userId && !newMembers.includes(userId)) {
            setFormData(prev => ({ ...prev, members: newMembers, chairperson: '' }));
        }
    };

    const getAvailableGroups = (panelType) => {
        // Filter groups that don't have a panel of this type yet
        return groups.filter(g => {
            if (panelType === 'proposal') return !g.proposalPanel;
            if (panelType === 'internal') return !g.internalPanel;
            if (panelType === 'srs') return !g.srsPanel;
            if (panelType === 'external') return !g.externalPanel;
            return false;
        });
    };

    return (
        <DashboardLayout title="Defense Panel Management">
            <div className="container-fluid p-0 panels-container">
                <div className="d-flex justify-content-between align-items-center mb-4 text-white p-4 welcome-banner rounded-4 shadow">
                    <div>
                        <h4 className="fw-bold font-outfit mb-1">System Defense Panels</h4>
                        <p className="opacity-75 small mb-0">Manage evaluation committees and group assignments</p>
                    </div>
                    <button
                        className="btn btn-dark rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <HiOutlinePlus className="me-2" size={20} />
                        Assemble Panel
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : panels.length === 0 ? (
                    <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                        <div className="bg-light rounded-circle p-4 d-inline-block mb-4 mx-auto">
                            <HiOutlineAcademicCap size={48} className="text-muted" />
                        </div>
                        <h4 className="fw-bold font-outfit">No Panels Created</h4>
                        <p className="text-muted mb-4">You haven't set up any defense panels for this semester yet.</p>
                        <button className="btn btn-outline-primary rounded-pill px-4" onClick={() => setShowCreateModal(true)}>
                            Get Started
                        </button>
                    </div>
                ) : (
                    <div className="row g-4">
                        {panels.map(panel => (
                            <div key={panel._id} className="col-md-6 col-lg-4">
                                <div className="card panel-card border-0 shadow-sm rounded-4 h-100 position-relative">
                                    <span className={`badge type-badge rounded-pill text-uppercase ${panel.panelType === 'proposal' ? 'bg-primary-subtle text-primary' :
                                        panel.panelType === 'internal' ? 'bg-info-subtle text-info' :
                                            panel.panelType === 'srs' ? 'bg-warning-subtle text-warning' :
                                                'bg-success-subtle text-success'
                                        } border px-3 py-2`}>
                                        {panel.panelType}
                                    </span>

                                    <div className="card-body p-4">
                                        <h5 className="fw-bold font-outfit text-dark mb-1">{panel.panelName}</h5>
                                        <p className="small text-muted mb-4">
                                            {panel.academicYear} • Semester {panel.semester}
                                        </p>

                                        <div className="mb-4">
                                            <label className="x-small text-uppercase fw-bold text-muted mb-2 d-block">Panel Members</label>
                                            <div className="d-flex flex-wrap gap-1">
                                                {panel.members.map(member => (
                                                    <span key={member._id} className="member-chip border">
                                                        {member._id === panel.chairperson._id && <HiOutlineStar className="chair-star" size={12} />}
                                                        {member.firstName} {member.lastName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-light rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between">
                                            <div>
                                                <h6 className="mb-0 fw-bold">{panel.assignedGroups?.length || 0}</h6>
                                                <span className="x-small text-muted">Assigned Groups</span>
                                            </div>
                                            <HiOutlineUserGroup className="text-primary opacity-50" size={24} />
                                        </div>

                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-primary flex-grow-1 rounded-pill btn-sm fw-bold"
                                                onClick={() => {
                                                    setSelectedPanel(panel);
                                                    setShowAssignModal(true);
                                                }}
                                            >
                                                Assign Group
                                            </button>
                                            <button
                                                className="btn btn-outline-success rounded-circle p-2 shadow-sm"
                                                title="Export into CSV"
                                                onClick={() => exportToCSV(panel)}
                                            >
                                                <HiOutlinePlus size={18} style={{ transform: 'rotate(45deg)' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Panel Modal */}
            {showCreateModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 rounded-4 shadow-lg">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold font-outfit">Assemble New Defense Panel</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <form onSubmit={handleCreatePanel}>
                                <div className="modal-body p-4">
                                    <div className="row g-4 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Panel Type</label>
                                            <select
                                                className="form-select rounded-3 p-2 bg-light border-0"
                                                value={formData.panelType}
                                                onChange={(e) => setFormData({ ...formData, panelType: e.target.value })}
                                            >
                                                <option value="proposal">Proposal Defense</option>
                                                <option value="internal">Internal Defense</option>
                                                <option value="srs">SRS Defense</option>
                                                <option value="external">External Defense</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small fw-bold">Academic Year</label>
                                            <input
                                                type="number"
                                                className="form-control rounded-3 p-2 bg-light border-0"
                                                value={formData.academicYear}
                                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small fw-bold">Semester</label>
                                            <select
                                                className="form-select rounded-3 p-2 bg-light border-0"
                                                value={formData.semester}
                                                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                            >
                                                <option value={7}>Semester 7</option>
                                                <option value={8}>Semester 8</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label small fw-bold d-block mb-3">Select Members (N number of members allowed)</label>
                                        <div className="row g-2 overflow-auto" style={{ maxHeight: '250px' }}>
                                            {users.map(user => (
                                                <div key={user._id} className="col-md-6">
                                                    <div
                                                        className={`p-3 rounded-4 border group-select-item ${formData.members.includes(user._id) ? 'selected' : ''}`}
                                                        onClick={() => toggleMemberSelection(user._id)}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div className={`rounded-circle p-2 me-3 ${formData.members.includes(user._id) ? 'bg-primary text-white' : 'bg-light text-muted'}`}>
                                                                <HiOutlineUser size={18} />
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0 fw-bold small">{user.firstName} {user.lastName}</h6>
                                                                <span className="x-small text-muted">{user.designation || user.role}</span>
                                                            </div>
                                                            {formData.members.includes(user._id) && (
                                                                <HiOutlineCheckCircle className="ms-auto text-primary" size={20} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.members.length > 0 && (
                                        <div className="p-3 bg-light rounded-4 mb-3 border border-dashed text-center">
                                            <label className="form-label x-small fw-bold text-uppercase d-block mb-2">Assign Chairperson</label>
                                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                                {users.filter(u => formData.members.includes(u._id)).map(u => (
                                                    <button
                                                        key={u._id}
                                                        type="button"
                                                        className={`btn btn-sm rounded-pill px-3 transition-all ${formData.chairperson === u._id ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                                                        onClick={() => setFormData({ ...formData, chairperson: u._id })}
                                                    >
                                                        {formData.chairperson === u._id && <HiOutlineStar className="me-1" size={14} />}
                                                        {u.firstName} {u.lastName}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary rounded-pill px-4"
                                        disabled={submitting || formData.members.length < 1 || !formData.chairperson}
                                    >
                                        {submitting ? 'Creating...' : 'Create Panel'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Group Modal */}
            {showAssignModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 shadow-lg">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold font-outfit">Assign Group to {selectedPanel.panelName}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
                            </div>
                            <form onSubmit={handleAssignGroup}>
                                <div className="modal-body p-4 text-center">
                                    <p className="text-muted small">Select a group that is eligible for {selectedPanel.panelType} defense.</p>
                                    <select
                                        className="form-select rounded-3 p-3 bg-light border-0 mb-3"
                                        value={assignmentData.groupId}
                                        onChange={(e) => setAssignmentData({ groupId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select an available group...</option>
                                        {getAvailableGroups(selectedPanel.panelType).map(group => (
                                            <option key={group._id} value={group._id}>
                                                {group.groupName} - {group.projectTitle}
                                            </option>
                                        ))}
                                    </select>

                                    {getAvailableGroups(selectedPanel.panelType).length === 0 && (
                                        <div className="alert alert-warning py-2 small">
                                            No eligible groups found for this defense type.
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowAssignModal(false)}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary rounded-pill px-4"
                                        disabled={submitting || !assignmentData.groupId}
                                    >
                                        {submitting ? 'Assigning...' : 'Assign Group'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CoordinatorPanels;
