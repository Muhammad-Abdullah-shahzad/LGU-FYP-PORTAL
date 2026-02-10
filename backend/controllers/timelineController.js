import Timeline from '../models/Timeline.js';

// @desc    Create timeline
// @route   POST /api/timeline
// @access  Private/Coordinator
export const createTimeline = async (req, res) => {
    try {
        const timeline = await Timeline.create({
            ...req.body,
            createdBy: req.user._id
        });

        res.status(201).json({
            message: 'Timeline created successfully',
            timeline
        });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Timeline already exists for this batch, year and semester'
            });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all timelines
// @route   GET /api/timeline
// @access  Private
export const getAllTimelines = async (req, res) => {
    try {
        const { batch, year, batchYear, semester, isActive } = req.query;

        const filter = {};
        if (batch) filter.batch = batch;
        if (year) filter.year = parseInt(year);
        if (batchYear) filter.batchYear = parseInt(batchYear);
        if (semester) filter.semester = parseInt(semester);
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const timelines = await Timeline.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .sort({ year: -1, batch: -1, semester: -1 });

        res.json({
            count: timelines.length,
            timelines
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get active timeline for semester
// @route   GET /api/timeline/active/:semester
// @access  Private
export const getActiveTimeline = async (req, res) => {
    try {
        const { semester } = req.params;
        let { batch, batchYear } = req.query;

        const filter = {
            semester: parseInt(semester),
            isActive: true
        };

        // If user is a student, prioritize their batch and enrollment year
        if (req.user && req.user.role === 'student') {
            if (!batch) {
                const b = req.user.batch;
                batch = (b === 'Fa' || b === 'Fall') ? 'Fall' : (b === 'Sp' || b === 'Spring' ? 'Spring' : b);
            }
            if (!batchYear) {
                batchYear = req.user.enrolledYear;
            }
        }

        if (batch) filter.batch = batch;
        if (batchYear) filter.batchYear = parseInt(batchYear);

        const timeline = await Timeline.findOne(filter).sort({ batchYear: -1, createdAt: -1 });

        if (!timeline) {
            return res.status(404).json({ message: 'No active timeline found' });
        }

        res.json(timeline);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update timeline
// @route   PUT /api/timeline/:id
// @access  Private/Coordinator
export const updateTimeline = async (req, res) => {
    try {
        const timeline = await Timeline.findById(req.params.id);

        if (!timeline) {
            return res.status(404).json({ message: 'Timeline not found' });
        }

        Object.assign(timeline, req.body);
        await timeline.save();

        res.json({
            message: 'Timeline updated successfully',
            timeline
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete timeline
// @route   DELETE /api/timeline/:id
// @access  Private/Coordinator
export const deleteTimeline = async (req, res) => {
    try {
        const timeline = await Timeline.findById(req.params.id);

        if (!timeline) {
            return res.status(404).json({ message: 'Timeline not found' });
        }

        await timeline.deleteOne();

        res.json({ message: 'Timeline deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Check if phase is active
// @route   GET /api/timeline/check-phase/:phase
// @access  Private
export const checkPhaseStatus = async (req, res) => {
    try {
        const { phase } = req.params;
        let { batch, batchYear, semester } = req.query;

        const filter = {
            isActive: true
        };

        if (semester) filter.semester = parseInt(semester);

        // If user is a student, prioritize their batch and enrollment year
        if (req.user && req.user.role === 'student') {
            if (!batch) {
                const b = req.user.batch;
                batch = (b === 'Fa' || b === 'Fall') ? 'Fall' : (b === 'Sp' || b === 'Spring' ? 'Spring' : b);
            }
            if (!batchYear) {
                batchYear = req.user.enrolledYear;
            }
        }

        if (batch) filter.batch = batch;
        if (batchYear) filter.batchYear = parseInt(batchYear);

        const timeline = await Timeline.findOne(filter).sort({ batchYear: -1, semester: -1, createdAt: -1 });

        if (!timeline) {
            return res.json({ isActive: false, message: 'No active timeline found' });
        }

        const isActive = timeline.isPhaseActive(phase);

        res.json({
            isActive,
            phase,
            status: timeline[`${phase}Status`],
            startDate: timeline[`${phase}Start`],
            endDate: timeline[`${phase}End`]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
