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
    semester: {
        type: Number,
        required: true,
        enum: [7, 8]
    },

    // Common
    groupRegistrationStart: Date,
    groupRegistrationEnd: Date,

    // 7th Semester Phases
    proposalSubmissionStart: Date,
    proposalSubmissionEnd: Date,
    proposalDefenseStart: Date,
    proposalDefenseEnd: Date,
    internalDefenseStart: Date,
    internalDefenseEnd: Date,

    // 8th Semester Phases
    srsDefenseStart: Date,
    srsDefenseEnd: Date,
    externalDefenseStart: Date,
    externalDefenseEnd: Date,

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

// Ensure only one active timeline per batch, year, and semester
timelineSchema.index({ batch: 1, year: 1, semester: 1 }, { unique: true });




// Method to check if a specific phase is active
timelineSchema.methods.isPhaseActive = function (phase) {
    const now = new Date();
    const startField = `${phase}Start`;
    const endField = `${phase}End`;

    if (!this[startField] || !this[endField]) {
        return false;
    }

    // Normalize comparison by considering the dates independent of exact time
    const startDate = new Date(this[startField]);
    startDate.setHours(0, 0, 0, 0);


    const endDate = new Date(this[endField]);
    endDate.setHours(23, 59, 59, 999);

    return now >= startDate && now <= endDate;

};

export default mongoose.model('Timeline', timelineSchema);
