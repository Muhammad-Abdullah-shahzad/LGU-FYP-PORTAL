import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import {
    HiOutlineUserGroup,
    HiOutlinePlus,
    HiOutlineAcademicCap,
    HiOutlineTrash,
    HiOutlineStar,
    HiOutlineDownload,
    HiOutlineX,
    HiOutlineCheckCircle,
    HiOutlineUser
} from 'react-icons/hi';
import './CoordinatorPanels.css';

const CoordinatorPanels = () => {
    const [panels, setPanels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState(null);
    const [submitting, setSubmitting] = useState(false);

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
            const facultyMembers = usersRes.data.users?.filter(u => u.role === 'supervisor') || [];
            setUsers(facultyMembers);
            setGroups(groupsRes.data.groups || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePanel = async (e) => {
        e.preventDefault();
        if (formData.members.length < 1) return alert('At least 1 member required');
        if (!formData.chairperson) return alert('Select a chairperson');

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

    const handleAssignGroup = async (e) => {
        e.preventDefault();
        if (!assignmentData.groupId) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/panels/${selectedPanel._id}/assign-group`, {
                groupId: assignmentData.groupId
            });
            setPanels(panels.map(p => p._id === selectedPanel._id ? res.data.panel : p));
            setShowAssignModal(false);
            setAssignmentData({ groupId: '' });
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
        if (formData.chairperson === userId && !newMembers.includes(userId)) {
            setFormData(prev => ({ ...prev, members: newMembers, chairperson: '' }));
        }
    };

    const getAvailableGroups = (panelType) => {
        return groups.filter(g => {
            if (panelType === 'proposal') return !g.proposalPanel;
            if (panelType === 'internal') return !g.internalPanel;
            if (panelType === 'srs') return !g.srsPanel;
            if (panelType === 'external') return !g.externalPanel;
            return false;
        });
    };

    const handleDeletePanel = async (id) => {
        if (!window.confirm('Delete this panel permanentely?')) return;
        try {
            await api.delete(`/panels/${id}`);
            setPanels(panels.filter(p => p._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete panel');
        }
    };

    const exportToCSV = (panel) => {
        if (!panel.assignedGroups?.length) return alert('No groups assigned.');
        const headers = ['Group', 'Project Title', 'Domain', 'Supervisor'];
        const rows = panel.assignedGroups.map(g => [
            g.groupName,
            g.projectTitle,
            g.projectDomain,
            g.supervisor ? `${g.supervisor.firstName} ${g.supervisor.lastName}` : 'N/A'
        ]);
        let csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csv);
        link.download = `${panel.panelName}.csv`;
        link.click();
    };

    return (
        <DashboardLayout title="Board of Examiners">
            <div className="panels-container">
                <div className="header-minimal">
                    <div>
                        <h5 className="fw-bold text-dark mb-1">Defense Committees</h5>
                        <p className="text-muted small mb-0">Assemble evaluation panels and distribute group rosters.</p>
                    </div>
                    <button className="btn-assemble-minimal d-flex align-items-center gap-2" onClick={() => setShowCreateModal(true)}>
                        <HiOutlinePlus size={18} /> ASSEMBLE PANEL
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary spinner-border-sm"></div></div>
                ) : panels.length === 0 ? (
                    <div className="text-center py-5 bg-white border rounded-3 shadow-sm mt-4">
                        <HiOutlineAcademicCap size={48} className="text-muted opacity-20 mb-3" />
                        <h6 className="fw-bold text-dark">No Active Panels</h6>
                        <p className="text-muted small">Establish your first defense committee to begin evaluations.</p>
                    </div>
                ) : (
                    <div className="row g-4 mt-1">
                        {panels.map(panel => (
                            <div key={panel._id} className="col-md-6 col-lg-4">
                                <div className="panel-card-minimal shadow-sm">
                                    <div className="panel-card-header">
                                        <div>
                                            <h6 className="panel-title-minimal">{panel.panelName}</h6>
                                            <div className="panel-subtitle-minimal">{panel.academicYear} • SEMESTER {panel.semester}</div>
                                        </div>
                                        <span className={`panel-type-badge type-${panel.panelType}`}>
                                            {panel.panelType}
                                        </span>
                                    </div>

                                    <div className="panel-card-body">
                                        <label className="modal-label-minimal">Committee Members</label>
                                        <div className="member-grid-minimal">
                                            {panel.members.map(member => (
                                                <div key={member._id} className="member-chip-minimal" title={member._id === panel.chairperson._id ? 'Panel Chairperson' : ''}>
                                                    {member._id === panel.chairperson._id && <HiOutlineStar className="chair-icon-gold" size={12} />}
                                                    {member.firstName} {member.lastName}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="stats-bar-minimal">
                                            <span className="stats-label">Groups Assigned</span>
                                            <span className="stats-value">{panel.assignedGroups?.length || 0}</span>
                                        </div>
                                    </div>

                                    <div className="panel-card-footer">
                                        <button className="btn-card-action" onClick={() => { setSelectedPanel(panel); setShowAssignModal(true); }}>
                                            Assign Group
                                        </button>
                                        <button className="btn-icon-circle" title="Export CSV" onClick={() => exportToCSV(panel)}>
                                            <HiOutlineDownload size={14} />
                                        </button>
                                        <button className="btn-icon-circle delete" title="Delete Committee" onClick={() => handleDeletePanel(panel._id)}>
                                            <HiOutlineTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Panel Modal */}
            {showCreateModal && (
                <div className="modal-minimal-overlay">
                    <div className="modal-content-minimal">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0">Establish Defense Panel</h5>
                            <button className="btn p-0 text-muted" onClick={() => setShowCreateModal(false)}><HiOutlineX size={20} /></button>
                        </div>
                        <form onSubmit={handleCreatePanel}>
                            <div className="row g-2">
                                <div className="col-12">
                                    <label className="modal-label-minimal">Defense Category</label>
                                    <select className="input-minimal" value={formData.panelType} onChange={(e) => setFormData({ ...formData, panelType: e.target.value })}>
                                        <option value="proposal">Proposal Defense</option>
                                        <option value="internal">Internal Defense</option>
                                        <option value="srs">SRS Defense</option>
                                        <option value="external">External Defense</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="modal-label-minimal">Session</label>
                                    <input type="number" className="input-minimal" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} />
                                </div>
                                <div className="col-6">
                                    <label className="modal-label-minimal">Semester</label>
                                    <select className="input-minimal" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}>
                                        <option value={7}>Semester 7</option>
                                        <option value={8}>Semester 8</option>
                                    </select>
                                </div>
                            </div>

                            <label className="modal-label-minimal mb-3 mt-2">Select Faculty Members</label>
                            <div className="mb-4 overflow-auto px-1" style={{ maxHeight: '200px' }}>
                                {users.map(user => (
                                    <div key={user._id} className={`member-select-item ${formData.members.includes(user._id) ? 'selected' : ''}`} onClick={() => toggleMemberSelection(user._id)}>
                                        <HiOutlineUser className="text-muted me-3" size={16} />
                                        <div className="flex-grow-1">
                                            <div className="fw-bold small">{user.firstName} {user.lastName}</div>
                                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>{user.domain?.[0] || 'Faculty'}</div>
                                        </div>
                                        {formData.members.includes(user._id) && <HiOutlineCheckCircle className="text-primary" size={18} />}
                                    </div>
                                ))}
                            </div>

                            {formData.members.length > 0 && (
                                <div className="mb-4 text-center">
                                    <label className="modal-label-minimal mb-2">Designate Chairperson</label>
                                    <div className="chair-selector">
                                        {users.filter(u => formData.members.includes(u._id)).map(u => (
                                            <button key={u._id} type="button" className={`btn btn-sm rounded-pill px-3 transition-all ${formData.chairperson === u._id ? 'btn-warning text-dark border-0' : 'btn-light border'} fw-bold`} style={{ fontSize: '0.65rem' }} onClick={() => setFormData({ ...formData, chairperson: u._id })}>
                                                {formData.chairperson === u._id && <HiOutlineStar className="me-1" />} {u.firstName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="d-flex gap-2 justify-content-end mt-4">
                                <button type="button" className="btn btn-light rounded-pill px-4 fw-bold small" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-assemble-minimal px-4" disabled={submitting || formData.members.length < 1 || !formData.chairperson}>
                                    {submitting ? 'Creating...' : 'Establish Committee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Group Modal */}
            {showAssignModal && (
                <div className="modal-minimal-overlay">
                    <div className="modal-content-minimal" style={{ maxWidth: '500px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0">Assign Group</h5>
                            <button className="btn p-0 text-muted" onClick={() => setShowAssignModal(false)}><HiOutlineX size={20} /></button>
                        </div>
                        <form onSubmit={handleAssignGroup}>
                            <p className="text-muted small">Routing a group to <strong>{selectedPanel.panelName}</strong> committee for {selectedPanel.panelType} verification.</p>
                            <label className="modal-label-minimal">Select Eligible Group</label>
                            <select className="input-minimal" value={assignmentData.groupId} onChange={(e) => setAssignmentData({ groupId: e.target.value })} required>
                                <option value="">Select available FYP group...</option>
                                {getAvailableGroups(selectedPanel.panelType).map(group => (
                                    <option key={group._id} value={group._id}>{group.groupName} - {group.projectTitle}</option>
                                ))}
                            </select>

                            {getAvailableGroups(selectedPanel.panelType).length === 0 && (
                                <div className="p-3 bg-light rounded text-center mb-3">
                                    <span className="text-muted small italic">No unassigned groups found for this defense phase.</span>
                                </div>
                            )}

                            <div className="d-flex gap-2 justify-content-end mt-4">
                                <button type="button" className="btn btn-light rounded-pill px-4 fw-bold small" onClick={() => setShowAssignModal(false)}>Cancel</button>
                                <button type="submit" className="btn-assemble-minimal px-4" disabled={submitting || !assignmentData.groupId}>
                                    {submitting ? 'Assigning...' : 'Assign Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CoordinatorPanels;
