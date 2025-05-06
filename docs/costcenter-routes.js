/**
 * @swagger
 * /tenants/{tenantSlug}/cost-centers:
 *   get:
 *     summary: Get all cost centers for a tenant
 *     tags: [CostCenters]
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
 *         description: List of cost centers for tenant
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
 *                     $ref: '#/components/schemas/CostCenter'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   post:
 *     summary: Create a new cost center
 *     tags: [CostCenters]
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
 *               - code
 *               - name
 *               - head
 *             properties:
 *               code:
 *                 type: string
 *                 description: Cost center code
 *               name:
 *                 type: string
 *                 description: Cost center name
 *               budget:
 *                 type: number
 *                 description: Budget amount
 *               head:
 *                 type: string
 *                 description: ID of cost center head
 *               approvers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     level:
 *                       type: number
 *     responses:
 *       201:
 *         description: Cost center created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CostCenter'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 * /tenants/{tenantSlug}/cost-centers/{id}:
 *   get:
 *     summary: Get a single cost center
 *     tags: [CostCenters]
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
 *         description: Cost center ID
 *     responses:
 *       200:
 *         description: Cost center details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CostCenter'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   put:
 *     summary: Update a cost center
 *     tags: [CostCenters]
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
 *         description: Cost center ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Cost center code
 *               name:
 *                 type: string
 *                 description: Cost center name
 *               budget:
 *                 type: number
 *                 description: Budget amount
 *               head:
 *                 type: string
 *                 description: ID of cost center head
 *               approvers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     level:
 *                       type: number
 *     responses:
 *       200:
 *         description: Updated cost center details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CostCenter'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   delete:
 *     summary: Delete a cost center
 *     tags: [CostCenters]
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
 *         description: Cost center ID
 *     responses:
 *       200:
 *         description: Cost center deleted
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
 */
