/**
 * @swagger
 * /requisitions/{id}/approval-status:
 *   get:
 *     summary: Get approval status details for a requisition
 *     tags: [Requisitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the requisition
 *     responses:
 *       200:
 *         description: Approval status details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [NotStarted, InProgress, Approved, Rejected, Returned, Cancelled]
 *                       example: InProgress
 *                     currentStage:
 *                       type: object
 *                       properties:
 *                         stage:
 *                           type: string
 *                           example: "Department Approval"
 *                         stageOrder:
 *                           type: number
 *                           example: 1
 *                     currentApprovers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: "60d5ec9af682fbd12a0023a9"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john.doe@example.com"
 *                           role:
 *                             type: string
 *                             example: "DepartmentHead"
 *                     completedStages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stage:
 *                             type: string
 *                             example: "Cost Center Approval"
 *                           stageOrder:
 *                             type: number
 *                             example: 0
 *                           approvers:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Jane Smith"
 *                                 role:
 *                                   type: string
 *                                   example: "CostCenterHead"
 *                                 status:
 *                                   type: string
 *                                   example: "Approved" 
 *                                 comments:
 *                                   type: string
 *                                   example: "Looks good"
 *                                 actionDate:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2024-05-06T14:30:00Z"
 *                     isComplete:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Requisition not found
 *       500:
 *         description: Server error
 */
