import mongoose from 'mongoose';

const defensePanelSchema = new mongoose.Schema({
    panelName: {
        type: String,
        required: true,
        unique: true
    },
    panelType: {
        type: String,
        enum: ['proposal', 're-proposal', 'internal', 'srs', 'external'],
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    chairperson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    academicYear: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        enum: ['Fall', 'Spring'],
        default: 'Fall'
    },
    semester: {
        type: Number,
        required: true
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

// Ensure chairperson is in members array
defensePanelSchema.pre('validate', function (next) {

    // Ensure chairperson is in members array
    if (!this.members.includes(this.chairperson)) {
        this.members.push(this.chairperson);
    }

    next();
});

// Auto-generate panel name
defensePanelSchema.pre('validate', async function (next) {
    if (!this.panelName || this.isNew) {
        const count = await mongoose.model('DefensePanel').countDocuments({
            panelType: this.panelType,
            academicYear: this.academicYear,
            batch: this.batch
        });

        const typePrefix = {
            'proposal': 'PP',
            're-proposal': 'RP',
            'internal': 'IP',
            'srs': 'SP',
            'external': 'EP'
        };

        this.panelName = `${typePrefix[this.panelType]}-${this.academicYear}-${this.batch.charAt(0)}-${String(count + 1).padStart(2, '0')}`;
    }
    next();
});

export default mongoose.model('DefensePanel', defensePanelSchema);
