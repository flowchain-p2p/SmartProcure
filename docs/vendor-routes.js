/**
 * @swagger
 * /vendors:
 *   get:
 *     summary: Get all vendors for the current tenant
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term for vendors (name, code, contact person, email)
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Pending, Blacklisted]
 *         description: Filter by vendor status
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by vendor category
 *       - name: isPreferred
 *         in: query
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by preferred vendor status
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vendor'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     summary: Create a new vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Vendor name
 *               code:
 *                 type: string
 *                 description: Vendor code (should be unique per tenant)
 *               contactPerson:
 *                 type: string
 *                 description: Primary contact person name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               phone:
 *                 type: string
 *                 description: Contact phone
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *               website:
 *                 type: string
 *                 description: Vendor website URL
 *               taxId:
 *                 type: string
 *                 description: Tax ID or registration number
 *               paymentTerms:
 *                 type: string
 *                 description: Payment terms
 *               category:
 *                 type: string
 *                 description: Vendor category
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Pending, Blacklisted]
 *                 description: Vendor status
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Vendor rating (0-5)
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               isPreferred:
 *                 type: boolean
 *                 description: Whether this is a preferred vendor
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /vendors/categories:
 *   get:
 *     summary: Get all vendor categories for the current tenant
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vendor categories
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
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /vendors/{id}:
 *   get:
 *     summary: Get a single vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Vendor name
 *               code:
 *                 type: string
 *                 description: Vendor code (should be unique per tenant)
 *               contactPerson:
 *                 type: string
 *                 description: Primary contact person name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               phone:
 *                 type: string
 *                 description: Contact phone
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *               website:
 *                 type: string
 *                 description: Vendor website URL
 *               taxId:
 *                 type: string
 *                 description: Tax ID or registration number
 *               paymentTerms:
 *                 type: string
 *                 description: Payment terms
 *               category:
 *                 type: string
 *                 description: Vendor category
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Pending, Blacklisted]
 *                 description: Vendor status
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Vendor rating (0-5)
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               isPreferred:
 *                 type: boolean
 *                 description: Whether this is a preferred vendor
 *     responses:
 *       200:
 *         description: Updated vendor details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor deleted
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
 *       400:
 *         description: Cannot delete vendor with active related records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
