# DocConnect

DocConnect is a telemedicine application that connects doctors and patients for virtual appointments through video calls.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (must be running locally or configured via environment variables)

### Running the Application

#### Option 1: Using npm (Recommended)

The simplest way to run the application is using npm:

```bash
# From the client directory
cd client
npm run start:app
```

This will start both the server and client applications.

#### Option 2: Using Scripts

##### On macOS/Linux:

```bash
# Navigate to client directory
cd client

# Make sure the script is executable (first time only)
chmod +x start.sh

# Run the application
./start.sh
```

##### On Windows:

```bash
# Navigate to client directory
cd client

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

## Project Structure

```
DocConnect/
├── client/             # Frontend React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # React context providers
│   │   ├── pages/      # Page components
│   │   └── assets/     # Static assets
│   ├── start.sh        # macOS/Linux startup script
│   ├── start.bat       # Windows startup script
│   └── start.js        # Cross-platform Node.js startup script
│
└── server/             # Backend Node.js application
    ├── src/
    │   ├── routes/     # API routes
    │   ├── models/     # Mongoose models
    │   ├── controllers/# Route controllers
    │   └── socket.js   # WebRTC socket handlers
    └── .env            # Environment variables
```

## Technologies Used

- **Frontend**: React, TypeScript, TailwindCSS, Socket.io-client, Simple-peer
- **Backend**: Node.js, Express, Socket.io, MongoDB

## 🩺 DocConnect

A full-stack MERN application that allows patients to connect with doctors through a seamless scheduling and video consultation system. Built with MongoDB, Express.js, React, and Node.js.

## 📋 Features

- **Authentication** - Secure user authentication with JWT tokens
- **Role-Based Access** - Different dashboards and features for doctors and patients
- **Doctor Discovery** - Patients can search and filter doctors by specialization
- **Appointment Scheduling** - Patients can book appointments based on doctor's availability
- **Appointment Management** - Doctors can set availability, accept/decline requests
- **Video Consultations** - WebRTC-based video calling between doctors and patients
- **Payment Simulation** - Fake credit card processing to simulate a real booking flow
- **Responsive Design** - Beautiful blue and white themed UI that works on desktop and mobile

## 🔧 Tech Stack

- **Frontend**:
  - React.js with TypeScript
  - React Router for navigation
  - Tailwind CSS for styling
  - Heroicons for icons
  - Axios for API requests
  - WebRTC for video calls

- **Backend**:
  - Node.js and Express.js
  - MongoDB with Mongoose ORM
  - JWT for authentication
  - Socket.io for real-time communication

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas URI)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/docconnect.git
   cd docconnect
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/docconnect
   JWT_SECRET=your_secret_key
   CLIENT_URL=http://localhost:5173
   ```

4. Install client dependencies:
   ```bash
   cd ../client
   npm install
   ```

### Running the App

1. Start the MongoDB service (if using local MongoDB)

2. Start the server:
   ```bash
   cd server
   npm run dev
   ```

3. In a new terminal, start the client:
   ```bash
   cd client
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## 👨‍💻 Demo Accounts

For testing purposes, you can use these demo accounts:

- **Doctor**:
  - Email: doctor@example.com
  - Password: password

- **Patient**:
  - Email: patient@example.com
  - Password: password

## 📷 Screenshots

[Include screenshots here]

## 📱 Application Flow

### Patient Flow
1. Sign up as a patient
2. Browse available doctors
3. View doctor availability 
4. Book an appointment
5. Make mock payment
6. Join video call at the scheduled time

### Doctor Flow
1. Sign up as a doctor
2. Set availability
3. View and manage appointment requests
4. Accept/decline appointments
5. Join video calls with patients

## 🔒 Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Protected routes ensure authorized access
- Input validation prevents malformed data

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup/patient` - Register a new patient
- `POST /api/auth/signup/doctor` - Register a new doctor
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/:id/availability` - Get doctor's availability
- `POST /api/doctors/availability` - Set doctor's availability

### Appointments
- `GET /api/appointments` - Get user's appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments/book` - Book an appointment
- `PUT /api/appointments/:id/accept` - Accept an appointment
- `PUT /api/appointments/:id/decline` - Decline an appointment
- `PUT /api/appointments/:id/cancel` - Cancel an appointment
- `PUT /api/appointments/:id/complete` - Mark appointment as completed

### Video Calls
- `GET /api/video-call/:appointmentId` - Get appointment details for video call
- `POST /api/video-call/token` - Generate token for video call


## 📄 License

This project is licensed under the MIT License. 