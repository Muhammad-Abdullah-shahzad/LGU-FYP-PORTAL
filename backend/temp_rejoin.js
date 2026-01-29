
// @desc    Rejoin batch after failure
// @route   POST /api/groups/:id/rejoin
// @access  Private/Student
export const rejoinBatch = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only leader can perform this action' });
        }

        if (group.status !== 'failed') {
            return res.status(400).json({ message: 'Only failed groups can rejoin a new batch' });
        }

        // Determine the failure phase and target state
        let targetStatus = 'registered';
        let targetPhase = 'proposalDefense';
        let resetFieldAttempts = 'proposalAttempts';
        let panelField = 'proposalPanel';

        if (group.srsAttempts > 0 || group.statusHistory.some(h => h.status.includes('srs'))) {
            // Failed in SRS -> Restart SRS
            // Pre-requisite: Internal Passed
            targetStatus = 'internal_approved';
            targetPhase = 'srsDefense';
            resetFieldAttempts = 'srsAttempts'; // Assuming we add this field or track it
            panelField = 'srsPanel';
        }
        else if (group.internalAttempts > 0 || group.statusHistory.some(h => h.status.includes('internal'))) {
            // Failed in Internal -> Restart Internal
            // Pre-requisite: Proposal Passed
            targetStatus = 'proposal_approved';
            targetPhase = 'internalDefense';
            resetFieldAttempts = 'internalAttempts';
            panelField = 'internalPanel';
        }
        else {
            // Default: Failed in Proposal -> Restart Proposal
            targetStatus = 'registered';
            targetPhase = 'proposalSubmission'; // Logic aligns with Proposal Submission start
            resetFieldAttempts = 'proposalAttempts';
            panelField = 'proposalPanel';
        }

        // Find active timeline for the target phase
        const timelines = await Timeline.find({ isActive: true });
        const activeTimeline = timelines.find(t => t.isPhaseActive(targetPhase) || t.isPhaseActive('groupRegistration'));
        // Note: For proposal failure, they need Registration or Proposal Submission open.
        // For Internal failure, they need Internal Defense open usually? 
        // "Merged with next semester group": Usually implies they join their batch.

        // Simpler check: Find ANY active timeline that is NEWER than the group's current one
        // or just the current active one associated with the university context.
        // We'll trust the "isActive: true" flag on timelines. Assumes 1 active timeline usually.
        // Or if multiple, pick the one matching the phase?

        let targetTimeline = null;
        if (targetPhase === 'proposalSubmission') {
            targetTimeline = timelines.find(t => t.isPhaseActive('proposalSubmission') || t.isPhaseActive('groupRegistration'));
        } else {
            targetTimeline = timelines.find(t => t.isPhaseActive(targetPhase));
        }

        if (!targetTimeline) {
            return res.status(400).json({ message: `No active timeline found for ${targetPhase}. Cannot rejoin yet.` });
        }

        // Update Group Context
        const oldBatch = `${group.batch}-${group.year}`;
        const newBatch = `${targetTimeline.batch}-${targetTimeline.year}`;

        if (oldBatch === newBatch) {
            // Prevent infinite resizing in same batch if they just failed?
            // User said "next semester". 
            // If I fail today, and timeline is still active, can I restart immediately? 
            // "Again start from the same phase with NEXT semester".
            // This implies if currently Fall 2024, I must wait for Spring 2025.
            // But if I am in Fall 2024 active timeline, I shouldn't be able to rejoin Fall 2024?
            // Unless "re-proposal" logic handles immediate retry. 
            // "Failed" usually means "See you next sem".

            // So we enforce strict batch change?
            // Actually, activeTimeline will likely BE the current one if I just failed. 
            // So this check might block them.
            // But if I failed, I am removed. I shouldn't rejoin until NEXT timeline.
            // If valid timeline is found, and it's the SAME, do we allow?
            // If I set "failed", typically I am out.

            // User requirement: "next semester".
            // We'll allow strict update if batch/year differs.

            // However, for testing, if user has only 1 timeline, this might block testing.
            // I will leave a comment but enforcing strict difference is safer for "Next Semester" logic.
            // But technically, if a *new* timeline hasn't been created yet, they can't rejoin.
            // They have to wait for Coordinator to create Spring 2025 timeline.

            if (activeTimeline.year === group.year && activeTimeline.batch === group.batch) {
                return res.status(400).json({ message: 'You must wait for the next semester timeline to activate before rejoining.' });
            }
        }

        group.batch = targetTimeline.batch;
        group.year = targetTimeline.year;
        group.batchYear = targetTimeline.batchYear;
        group.semester = targetTimeline.semester;

        group.status = targetStatus;
        group[resetFieldAttempts] = 0;
        group[panelField] = null;

        // Log
        group.addStatusChange(targetStatus, req.user._id, `Readmitted to ${newBatch} batch for ${targetPhase} retake.`);

        await group.save();

        res.json({
            message: `Successfully rejoined ${newBatch} batch. You can now proceed with ${targetPhase}.`,
            group
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
