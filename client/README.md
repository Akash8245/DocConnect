# DocConnect

DocConnect is a telemedicine application that connects doctors and patients for virtual appointments through video calls.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (must be running locally or configured via environment variables)

### Running the Application

#### Option 1: Using npm

The simplest way to run the application is using npm:

```bash
# From the client directory
npm run start:app
```

This will start both the server and client applications.

#### Option 2: Using Scripts

##### On macOS/Linux:

```bash
# Make sure the script is executable (first time only)
chmod +x start.sh

# Run the application
./start.sh
```

##### On Windows:

```bash
# Run the application
start.bat
```

#### Option 3: Manual Start

If you prefer to start the server and client manually:

1. Start the server:
   ```bash
   cd server
   npm install (first time only)
   npm run dev
   ```

2. Start the client:
   ```bash
   cd client
   npm install (first time only)
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/docconnect
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

## Features

- User authentication for doctors and patients
- Video consultations with WebRTC
- Appointment scheduling
- Real-time notifications

## Technologies Used

- **Frontend**: React, TypeScript, TailwindCSS, Socket.io-client, Simple-peer
- **Backend**: Node.js, Express, Socket.io, MongoDB
