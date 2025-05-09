const { exec } = require('child_process');
const path = require('path');

// Get tenant name from command line arguments or default to 'MRF'
const tenantName = process.argv[2] || 'MRF';
const tenantSlug = tenantName.toLowerCase();

console.log(`Starting seed process for ${tenantName} tenant...`);

// Function to run a script and wait for it to complete
const runScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    console.log(`\n\n========= Running ${path.basename(scriptPath)} =========`);
    
    // Pass the tenant name as an argument to each script
    const child = exec(`node ${scriptPath} ${tenantName} ${tenantSlug}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptPath}: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Script ${scriptPath} stderr: ${stderr}`);
      }
      
      console.log(stdout);
      console.log(`\n========= ${path.basename(scriptPath)} completed successfully =========`);
      resolve();
    });
    
    // Pass script output to console in real-time
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
};

// Run scripts sequentially
const runAllScripts = async () => {  
  try {
    // Step 1: Run permissions and roles seed
    await runScript(path.join(__dirname, 'seedPermissionsAndRoles.js'));
    
    // Step 2: Run tenant and users seed
    await runScript(path.join(__dirname, 'seedTenantData.js'));
    
    // Step 3: Run categories seed
    await runScript(path.join(__dirname, 'seedTenantCategories.js'));
    
    // Step 4: Run products seed
    await runScript(path.join(__dirname, 'seedTenantProducts.js'));
    
    // Step 5: Run suppliers seed
    await runScript(path.join(__dirname, 'seedTenantSuppliers.js'));
    
    console.log('\n\n========= All seed scripts completed successfully! =========');
    console.log(`\n${tenantName} tenant is now set up with:`);
    console.log('- System permissions and roles');
    console.log(`- ${tenantName} tenant with admin user`);
    console.log('- 5 users with different roles');
    console.log('- Cost centers, departments, and locations');
    console.log('- 10 categories for procurement');
    console.log('- 50+ products across all categories');
    console.log('- 10 suppliers with user accounts');
    console.log('\nYou can now log in with the following credentials:');
    console.log(`Email: admin@${tenantSlug}.com`);
    console.log('Password: Password@123');
    
  } catch (error) {
    console.error('An error occurred during the seeding process:', error);
  }
};

// Execute all scripts
runAllScripts();
