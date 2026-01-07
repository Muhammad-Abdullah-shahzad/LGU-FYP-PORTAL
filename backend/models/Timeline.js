import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
    batch: {
        type: String,
        required: true,
        enum: ['Fall', 'Spring']
    },
    year: {

        type: Number,
        required: true
    },
    batchYear: {
        type: Number,
        required: true
    },
    semester: {
        type: Number,
        required: true,
        enum: [7, 8]
    },

    // Common
    groupRegistrationStart: Date,
    groupRegistrationEnd: Date,
    groupRegistrationStatus: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Closed'
    },

    // 7th Semester Phases
    proposalSubmissionStart: Date,
    proposalSubmissionEnd: Date,
    proposalSubmissionStatus: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Closed'
    },

    proposalDefenseStart: Date,
    proposalDefenseEnd: Date,
    proposalDefenseStatus: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Closed'
    },

    internalDefenseStart: Date,
    internalDefenseEnd: Date,
    internalDefenseStatus: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Closed'
    },

    // 8th Semester Phases
    srsDefenseStart: Date,
    srsDefenseEnd: Date,
    srsDefenseStatus: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Closed'
    },

    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Ensure only one active timeline per batch, batchYear, and semester
timelineSchema.index({ batch: 1, batchYear: 1, semester: 1 }, { unique: true });




// Method to check if a specific phase is active
timelineSchema.methods.isPhaseActive = function (phase) {
    const statusField = `${phase}Status`;

    // If status field exists (Group Registration, Proposal Defense, Internal Defense)
    if (this[statusField]) {
        return this[statusField] === 'Open';
    }

    // Fallback to date-based check for other phases
    const now = new Date();
    const startField = `${phase}Start`;
    const endField = `${phase}End`;

    if (!this[startField] || !this[endField]) {
        return false;
    }

    const startDate = new Date(this[startField]);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(this[endField]);
    endDate.setHours(23, 59, 59, 999);

    return now >= startDate && now <= endDate;
};

export default mongoose.model('Timeline', timelineSchema);
