import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, rollSequence, batch, enrolledYear, semester, domain, designation, degree } = req.body;

        // Only allow students to register via this endpoint
        if (role !== 'student') {
            return res.status(403).json({ message: 'Only students can register. Other accounts are created by administration.' });
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
            rollSequence: parseInt(rollSequence),
            degree,
            batch,
            enrolledYear: parseInt(enrolledYear),
            semester: parseInt(semester) || 7
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
