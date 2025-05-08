/**
 * @swagger
 * tags:
 *   name: Supplier Orders
 *   description: API for managing supplier orders in the vendor portal
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SupplierOrder:
 *       type: object
 *       required:
 *         - orderId
 *         - customerName
 *         - orderType
 *         - date
 *         - status
 *         - vendorId
 *         - tenantId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         orderId:
 *           type: string
 *           description: Unique order identifier 
 *         customerName:
 *           type: string
 *           description: Name of the customer
 *         orderType:
 *           type: string
 *           enum: [Quote, PO]
 *           description: Type of order
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the order
 *         status:
 *           type: string
 *           enum: [Requested, Accepted, Rejected, In Delivery, Delivered]
 *           description: Current status of the order
 *         vendorId:
 *           type: string
 *           description: Reference to the vendor
 *         quote:
 *           type: object
 *           properties:
 *             unitPrice:
 *               type: number
 *               description: Unit price for the item
 *             taxes:
 *               type: number
 *               description: Taxes amount
 *             deliveryDate:
 *               type: string
 *               format: date-time
 *               description: Expected delivery date
 *             terms:
 *               type: string
 *               description: Payment terms
 *             notes:
 *               type: string
 *               description: Additional notes
 *             submittedAt:
 *               type: string
 *               format: date-time
 *               description: Quote submission date
 *         poDetails:
 *           type: object
 *           properties:
 *             accepted:
 *               type: boolean
 *               description: Whether the PO was accepted
 *             estimatedDeliveryDate:
 *               type: string
 *               format: date-time
 *               description: Estimated delivery date
 *             poFileUrl:
 *               type: string
 *               description: URL to the PO file
 *         deliveryStatus:
 *           type: object
 *           properties:
 *             currentStatus:
 *               type: string
 *               enum: [Not Started, In Transit, Delivered, Delayed]
 *               description: Current delivery status
 *             invoiceUrl:
 *               type: string
 *               description: URL to the invoice file
 *             trackingInfo:
 *               type: string
 *               description: Tracking information
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Last update timestamp
 *         tenantId:
 *           type: string
 *           description: Reference to the tenant
 *         createdBy:
 *           type: string
 *           description: User who created the order
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *       example:
 *         orderId: PO-2023-0001
 *         customerName: ABC Corporation
 *         orderType: PO
 *         date: 2023-05-15T00:00:00.000Z
 *         status: Requested
 *         vendorId: 60a4f89b9e1a8c3d4c567890
 *         quote:
 *           unitPrice: 150.00
 *           taxes: 15.00
 *           deliveryDate: 2023-05-30T00:00:00.000Z
 *           terms: Net 30
 *           notes: Standard delivery terms apply
 */

/**
 * @swagger
 * /api/v1/supplier-orders:
 *   get:
 *     summary: Get all supplier orders
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: orderType
 *         schema:
 *           type: string
 *         description: Filter by order type
 *     responses:
 *       200:
 *         description: A list of supplier orders
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
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupplierOrder'
 *       500:
 *         description: Server Error
 *
 *   post:
 *     summary: Create a new supplier order
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplierOrder'
 *     responses:
 *       201:
 *         description: The supplier order was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplierOrder'
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/supplier-orders/{id}:
 *   get:
 *     summary: Get a supplier order by ID
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier order ID
 *     responses:
 *       200:
 *         description: The supplier order information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplierOrder'
 *       404:
 *         description: Supplier order not found
 *       500:
 *         description: Server Error
 *
 *   put:
 *     summary: Update a supplier order
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               customerName:
 *                 type: string
 *               orderType:
 *                 type: string
 *                 enum: [Quote, PO]
 *               date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [Requested, Accepted, Rejected, In Delivery, Delivered]
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The supplier order was updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplierOrder'
 *       404:
 *         description: Supplier order not found
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 *
 *   delete:
 *     summary: Delete a supplier order
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier order ID
 *     responses:
 *       200:
 *         description: The supplier order was deleted
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
 *         description: Supplier order not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/supplier-orders/{id}/quote:
 *   put:
 *     summary: Update the quote for a supplier order
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitPrice:
 *                 type: number
 *               taxes:
 *                 type: number
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *               terms:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: The quote was updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplierOrder'
 *       404:
 *         description: Supplier order not found
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/supplier-orders/{id}/po-details:
 *   put:
 *     summary: Update the PO details for a supplier order
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accepted:
 *                 type: boolean
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *               poFileUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: The PO details were updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplierOrder'
 *       404:
 *         description: Supplier order not found
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/supplier-orders/{id}/delivery:
 *   put:
 *     summary: Update the delivery status for a supplier order
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentStatus:
 *                 type: string
 *                 enum: [Not Started, In Transit, Delivered, Delayed]
 *               invoiceUrl:
 *                 type: string
 *               trackingInfo:
 *                 type: string
 *     responses:
 *       200:
 *         description: The delivery status was updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplierOrder'
 *       404:
 *         description: Supplier order not found
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/supplier-orders/{id}/status:
 *   put:
 *     summary: Change the status of a supplier order
 *     tags: [Supplier Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Requested, Accepted, Rejected, In Delivery, Delivered]
 *                 required: true
 *     responses:
 *       200:
 *         description: The status was updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplierOrder'
 *       404:
 *         description: Supplier order not found
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */
