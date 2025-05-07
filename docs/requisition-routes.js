/**
 * @swagger
 * /requisitions:
 *   get:
 *     summary: Get all requisitions for the current tenant
 *     tags: [Requisitions]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by requisition status
 *       - name: createdBy
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by creator user ID
 *       - name: organizationId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by organization ID
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term for requisitions
 *     responses:
 *       200:
 *         description: List of requisitions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Requisition'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     summary: Create a new requisition
 *     tags: [Requisitions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequisitionInput'
 *     responses:
 *       201:
 *         description: Created requisition
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Requisition'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /requisitions/{id}:
 *   get:
 *     summary: Get a single requisition by ID
 *     tags: [Requisitions]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Requisition ID
 *     responses:
 *       200:
 *         description: Requisition details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Requisition'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update a requisition
 *     tags: [Requisitions]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Requisition ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequisitionInput'
 *     responses:
 *       200:
 *         description: Updated requisition
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Requisition'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete a requisition
 *     tags: [Requisitions]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Requisition ID
 *     responses:
 *       200:
 *         description: Requisition deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /requisitions/{id}/submit:
 *   patch:
 *     summary: Submit a requisition for approval
 *     tags: [Requisitions]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Requisition ID
 *     responses:
 *       200:
 *         description: Requisition submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Requisition'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /requisitions/{id}/approve:
 *   patch:
 *     summary: Approve a requisition
 *     tags: [Requisitions]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Requisition ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Approval action
 *               comments:
 *                 type: string
 *                 description: Optional comments for the approval action
 *     responses:
 *       200:
 *         description: Requisition approval status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Requisition'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

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
