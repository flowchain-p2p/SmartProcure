/**
 * @swagger
 * components:
 *   schemas:
 *     Vendor:
 *       type: object
 *       required:
 *         - name
 *         - tenantId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated vendor ID
 *         name:
 *           type: string
 *           description: Vendor name
 *         code:
 *           type: string
 *           description: Vendor code (unique per tenant)
 *         contactPerson:
 *           type: string
 *           description: Primary contact person
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email
 *         phone:
 *           type: string
 *           description: Contact phone number
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             postalCode:
 *               type: string
 *         website:
 *           type: string
 *           description: Vendor website URL
 *         taxId:
 *           type: string
 *           description: Tax ID or registration number
 *         paymentTerms:
 *           type: string
 *           description: Payment terms
 *         category:
 *           type: string
 *           description: Vendor category
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Pending, Blacklisted]
 *           description: Vendor status
 *         rating:
 *           type: number
 *           description: Vendor rating (0-5)
 *         notes:
 *           type: string
 *           description: Additional notes
 *         isPreferred:
 *           type: boolean
 *           description: Whether this is a preferred vendor
 *         tenantId:
 *           type: string
 *           description: Reference to tenant
 *         createdBy:
 *           type: string
 *           description: User who created the vendor
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
