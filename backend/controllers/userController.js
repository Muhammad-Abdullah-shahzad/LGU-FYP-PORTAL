import User from '../models/User.js';
import XLSX from 'xlsx';

// @desc    Get all users (Coordinator)
// @route   GET /api/users
// @access  Private/Coordinator
export const getAllUsers = async (req, res) => {
    try {
        const { role, domain } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (domain) filter.domain = domain;

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Coordinator
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create user (Coordinator)
// @route   POST /api/users
// @access  Private/Coordinator
export const createUser = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, registrationNumber, domain, designation } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Check registration number for students
        if (role === 'student' && registrationNumber) {
            const regExists = await User.findOne({ registrationNumber });
            if (regExists) {
                return res.status(400).json({ message: 'Registration number already exists' });
            }
        }

        const user = await User.create({
            email,
            password,
            role,
            firstName,
            lastName,
            registrationNumber,
            domain,
            designation
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user (Coordinator)
// @route   PUT /api/users/:id
// @access  Private/Coordinator
export const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { firstName, lastName, domain, designation, isActive } = req.body;

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (domain) user.domain = domain;
        if (designation) user.designation = designation;
        if (typeof isActive !== 'undefined') user.isActive = isActive;

        await user.save();

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete user (Coordinator)
// @route   DELETE /api/users/:id
// @access  Private/Coordinator
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is a coordinator (optional security)
        if (user.role === 'coordinator') {
            return res.status(400).json({ message: 'Coordinator accounts cannot be deleted' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted permanently' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload supervisors from Excel
// @route   POST /api/users/upload-supervisors
// @access  Private/Coordinator
export const uploadSupervisors = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an excel file' });
        }

        // Parse column mapping from frontend
        let mapping = {};
        if (req.body.mapping) {
            try { mapping = JSON.parse(req.body.mapping); } catch { mapping = {}; }
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        const stats = {
            created: 0,
            skipped: 0,
            alreadyExists: 0,
            missingFields: 0,
            errors: []
        };

        // Debug: log mapping and first row keys
        console.log('[Upload] Mapping received:', JSON.stringify(mapping));
        if (data.length > 0) {
            console.log('[Upload] First row keys:', Object.keys(data[0]));
            console.log('[Upload] First row sample:', JSON.stringify(data[0]));
        }

        const defaultPassword = 'Lgu12345';

        // Get the last faculty ID to increment
        const lastFaculty = await User.findOne({
            role: { $in: ['supervisor', 'panel_member'] },
            registrationNumber: { $regex: /^LGU-FAC-/ }
        }).sort({ registrationNumber: -1 });

        let nextIdNumber = 1;
        if (lastFaculty && lastFaculty.registrationNumber) {
            const match = lastFaculty.registrationNumber.match(/LGU-FAC-(\d+)/);
            if (match) nextIdNumber = parseInt(match[1]) + 1;
        }

        // Helper: build a trimmed-key lookup from the row so trailing/leading spaces in Excel headers don't break matching
        const buildTrimmedRow = (row) => {
            const trimmed = {};
            for (const key of Object.keys(row)) {
                trimmed[key.trim()] = row[key];
            }
            return trimmed;
        };

        // Helper: get value from row using the mapped column name
        const get = (trimmedRow, key, fallbacks = []) => {
            // Try mapped column name first
            if (mapping[key]) {
                const mappedCol = mapping[key].trim();
                if (trimmedRow[mappedCol] !== undefined) return String(trimmedRow[mappedCol]).trim();
            }
            // Try fallbacks
            for (const fb of fallbacks) {
                const fbTrimmed = fb.trim();
                if (trimmedRow[fbTrimmed] !== undefined) return String(trimmedRow[fbTrimmed]).trim();
            }
            return '';
        };

        for (const row of data) {
            try {
                const trimmedRow = buildTrimmedRow(row);
                const fullName = get(trimmedRow, 'fullName', ['Full Name', 'Name', 'fullname']);
                const email = get(trimmedRow, 'email', ['Email', 'email']);
                const designation = get(trimmedRow, 'designation', ['Designation']);
                const phoneNumber = get(trimmedRow, 'phoneNumber', ['Phone #', 'Phone Number', 'phone']);
                const officeAddress = get(trimmedRow, 'officeAddress', ['Office Address', 'office_address']);
                const areaOfExpertise = get(trimmedRow, 'areaOfExpertise', ['Area of Expertise / Research Interests', 'Specialization']);
                const domainStr = get(trimmedRow, 'domain', ['Domain', 'domain']);
                const preferredProjectNature = get(trimmedRow, 'preferredProjectNature', ['Preferred Project Nature']);
                const specificTools = get(trimmedRow, 'specificTools', ['Any specific tools/technologies you want students to use in their projects?']);
                const interestedProjectTypes = get(trimmedRow, 'interestedProjectTypes', ['Types of projects you would be interested in supervising']);

                if (!email || !fullName) {
                    stats.skipped++;
                    stats.missingFields++;
                    console.log('[Upload] Skipped (missing fields):', { fullName, email, rowKeys: Object.keys(row) });
                    continue;
                }

                // Parse domain — accept any value, split by comma
                let domain = [];
                if (domainStr) {
                    domain = domainStr.split(',').map(d => d.trim()).filter(Boolean);
                }
                // If no domain column mapped, use areaOfExpertise split by comma as domain
                if (domain.length === 0 && areaOfExpertise) {
                    domain = areaOfExpertise.split(',').map(d => d.trim()).filter(Boolean);
                }

                // Skip duplicates
                const userExists = await User.findOne({ email: email.toLowerCase() });
                if (userExists) {
                    stats.skipped++;
                    stats.alreadyExists++;
                    continue;
                }

                // Split full name
                const nameParts = fullName.trim().split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || '.';

                // Auto-assign faculty ID
                const registrationNumber = `LGU-FAC-${String(nextIdNumber).padStart(3, '0')}`;

                await User.create({
                    email: email.toLowerCase(),
                    password: defaultPassword,
                    role: 'supervisor',
                    firstName,
                    lastName,
                    registrationNumber,
                    designation,
                    phoneNumber,
                    officeAddress,
                    areaOfExpertise,
                    domain,
                    preferredProjectNature,
                    specificTools,
                    interestedProjectTypes
                });

                nextIdNumber++;
                stats.created++;
            } catch (err) {
                console.error(`Error creating user ${row['Email']}:`, err);
                stats.errors.push({ email: row['Email'], error: err.message });
            }
        }

        res.status(200).json({
            message: `Bulk upload completed. Created: ${stats.created}, Skipped: ${stats.skipped} (${stats.alreadyExists} already existed, ${stats.missingFields} missing fields)`,
            stats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get teachers by domain

// @route   GET /api/users/teachers/by-domain/:domain
// @access  Private/Student
export const getTeachersByDomain = async (req, res) => {
    try {
        const { domain } = req.params;

        const teachers = await User.find({
            role: { $in: ['supervisor', 'panel_member'] },
            domain: domain,
            isActive: true
        })
            .select('firstName lastName email domain designation areaOfExpertise phoneNumber officeAddress')
            .sort({ firstName: 1 });

        res.json({
            count: teachers.length,
            teachers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all active supervisors
// @route   GET /api/users/supervisors
// @access  Private
export const getAllSupervisors = async (req, res) => {
    try {
        const supervisors = await User.find({
            role: 'supervisor',
            isActive: true
        })
            .select('firstName lastName email domain designation areaOfExpertise phoneNumber officeAddress')
            .sort({ firstName: 1 });

        res.json({
            count: supervisors.length,
            supervisors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Search students by registration number
// @route   GET /api/users/students/search/:regNum
// @access  Private
export const searchStudents = async (req, res) => {
    try {
        const { regNum } = req.params;

        // Search for students with matching registration number (case insensitive, partial match)
        const students = await User.find({
            role: 'student',
            registrationNumber: { $regex: regNum, $options: 'i' },
            isActive: true,
            _id: { $ne: req.user._id } // Exclude the requesting user
        })
            .select('firstName lastName registrationNumber email')
            .limit(5);

        res.json({
            count: students.length,
            students
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
