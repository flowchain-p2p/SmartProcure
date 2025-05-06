# Run the migration script to set default locations for users
Write-Host "Setting default locations for users..." -ForegroundColor Yellow
node ./migrations/setDefaultLocationsForUsers.js

Write-Host "Finished running migration. Check the console output for results." -ForegroundColor Green
