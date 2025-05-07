/**
 * @desc    Get approval status for a requisition
 * @route   GET /api/v1/requisitions/:id/approval-status
 * @access  Private
 */
const getRequisitionApprovalStatus = async (req, res) => {
  try {
    const requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }

    // If no approval instance exists, return basic status
    if (!requisition.approvalInstanceId) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'Not Started',
          currentStage: null,
          currentApprovers: [],
          completedStages: [],
          isComplete: false
        }
      });
    }

    // Get detailed approval status
    const approvalStatus = await approvalService.getApprovalStatus(
      requisition._id, 
      { tenantId: req.tenant.id }
    );

    res.status(200).json({
      success: true,
      data: approvalStatus
    });
  } catch (error) {
    console.error('Error getting requisition approval status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching approval status'
    });
  }
};
