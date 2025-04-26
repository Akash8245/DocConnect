#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const isWindows = process.platform === 'win32';
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

// Function to check if directory exists
const dirExists = (dir) => {
  try {
    return fs.statSync(dir).isDirectory();
  } catch (err) {
    return false;
  }
};

// Function to install dependencies
const installDeps = (dir, name) => {
  return new Promise((resolve, reject) => {
    console.log(`Installing ${name} dependencies...`);
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';
    const install = spawn(npmCmd, ['install'], { cwd: dir, stdio: 'inherit' });

    install.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Failed to install ${name} dependencies with code ${code}`));
        return;
      }
      console.log(`${name} dependencies installed successfully.`);
      resolve();
    });
  });
};

// Function to start the server
const startServer = () => {
  console.log('Starting server...');
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const server = spawn(npmCmd, ['run', 'dev'], { cwd: serverDir, stdio: 'inherit' });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  return server;
};

// Function to start the client
const startClient = () => {
  console.log('Starting client...');
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const client = spawn(npmCmd, ['run', 'dev'], { cwd: clientDir, stdio: 'inherit' });

  client.on('error', (err) => {
    console.error('Failed to start client:', err);
    process.exit(1);
  });

  return client;
};

// Main function
const main = async () => {
  console.log('Starting DocConnect application...');

  // Check if server and client directories exist
  if (!dirExists(serverDir)) {
    console.error('Server directory not found:', serverDir);
    process.exit(1);
  }

  if (!dirExists(clientDir)) {
    console.error('Client directory not found:', clientDir);
    process.exit(1);
  }

  // Install dependencies if needed
  try {
    if (!dirExists(path.join(serverDir, 'node_modules'))) {
      await installDeps(serverDir, 'server');
    }

    if (!dirExists(path.join(clientDir, 'node_modules'))) {
      await installDeps(clientDir, 'client');
    }
  } catch (err) {
    console.error('Error installing dependencies:', err.message);
    process.exit(1);
  }

  // Start server and client
  const server = startServer();
  
  // Wait a few seconds for server to start
  console.log('Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const client = startClient();

  // Handle process termination
  const cleanup = () => {
    console.log('\nStopping DocConnect application...');
    if (client && !client.killed) {
      client.kill();
    }
    if (server && !server.killed) {
      server.kill();
    }
    process.exit(0);
  };

  // Handle keyboard interrupt
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  if (isWindows) {
    readline.createInterface({
      input: process.stdin,
      output: process.stdout
    }).on('SIGINT', () => {
      process.emit('SIGINT');
    });
  }
};

// Run the application
main().catch(err => {
  console.error('Error starting DocConnect:', err);
  process.exit(1);
}); 