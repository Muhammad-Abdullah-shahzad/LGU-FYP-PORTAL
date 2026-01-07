import User from '../models/User.js';

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
            .select('firstName lastName email domain designation')
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
            .select('firstName lastName email domain designation')
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
