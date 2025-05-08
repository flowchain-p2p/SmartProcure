/**
 * @swagger
 * tags:
 *   name: RFQs
 *   description: Request For Quotation management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RFQItem:
 *       type: object
 *       required:
 *         - description
 *         - quantity
 *         - unitOfMeasure
 *       properties:
 *         description:
 *           type: string
 *           description: Item description
 *         quantity:
 *           type: number
 *           description: Item quantity
 *         unitOfMeasure:
 *           type: string
 *           description: Unit of measurement
 *         estimatedUnitPrice:
 *           type: number
 *           description: Estimated price per unit
 *         estimatedTotalPrice:
 *           type: number
 *           description: Estimated total price
 *         requisitionItemId:
 *           type: string
 *           description: Reference to requisition item
 *         notes:
 *           type: string
 *           description: Additional notes for the item
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: File paths or URLs to attachments
 *
 *     VendorQuoteItemQuote:
 *       type: object
 *       required:
 *         - rfqItemId
 *         - unitPrice
 *         - totalPrice
 *       properties:
 *         rfqItemId:
 *           type: string
 *           description: Reference to the RFQ item
 *         unitPrice:
 *           type: number
 *           description: Quoted price per unit
 *         totalPrice:
 *           type: number
 *           description: Quoted total price
 *         alternativeDescription:
 *           type: string
 *           description: Vendor's alternative item description if different
 *         notes:
 *           type: string
 *           description: Additional notes for this quote item
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: File paths or URLs to attachments specific to this item
 *
 *     VendorQuote:
 *       type: object
 *       required:
 *         - vendorId
 *       properties:
 *         vendorId:
 *           type: string
 *           description: Reference to the vendor
 *         invitedAt:
 *           type: string
 *           format: date-time
 *           description: When the vendor was invited
 *           readOnly: true
 *         responsedAt:
 *           type: string
 *           format: date-time
 *           description: When the vendor responded
 *           readOnly: true
 *         quoteSubmittedAt:
 *           type: string
 *           format: date-time
 *           description: When the quote was submitted
 *           readOnly: true
 *         status:
 *           type: string
 *           enum: [Invited, Declined, Responded, Selected]
 *           default: Invited
 *           description: Status of this vendor's quote
 *         totalQuoteAmount:
 *           type: number
 *           description: Total quoted amount from this vendor
 *         currency:
 *           type: string
 *           default: INR
 *           description: Currency code
 *         deliveryDate:
 *           type: string
 *           format: date
 *           description: Vendor's promised delivery date
 *         notes:
 *           type: string
 *           description: Additional notes from the vendor
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: File paths or URLs to attachments from the vendor
 *         itemQuotes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VendorQuoteItemQuote'
 *           description: Vendor's quotes for individual items
 *
 *     RFQ:
 *       type: object
 *       required:
 *         - title
 *         - requisitionId
 *         - submissionDeadline
 *         - items
 *       properties:
 *         rfqNumber:
 *           type: string
 *           description: Unique RFQ number (auto-generated)
 *           readOnly: true
 *         title:
 *           type: string
 *           description: RFQ title
 *         description:
 *           type: string
 *           description: RFQ description
 *         status:
 *           type: string
 *           enum: [Draft, Issued, Delivered, Completed, Cancelled]
 *           default: Draft
 *           description: Current status of the RFQ
 *         requisitionId:
 *           type: string
 *           description: Reference to originating requisition
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RFQItem'
 *           description: Items requested in this RFQ
 *         vendorQuotes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VendorQuote'
 *           description: Quotes received from vendors
 *         awardedVendorId:
 *           type: string
 *           description: Reference to the vendor who was awarded this RFQ
 *           readOnly: true
 *         awardedAt:
 *           type: string
 *           format: date-time
 *           description: When the RFQ was awarded
 *           readOnly: true
 *         awardedBy:
 *           type: string
 *           description: User who awarded this RFQ
 *           readOnly: true
 *         purchaseOrderId:
 *           type: string
 *           description: Reference to the purchase order created from this RFQ
 *           readOnly: true
 *         submissionDeadline:
 *           type: string
 *           format: date
 *           description: Deadline for vendor submissions
 *         estimatedTotalAmount:
 *           type: number
 *           description: Estimated total amount of the RFQ
 *         currency:
 *           type: string
 *           default: INR
 *           description: Currency code
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
 *           description: User who created the RFQ
 *           readOnly: true
 *         openedBy:
 *           type: string
 *           description: User who opened/issued the RFQ
 *           readOnly: true
 *         openedAt:
 *           type: string
 *           format: date-time
 *           description: When the RFQ was opened/issued
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
 * /api/v1/rfqs:
 *   get:
 *     summary: Get all RFQs
 *     tags: [RFQs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Issued, Delivered, Completed, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: requisitionId
 *         schema:
 *           type: string
 *         description: Filter by requisition ID
 *       - in: query
 *         name: awardedVendorId
 *         schema:
 *           type: string
 *         description: Filter by awarded vendor ID
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Filter by vendor ID (gets RFQs where this vendor is invited)
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
 *         description: Search in rfqNumber, title, and description
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
 *         description: A list of RFQs
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
 *                     $ref: '#/components/schemas/RFQ'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new RFQ
 *     tags: [RFQs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RFQ'
 *     responses:
 *       201:
 *         description: RFQ created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Requisition not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/rfqs/{id}:
 *   get:
 *     summary: Get RFQ by ID
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *     responses:
 *       200:
 *         description: RFQ details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update RFQ
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RFQ'
 *     responses:
 *       200:
 *         description: RFQ updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete RFQ
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *     responses:
 *       200:
 *         description: RFQ deleted successfully
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
 *         description: Cannot delete non-draft RFQ
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/rfqs/{id}/issue:
 *   patch:
 *     summary: Issue an RFQ (change status to Issued)
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *     responses:
 *       200:
 *         description: RFQ issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       400:
 *         description: Cannot issue non-draft RFQ or RFQ without vendors
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/rfqs/{id}/deliver:
 *   patch:
 *     summary: Mark an RFQ as delivered
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *     responses:
 *       200:
 *         description: RFQ marked as delivered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       400:
 *         description: Can only mark issued RFQs as delivered
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/rfqs/{id}/complete:
 *   patch:
 *     summary: Complete an RFQ
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *     responses:
 *       200:
 *         description: RFQ completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       400:
 *         description: Can only complete delivered RFQs
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/rfqs/{id}/cancel:
 *   patch:
 *     summary: Cancel an RFQ
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *     responses:
 *       200:
 *         description: RFQ cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       400:
 *         description: Cannot cancel completed RFQs
 *       404:
 *         description: RFQ not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/rfqs/{id}/vendors:
 *   post:
 *     summary: Add vendor to RFQ
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *             properties:
 *               vendorId:
 *                 type: string
 *                 description: Vendor ID to invite
 *     responses:
 *       200:
 *         description: Vendor added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       400:
 *         description: Vendor already invited
 *       404:
 *         description: RFQ or vendor not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/rfqs/{id}/vendors/{vendorId}:
 *   put:
 *     summary: Update vendor quote
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *       - in: path
 *         name: vendorId
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
 *               status:
 *                 type: string
 *                 enum: [Invited, Declined, Responded, Selected]
 *               totalQuoteAmount:
 *                 type: number
 *               currency:
 *                 type: string
 *               deliveryDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               itemQuotes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/VendorQuoteItemQuote'
 *     responses:
 *       200:
 *         description: Vendor quote updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VendorQuote'
 *       404:
 *         description: RFQ or vendor quote not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/rfqs/{id}/award/{vendorId}:
 *   patch:
 *     summary: Award RFQ to a vendor
 *     tags: [RFQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RFQ ID
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID to award the RFQ to
 *     responses:
 *       200:
 *         description: RFQ awarded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RFQ'
 *       400:
 *         description: Only delivered RFQs can be awarded
 *       404:
 *         description: RFQ or vendor not found
 *       500:
 *         description: Server error
 */
