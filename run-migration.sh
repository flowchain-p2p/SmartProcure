#!/bin/bash

# Run the migration script to set default locations for users
echo "Setting default locations for users..."
node ./migrations/setDefaultLocationsForUsers.js

echo "Finished running migration. Check the console output for results."
