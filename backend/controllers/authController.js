import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, rollSequence, batch, enrolledYear, semester, domain, designation, degree, companyName } = req.body;

        // Only allow students and external supervisors to register via this endpoint
        if (role !== 'student' && role !== 'external_supervisor') {
            return res.status(403).json({ message: 'Only students and external supervisors can register. Other accounts are created by administration.' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Generate registration number (Roll No)
        // Format: Fa-2023/BSSE/158
        let generatedRegNo = undefined;
        if (role === 'student' && rollSequence && batch && enrolledYear && degree) {
            generatedRegNo = `${batch}-${enrolledYear}/${degree}/${rollSequence}`;

            // Check if this generated roll number already exists
            const regExists = await User.findOne({ registrationNumber: generatedRegNo });
            if (regExists) {
                return res.status(400).json({ message: `Registration number ${generatedRegNo} already exists` });
            }
        }

        // Create user object
        const userData = {
            email,
            password,
            role,
            firstName,
            lastName,
            registrationNumber: generatedRegNo,
            rollSequence: rollSequence ? parseInt(rollSequence) : undefined,
            degree,
            batch,
            enrolledYear: enrolledYear ? parseInt(enrolledYear) : undefined,
            semester: semester ? parseInt(semester) : (role === 'student' ? 7 : undefined),
            companyName: role === 'external_supervisor' ? companyName : undefined
        };

        // Only add domain and designation if they are provided and not empty
        if (domain && domain !== '') {
            userData.domain = Array.isArray(domain) ? domain : [domain];
        }

        if (designation && designation !== '') {
            userData.designation = designation;
        }

        // Create user
        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Your account has been deactivated' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            domain: user.domain,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                email: updatedUser.email,
                role: updatedUser.role,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
