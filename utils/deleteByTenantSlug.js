const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import all relevant models
const ApprovalInstance = require('../models/ApprovalInstance');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const Category = require('../models/Category');
const CostCenter = require('../models/CostCenter');
const Department = require('../models/Department');
const Location = require('../models/Location');
const Permission = require('../models/Permission');
const Product = require('../models/Product');
const Requisition = require('../models/Requisition');
const RequisitionItem = require('../models/RequisitionItem');
const Role = require('../models/Role');
const SupplierInvite = require('../models/SupplierInvite');
const Tenant = require('../models/Tenant');
const UnitOfMeasure = require('../models/UnitOfMeasure');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const VendorCategory = require('../models/VendorCategory');
const path = require('path');

// Load environment variables with correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MongoDB Connection string
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

/**
 * Delete all documents related to a specific tenant by slug
 * @param {String} tenantSlug - Slug of the tenant to delete data for
 */
const deleteByTenantSlug = async (tenantSlug) => {
  try {
    // Connect to database
    await connectDB();

    console.log(`Starting data deletion for tenant with slug: ${tenantSlug}`);

    // Step 1: Find the tenant by slug
    const tenant = await Tenant.findOne({ slug: tenantSlug });
    
    if (!tenant) {
      console.error(`Tenant with slug "${tenantSlug}" not found`);
      process.exit(1);
    }
    
    const tenantId = tenant._id;
    console.log(`Found tenant: ${tenant.name} (ID: ${tenantId})`);
    
    // Step 2: Delete data from all collections related to this tenant
    console.log('Deleting tenant data from all collections...');

    // Create an array of deletion promises to track progress
    const deletionResults = [];
    
    // Delete User documents
    const usersResult = await User.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Users', count: usersResult.deletedCount });
    
    // Delete Product documents
    const productsResult = await Product.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Products', count: productsResult.deletedCount });
    
    // Delete Category documents
    const categoriesResult = await Category.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Categories', count: categoriesResult.deletedCount });
    
    // Delete Location documents
    const locationsResult = await Location.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Locations', count: locationsResult.deletedCount });
    
    // Delete Department documents
    const departmentsResult = await Department.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Departments', count: departmentsResult.deletedCount });
    
    // Delete CostCenter documents
    const costCentersResult = await CostCenter.deleteMany({ tenantId });
    deletionResults.push({ collection: 'CostCenters', count: costCentersResult.deletedCount });
    
    // Delete UnitOfMeasure documents
    const uomsResult = await UnitOfMeasure.deleteMany({ tenantId });
    deletionResults.push({ collection: 'UnitOfMeasures', count: uomsResult.deletedCount });
    
    // Delete Vendor documents
    const vendorsResult = await Vendor.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Vendors', count: vendorsResult.deletedCount });
    
    // Delete Role documents
    const rolesResult = await Role.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Roles', count: rolesResult.deletedCount });
    
    // Delete SupplierInvite documents
    const supplierInvitesResult = await SupplierInvite.deleteMany({ tenantId });
    deletionResults.push({ collection: 'SupplierInvites', count: supplierInvitesResult.deletedCount });
    
    // Delete ApprovalWorkflow documents
    const workflowsResult = await ApprovalWorkflow.deleteMany({ tenantId });
    deletionResults.push({ collection: 'ApprovalWorkflows', count: workflowsResult.deletedCount });

    // Delete RequisitionItem documents
    const requisitionItemsResult = await RequisitionItem.deleteMany({ tenantId });
    deletionResults.push({ collection: 'RequisitionItems', count: requisitionItemsResult.deletedCount });
      // Delete Requisition documents
    const requisitionsResult = await Requisition.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Requisitions', count: requisitionsResult.deletedCount });
    
    // Delete ApprovalInstance documents
    const approvalInstancesResult = await ApprovalInstance.deleteMany({ tenantId });
    deletionResults.push({ collection: 'ApprovalInstances', count: approvalInstancesResult.deletedCount });
    
    // Delete Permission documents
    const permissionsResult = await Permission.deleteMany({ tenantId });
    deletionResults.push({ collection: 'Permissions', count: permissionsResult.deletedCount });
    
    // Delete VendorCategory documents
    const vendorCategoriesResult = await VendorCategory.deleteMany({ tenantId });
    deletionResults.push({ collection: 'VendorCategories', count: vendorCategoriesResult.deletedCount });    // Step 3: Delete the tenant itself
    await Tenant.deleteOne({ _id: tenantId });
    const tenantDeleted = true;

    // Print deletion summary
    console.log('\n=== Deletion Summary ===');
    deletionResults.forEach(result => {
      console.log(`- ${result.collection}: ${result.count} document(s) deleted`);
    });
      console.log(`- Tenant "${tenant.name}" deleted`);
    
    console.log('========================\n');
    
    console.log('Data deletion completed successfully');

  } catch (error) {
    console.error('Error deleting tenant data:', error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the script if called directly
if (require.main === module) {
  // Get tenant slug from command line arguments
  const tenantSlug = process.argv[2];
    if (!tenantSlug) {
    console.error('Please provide a tenant slug as argument');
    console.log('Usage: node deleteByTenantSlug.js <tenantSlug>');
    console.log('Example: node deleteByTenantSlug.js mrf');
    console.log('This will delete all data related to the tenant, including the tenant itself');
    process.exit(1);
  }
  
  deleteByTenantSlug(tenantSlug);
}

// Export for use in other scripts
module.exports = deleteByTenantSlug;
