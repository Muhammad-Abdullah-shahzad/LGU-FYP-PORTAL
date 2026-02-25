import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import './CoordinatorUsers.css';
import {
    HiOutlineTrash,
    HiOutlineBan,
    HiOutlineCheckCircle,
    HiOutlinePlus,
    HiOutlineX,
    HiOutlineCloudUpload,
    HiOutlineArrowRight,
    HiOutlineDocumentText,
    HiOutlineExclamationCircle
} from 'react-icons/hi';

// App fields students/coordinator can map to
const APP_FIELDS = [
    { key: 'fullName', label: 'Full Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'designation', label: 'Designation', required: false },
    { key: 'phoneNumber', label: 'Phone Number', required: false },
    { key: 'officeAddress', label: 'Office Address', required: false },
    { key: 'domain', label: 'Domain', required: false },
    { key: 'areaOfExpertise', label: 'Area of Expertise', required: false },
    { key: 'preferredProjectNature', label: 'Preferred Project Nature', required: false },
    { key: 'specificTools', label: 'Specific Tools', required: false },
    { key: 'interestedProjectTypes', label: 'Project Types', required: false },
];

const CoordinatorUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState({ role: 'supervisor', domain: '' });
    const [showModal, setShowModal] = useState(false);

    // Column mapping state
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [excelColumns, setExcelColumns] = useState([]); // headers from file
    const [excelPreview, setExcelPreview] = useState([]); // first 2 rows for preview
    const [columnMapping, setColumnMapping] = useState({}); // { appField: excelColumn }
    const [pendingFile, setPendingFile] = useState(null);
    const [importResult, setImportResult] = useState(null);

    const fileInputRef = useRef(null);

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

    // Step 1: File selected — parse headers locally
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPendingFile(file);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (!rows || rows.length === 0) {
                alert('The Excel file appears to be empty.');
                return;
            }

            const headers = rows[0].map(h => String(h).trim()).filter(Boolean);
            setExcelColumns(headers);

            // Store first 2 data rows for preview
            setExcelPreview(rows.slice(1, 3));

            // Auto-map based on similarity
            const autoMap = {};
            APP_FIELDS.forEach(appField => {
                const match = headers.find(h => {
                    const hl = h.toLowerCase();
                    const fl = appField.label.toLowerCase();
                    return hl === fl || hl.includes(fl) || fl.includes(hl) ||
                        (appField.key === 'fullName' && (hl.includes('name') || hl.includes('full'))) ||
                        (appField.key === 'email' && hl.includes('email')) ||
                        (appField.key === 'phoneNumber' && (hl.includes('phone') || hl.includes('ph '))) ||
                        (appField.key === 'officeAddress' && hl.includes('office')) ||
                        (appField.key === 'domain' && hl.includes('domain')) ||
                        (appField.key === 'areaOfExpertise' && (hl.includes('expertise') || hl.includes('interest') || hl.includes('specializ'))) ||
                        (appField.key === 'designation' && hl.includes('designation'));
                });
                if (match) autoMap[appField.key] = match;
            });
            setColumnMapping(autoMap);
            setShowMappingModal(true);
        };
        reader.readAsBinaryString(file);
        // reset file input so same file can be re-selected
        e.target.value = null;
    };

    // Step 2: User confirms mapping → send file + mapping to backend
    const handleConfirmImport = async () => {
        // Validate required fields are mapped
        const requiredFields = APP_FIELDS.filter(f => f.required);
        for (const field of requiredFields) {
            if (!columnMapping[field.key]) {
                alert(`Please map the required field: "${field.label}"`);
                return;
            }
        }

        const fd = new FormData();
        fd.append('file', pendingFile);
        fd.append('mapping', JSON.stringify(columnMapping));

        try {
            setUploading(true);
            const res = await api.post('/users/upload-supervisors', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportResult(res.data);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const closeMappingModal = () => {
        setShowMappingModal(false);
        setPendingFile(null);
        setExcelColumns([]);
        setExcelPreview([]);
        setColumnMapping({});
        setImportResult(null);
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
                    <div className="d-flex gap-2 align-items-center">
                        <select
                            className="filter-select-minimal"
                            value={filter.domain}
                            onChange={(e) => setFilter({ ...filter, domain: e.target.value })}
                        >
                            <option value="">All Specializations</option>
                            {specialities.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept=".xlsx, .xls"
                            onChange={handleFileSelect}
                        />
                        <label
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-upload-minimal d-flex align-items-center gap-2"
                            style={{ cursor: 'pointer', margin: 0 }}
                        >
                            <HiOutlineCloudUpload size={16} />
                            <span>Bulk Import</span>
                        </label>

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
                                    <td style={{ maxWidth: '220px' }}>
                                        {(() => {
                                            if (user.domain && user.domain.length > 0) {
                                                const domainText = Array.isArray(user.domain) ? user.domain.join(', ') : user.domain;
                                                return <span className="domain-pill-outline">{domainText}</span>;
                                            }
                                            if (user.areaOfExpertise) {
                                                const truncated = user.areaOfExpertise.length > 60
                                                    ? user.areaOfExpertise.slice(0, 60) + '…'
                                                    : user.areaOfExpertise;
                                                return (
                                                    <span className="text-muted" style={{ fontSize: '0.7rem', fontStyle: 'italic' }} title={user.areaOfExpertise}>
                                                        {truncated}
                                                    </span>
                                                );
                                            }
                                            return <span className="text-muted" style={{ fontSize: '0.7rem' }}>—</span>;
                                        })()}
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

                {/* ── Column Mapping Modal ── (Portal: renders at body level) */}
                {showMappingModal && createPortal(
                    <div className="modal-overlay" style={{ zIndex: 1060 }}>
                        <div className="modal-minimal" style={{ maxWidth: '720px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header-minimal">
                                <div>
                                    <h3>Map Excel Columns</h3>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                                        <HiOutlineDocumentText className="me-1" />
                                        {pendingFile?.name} &nbsp;·&nbsp; {excelColumns.length} columns detected
                                    </p>
                                </div>
                                <button className="btn btn-link link-secondary p-0" onClick={closeMappingModal}>
                                    <HiOutlineX size={20} />
                                </button>
                            </div>

                            {!importResult ? (
                                <>
                                    {/* Mapping table */}
                                    <div className="mb-3 mt-3">
                                        <div className="d-flex align-items-center justify-content-between mb-2" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            <span style={{ flex: 1 }}>Excel Column (from your file)</span>
                                            <span style={{ width: '30px' }}></span>
                                            <span style={{ flex: 1 }}>App Field</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {excelColumns.map((col, idx) => {
                                                // What app field is this column currently mapped to?
                                                const mappedTo = Object.keys(columnMapping).find(k => columnMapping[k] === col);
                                                const preview = excelPreview.map(row => row[idx]).filter(v => v != null && v !== '');

                                                return (
                                                    <div key={col} style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        background: mappedTo ? '#f0fdf4' : '#f8fafc',
                                                        border: `1px solid ${mappedTo ? '#86efac' : '#e2e8f0'}`,
                                                        borderRadius: '8px', padding: '10px 12px',
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        {/* Left: Excel column name + preview */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div className="fw-bold" style={{ fontSize: '0.8rem', color: '#1e293b' }}>{col}</div>
                                                            {preview.length > 0 && (
                                                                <div className="text-muted" style={{ fontSize: '0.65rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    e.g. {preview.join(' · ')}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Arrow */}
                                                        <HiOutlineArrowRight size={14} className="text-muted flex-shrink-0" />

                                                        {/* Right: App field dropdown */}
                                                        <div style={{ flex: 1 }}>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                style={{ fontSize: '0.78rem', borderColor: mappedTo ? '#86efac' : '#e2e8f0' }}
                                                                value={mappedTo || ''}
                                                                onChange={(e) => {
                                                                    const newMap = { ...columnMapping };
                                                                    // Remove old mapping for this excel col
                                                                    Object.keys(newMap).forEach(k => {
                                                                        if (newMap[k] === col) delete newMap[k];
                                                                    });
                                                                    // Set new mapping if not "ignore"
                                                                    if (e.target.value) {
                                                                        newMap[e.target.value] = col;
                                                                    }
                                                                    setColumnMapping(newMap);
                                                                }}
                                                            >
                                                                <option value="">— Ignore this column —</option>
                                                                {APP_FIELDS.map(f => (
                                                                    <option key={f.key} value={f.key}>
                                                                        {f.label}{f.required ? ' *' : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Required fields warning */}
                                    {APP_FIELDS.filter(f => f.required && !columnMapping[f.key]).length > 0 && (
                                        <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded-3" style={{ background: '#fef9c3', border: '1px solid #fde047', fontSize: '0.72rem' }}>
                                            <HiOutlineExclamationCircle className="text-warning flex-shrink-0" />
                                            <span>Required fields not yet mapped: <strong>{APP_FIELDS.filter(f => f.required && !columnMapping[f.key]).map(f => f.label).join(', ')}</strong></span>
                                        </div>
                                    )}

                                    <div className="modal-footer-minimal mt-3">
                                        <button type="button" className="btn btn-light btn-sm px-3 fw-bold" onClick={closeMappingModal}>Cancel</button>
                                        <button
                                            type="button"
                                            className="btn-add-minimal d-flex align-items-center gap-2"
                                            onClick={handleConfirmImport}
                                            disabled={uploading || APP_FIELDS.filter(f => f.required && !columnMapping[f.key]).length > 0}
                                        >
                                            {uploading ? (
                                                <><div className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px' }}></div> <span>Importing...</span></>
                                            ) : (
                                                <><HiOutlineCloudUpload size={15} /> <span>Confirm & Import</span></>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* Result screen */
                                <div className="text-center py-4">
                                    <div className="mb-3">
                                        <HiOutlineCheckCircle size={48} className="text-success" />
                                    </div>
                                    <h5 className="fw-bold text-dark mb-1">Import Complete</h5>
                                    <p className="text-muted small mb-4">{importResult.message}</p>

                                    <div className="d-flex justify-content-center gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="fw-bold text-success" style={{ fontSize: '2rem' }}>{importResult.stats?.created ?? 0}</div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>CREATED</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="fw-bold text-warning" style={{ fontSize: '2rem' }}>{importResult.stats?.skipped ?? 0}</div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>SKIPPED</div>
                                        </div>
                                        {importResult.stats?.errors?.length > 0 && (
                                            <div className="text-center">
                                                <div className="fw-bold text-danger" style={{ fontSize: '2rem' }}>{importResult.stats.errors.length}</div>
                                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>ERRORS</div>
                                            </div>
                                        )}
                                    </div>

                                    <button className="btn-add-minimal" onClick={closeMappingModal}>Done</button>
                                </div>
                            )}
                        </div>
                    </div>
                    , document.body)}

                {/* Add User Modal (Portal: renders at body level) */}
                {showModal && createPortal(
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
                    , document.body)}
            </div>
        </DashboardLayout>
    );
};

export default CoordinatorUsers;
