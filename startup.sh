#!/bin/bash
# Azure startup script for Next.js
echo "Starting Seva Center application..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci --production
fi

# Start the application
echo "Starting the application..."
npm start