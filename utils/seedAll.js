const { exec } = require('child_process');
const path = require('path');

console.log('Starting seed process for MRF tenant...');

// Function to run a script and wait for it to complete
const runScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    console.log(`\n\n========= Running ${path.basename(scriptPath)} =========`);
    
    const child = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
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
const runAllScripts = async () => {  try {
    // Step 1: Run permissions and roles seed
    await runScript(path.join(__dirname, 'seedPermissionsAndRoles.js'));
    
    // Step 2: Run MRF tenant and users seed
    await runScript(path.join(__dirname, 'seedMRFData.js'));
    
    // Step 3: Run MRF categories seed
    await runScript(path.join(__dirname, 'seedMRFCategories.js'));
    
    // Step 4: Run MRF products seed
    await runScript(path.join(__dirname, 'seedMRFProducts.js'));
    
    // Step 5: Run MRF suppliers seed
    await runScript(path.join(__dirname, 'seedMRFSuppliers.js'));
    
    console.log('\n\n========= All seed scripts completed successfully! =========');
    console.log('\nMRF tenant is now set up with:');
    console.log('- System permissions and roles');
    console.log('- MRF tenant with admin user');
    console.log('- 5 users with different roles');
    console.log('- Cost centers, departments, and locations');    console.log('- 10 categories for procurement');
    console.log('- 50+ products across all categories');
    console.log('- 10 suppliers with user accounts');
    console.log('\nYou can now log in with the following credentials:');
    console.log('Email: admin@mrf.com');
    console.log('Password: Password@123');
    
  } catch (error) {
    console.error('An error occurred during the seeding process:', error);
  }
};

// Execute all scripts
runAllScripts();
