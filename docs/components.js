/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         name:
 *           type: string
 *           description: Organization name
 *         slug:
 *           type: string
 *           description: URL-friendly unique identifier
 *         domains:
 *           type: array
 *           items:
 *             type: string
 *           description: Email domains associated with this tenant
 *         isActive:
 *           type: boolean
 *           description: Whether tenant is active
 *         logo:
 *           type: string
 *           description: Logo image URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Tenant creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Tenant last update timestamp
 *     
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - tenantId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           description: Hashed password
 *         tenantId:
 *           type: string
 *           description: Reference to tenant
 *         role:
 *           type: string
 *           enum: [user, admin, superadmin]
 *         locations:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of location IDs
 *         defaultLocation:
 *           type: string
 *           description: Default location ID
 *         isActive:
 *           type: boolean
 *           description: Whether user is active
 * 
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: Not authorized to access this route
 */

// This file contains Swagger component definitions
// No actual code, just JSDoc comments for Swagger
