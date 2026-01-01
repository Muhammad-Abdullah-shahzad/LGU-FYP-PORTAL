import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        unique: true
    },
    student1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    projectTitle: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true
    },
    projectDomain: {
        type: String,
        enum: ['Software Engineering', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'AI', 'ML', 'DL', 'CV', 'NLP', 'LLM', 'Web', 'Mobile', 'Desktop', 'AR', 'VR', 'Game'],
        required: true
    },
    projectSummary: {
        type: String,
        required: [true, 'Project summary is required'],
        minlength: 50,
        maxlength: 1000
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    supervisorStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_requested'],
        default: 'not_requested'
    },
    supervisorRequestDate: {
        type: Date
    },
    semester: {
        type: Number,
        required: true,
        default: 7
    },
    batch: {
        type: String,
        required: true,
        enum: ['Fall', 'Spring']
    },
    year: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: [
            'registered',
            'proposal_submitted',
            'proposal_approved',
            'proposal_rejected',
            'proposal_revision',
            'internal_defense',
            'internal_approved',
            'internal_rejected',
            'internal_minor_revision',
            'internal_major_revision',
            're_internal_defense',
            'srs_defense',
            'srs_approved',
            'srs_revision',
            'external_defense',
            'completed',
            'failed'
        ],
        default: 'registered'
    },

    // Proposal Defense
    proposalPanel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DefensePanel',
        default: null
    },
    proposalDefenseDate: Date,
    proposalRemarks: String,
    proposalAttempts: {
        type: Number,
        default: 0
    },

    // Internal Defense
    internalPanel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DefensePanel',
        default: null
    },
    internalDefenseDate: Date,
    internalRemarks: String,
    internalAttempts: {
        type: Number,
        default: 0
    },

    // SRS Defense
    srsPanel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DefensePanel',
        default: null
    },
    srsDefenseDate: Date,
    srsRemarks: String,

    // External Defense
    externalPanel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DefensePanel',
        default: null
    },
    externalDefenseDate: Date,
    externalRemarks: String,
    finalGrade: String,

    // Document uploads
    proposalDocument: String,
    srsDocument: String,
    finalReport: String,

    // Audit trail
    statusHistory: [{
        status: String,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        remarks: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    registrationDeadline: Date,
    isRegistrationOpen: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Auto-generate group name
groupSchema.pre('validate', async function (next) {
    if (!this.groupName || this.isNew) {
        try {
            const count = await mongoose.model('Group').countDocuments();
            const batchCode = this.batch ? this.batch.substring(0, 1).toUpperCase() : 'X';
            const yearStr = this.year || new Date().getFullYear();
            this.groupName = `FYP-${batchCode}${yearStr}-${String(count + 1).padStart(3, '0')}`;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Method to add status change to history
groupSchema.methods.addStatusChange = function (status, userId, remarks = '') {
    this.statusHistory.push({
        status,
        changedBy: userId,
        remarks,
        timestamp: new Date()
    });
    this.status = status;
};

export default mongoose.model('Group', groupSchema);
