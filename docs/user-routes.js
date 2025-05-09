/**
 * @swagger
 * /tenants/{tenantSlug}/users:
 *   get:
 *     summary: Get all users for a tenant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *     responses:
 *       200:
 *         description: List of users for tenant
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   post:
 *     summary: Create a new user for a tenant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               locations:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 * /tenants/{tenantSlug}/users/{id}:
 *   get:
 *     summary: Get a single user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 * /tenants/{tenantSlug}/users/{id}/locations:
 *   get:
 *     summary: Get user locations
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User locations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 *
 *   post:
 *     summary: Manage user locations
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationIds
 *             properties:
 *               locationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of location IDs
 *     responses:
 *       200:
 *         description: User locations updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *
 * /tenants/{tenantSlug}/users/{id}/default-location/{locationId}:
 *   put:
 *     summary: Set user default location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Default location updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *
 * /tenants/{tenantSlug}/users/approvers:
 *   get:
 *     summary: Get all approvers (cost center heads, approvers, and administrators)
 *     description: Retrieves a list of all approvers in the system, including cost center heads, approvers, and administrators
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantSlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant's slug
 *       - name: costCenterId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional - Filter approvers by specific cost center
 *       - name: includeAdmins
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Optional - Include administrators in the results
 *     responses:
 *       200:
 *         description: List of approvers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60d21b4667d0d8992e610c85
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       email:
 *                         type: string
 *                         example: john@example.com
 *                       role:
 *                         type: string
 *                         enum: [CostCenterHead, Approver, Administrator]
 *                         example: CostCenterHead
 *                       approverType:
 *                         type: string
 *                         enum: [CostCenterHead, CostCenterApprover, Administrator]
 *                         example: CostCenterHead
 *                       costCenterId:
 *                         type: string
 *                         example: 60d21b4667d0d8992e610c86
 *                       costCenterName:
 *                         type: string
 *                         example: Finance Department
 *                       level:
 *                         type: integer
 *                         example: 1
 *                         description: Priority level for approval (lower number = higher priority)
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
