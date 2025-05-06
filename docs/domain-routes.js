/**
 * @swagger
 * /domain/check:
 *   post:
 *     summary: Check if an email domain is associated with a tenant
 *     tags: [Domain]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Domain check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         slug:
 *                           type: string
 *                         domains:
 *                           type: array
 *                           items:
 *                             type: string
 *                     authTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [local, azure, okta]
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         description: Domain not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Domain not associated with any tenant"
 */
