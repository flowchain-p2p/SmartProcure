/**
 * @swagger
 * /uom:
 *   get:
 *     summary: Get all units of measure for the current tenant
 *     tags: [UnitOfMeasure]
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term for units of measure
 *     responses:
 *       200:
 *         description: List of units of measure
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
 *                     $ref: '#/components/schemas/UnitOfMeasure'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     summary: Create a new unit of measure
 *     tags: [UnitOfMeasure]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - abbreviation
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kilogram
 *               abbreviation:
 *                 type: string
 *                 example: kg
 *               description:
 *                 type: string
 *                 example: Standard unit for weight measurement
 *     responses:
 *       201:
 *         description: Created unit of measure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UnitOfMeasure'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /uom/{id}:
 *   get:
 *     summary: Get a single unit of measure by ID
 *     tags: [UnitOfMeasure]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit of Measure ID
 *     responses:
 *       200:
 *         description: Unit of measure details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UnitOfMeasure'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update a unit of measure
 *     tags: [UnitOfMeasure]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit of Measure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kilogram
 *               abbreviation:
 *                 type: string
 *                 example: kg
 *               description:
 *                 type: string
 *                 example: Updated description for weight measurement
 *     responses:
 *       200:
 *         description: Updated unit of measure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UnitOfMeasure'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete a unit of measure
 *     tags: [UnitOfMeasure]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit of Measure ID
 *     responses:
 *       200:
 *         description: Unit of measure deleted
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
 */
