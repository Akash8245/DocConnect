#!/bin/bash

# DocConnect Automatic Start Script for macOS
echo "Starting DocConnect application..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Warning: MongoDB doesn't appear to be running. Starting MongoDB..."
    # Try to start MongoDB using brew services
    if command -v brew &> /dev/null; then
        brew services start mongodb-community || echo "Failed to start MongoDB. Please start it manually."
    else
        echo "Cannot start MongoDB automatically. Please start it manually before proceeding."
    fi
fi

# Navigate to project root directory (assuming the script is in client folder)
cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"

# Install dependencies if node_modules doesn't exist
echo "Checking and installing dependencies..."
if [ ! -d "$ROOT_DIR/server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd "$ROOT_DIR/server"
    npm install
fi

if [ ! -d "$ROOT_DIR/client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd "$ROOT_DIR/client"
    npm install
fi

# Start the server in the background
echo "Starting server..."
cd "$ROOT_DIR/server"
npm run dev &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Start the client
echo "Starting client..."
cd "$ROOT_DIR/client"
npm run dev

# When the client is stopped, kill the server
kill $SERVER_PID

echo "DocConnect application stopped." 