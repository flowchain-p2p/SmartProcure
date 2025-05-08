/**
 * @swagger
 * tags:
 *   name: Purchase Orders
 *   description: Purchase Order management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseOrderItem:
 *       type: object
 *       required:
 *         - description
 *         - quantity
 *         - unitPrice
 *         - totalPrice
 *         - unitOfMeasure
 *       properties:
 *         description:
 *           type: string
 *           description: Item description
 *         quantity:
 *           type: number
 *           description: Item quantity
 *         unitPrice:
 *           type: number
 *           description: Price per unit
 *         totalPrice:
 *           type: number
 *           description: Total price (quantity * unitPrice)
 *         currency:
 *           type: string
 *           description: Currency code (default INR)
 *         catalogItemId:
 *           type: string
 *           description: Reference to catalog item if applicable
 *         requisitionItemId:
 *           type: string
 *           description: Reference to originating requisition item
 *         rfqItemId:
 *           type: string
 *           description: Reference to RFQ item if PO was created from RFQ
 *         unitOfMeasure:
 *           type: string
 *           description: Unit of measurement (e.g., Each, Kg, Box)
 *         notes:
 *           type: string
 *           description: Additional notes for the item
 *     
 *     PurchaseOrder:
 *       type: object
 *       required:
 *         - title
 *         - requisitionId
 *         - vendorId
 *         - items
 *         - deliveryDate
 *       properties:
 *         poNumber:
 *           type: string
 *           description: Unique purchase order number (auto-generated)
 *           readOnly: true
 *         title:
 *           type: string
 *           description: PO title
 *         description:
 *           type: string
 *           description: PO description
 *         status:
 *           type: string
 *           enum: [Draft, Issued, Delivered, Completed, Cancelled]
 *           default: Draft
 *           description: Current status of the purchase order
 *         requisitionId:
 *           type: string
 *           description: Reference to originating requisition
 *         vendorId:
 *           type: string
 *           description: Reference to supplier/vendor
 *         rfqId:
 *           type: string
 *           description: Reference to RFQ if PO was created from awarded RFQ
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseOrderItem'
 *           description: Line items in the purchase order
 *         totalAmount:
 *           type: number
 *           description: Total amount of the purchase order
 *         currency:
 *           type: string
 *           default: INR
 *           description: Currency code
 *         deliveryDate:
 *           type: string
 *           format: date
 *           description: Expected delivery date
 *         deliveryAddress:
 *           type: string
 *           description: Delivery location address
 *         deliveryContact:
 *           type: string
 *           description: Contact person for delivery
 *         paymentTerms:
 *           type: string
 *           description: Payment terms
 *         notes:
 *           type: string
 *           description: Additional notes
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: File paths or URLs to attachments
 *         tenantId:
 *           type: string
 *           description: Reference to tenant
 *           readOnly: true
 *         organizationId:
 *           type: string
 *           description: Reference to organization
 *         createdBy:
 *           type: string
 *           description: User who created the PO
 *           readOnly: true
 *         issuedBy:
 *           type: string
 *           description: User who issued the PO
 *           readOnly: true
 *         issuedAt:
 *           type: string
 *           format: date-time
 *           description: When the PO was issued
 *           readOnly: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           readOnly: true
 */

/**
 * @swagger
 * /api/v1/purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Issued, Delivered, Completed, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *       - in: query
 *         name: requisitionId
 *         schema:
 *           type: string
 *         description: Filter by requisition ID
 *       - in: query
 *         name: rfqId
 *         schema:
 *           type: string
 *         description: Filter by RFQ ID
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *         description: Filter by organization ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering by creation date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering by creation date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in poNumber, title, and description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of purchase orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PurchaseOrder'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new purchase order
 *     tags: [Purchase Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseOrder'
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Requisition or vendor not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseOrder'
 *     responses:
 *       200:
 *         description: Purchase order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete non-draft purchase order
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/purchase-orders/{id}/issue:
 *   patch:
 *     summary: Issue a purchase order (change status to Issued)
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Cannot issue non-draft purchase order
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/purchase-orders/{id}/deliver:
 *   patch:
 *     summary: Mark a purchase order as delivered
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order marked as delivered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Can only mark issued purchase orders as delivered
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/purchase-orders/{id}/complete:
 *   patch:
 *     summary: Complete a purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Can only complete delivered purchase orders
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/purchase-orders/{id}/cancel:
 *   patch:
 *     summary: Cancel a purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Cannot cancel completed purchase orders
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
