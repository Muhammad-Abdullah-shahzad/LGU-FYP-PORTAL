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
    student2Status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'none'],
        default: 'none'
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectTitle: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true
    },
    projectDomain: {
        type: String,
        enum: ['Software Engineering', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Web Development', 'Mobile Development', 'AR/VR', 'Deep Learning', 'AI', 'ML', 'CV', 'NLP', 'LLM', 'Desktop', 'Game'],
        required: true
    },
    projectSummary: {
        type: String,
        required: [true, 'Project summary is required'],
        minlength: 20,
        maxlength: 2000
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
    batchYear: {
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
            'srs_submitted',
            'srs_defense',
            'srs_approved',
            'srs_rejected',
            'srs_revision',
            're_srs_defense',
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
    proposalSupervisorApproval: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    proposalSupervisorRemarks: String,
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
    internalSupervisorApproval: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    internalSupervisorRemarks: String,
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
    srsSupervisorApproval: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    srsSupervisorRemarks: String,
    srsRemarks: String,
    srsAttempts: {
        type: Number,
        default: 0
    },

    // External Defense
    externalPanel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DefensePanel',
        default: null
    },
    externalDefenseDate: Date,
    externalSupervisorApproval: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    externalSupervisorRemarks: String,
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
    // Only generate if groupName is not set or it's a re-generation trigger (groupName set to null)
    if (!this.groupName || this.isNew) {
        try {
            const batchCode = this.batch ? this.batch.substring(0, 1).toUpperCase() : 'X';
            const yearStr = this.year || new Date().getFullYear();
            const prefix = `FYP-${batchCode}${yearStr}-`;

            // Find the group with the highest number for this batch/year
            const lastGroup = await mongoose.model('Group').findOne({
                groupName: new RegExp(`^${prefix}`)
            }).sort({ groupName: -1 });

            let nextNumber = 1;
            if (lastGroup && lastGroup.groupName) {
                const parts = lastGroup.groupName.split('-');
                const lastNum = parseInt(parts[parts.length - 1]);
                if (!isNaN(lastNum)) {
                    nextNumber = lastNum + 1;
                }
            } else {
                // Fallback to count if regex search find nothing
                const count = await mongoose.model('Group').countDocuments({ batch: this.batch, year: this.year });
                nextNumber = count + 1;
            }

            this.groupName = `${prefix}${String(nextNumber).padStart(3, '0')}`;
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
