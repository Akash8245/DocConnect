#!/bin/bash

# DocConnect Startup Script
echo "Starting DocConnect application..."

# Navigate to the client directory
cd client

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing client dependencies..."
  npm install
fi

# Run the development server
echo "Starting client server..."
npm run dev 