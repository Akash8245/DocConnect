import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { HelmetProvider } from 'react-helmet-async';
import SuspenseFallback from './components/SuspenseFallback';
import Layout from './components/Layout';
import "./App.css";
import VideoCallPlaceholder from './pages/VideoCallPlaceholder';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const PatientDashboard = lazy(() => import('./pages/patient/Dashboard'));
const DoctorDashboard = lazy(() => import('./pages/doctor/Dashboard'));
const PatientAppointments = lazy(() => import('./pages/patient/Appointments'));
const DoctorAppointments = lazy(() => import('./pages/doctor/Appointments'));
const PatientProfile = lazy(() => import('./pages/patient/Profile'));
const DoctorProfile = lazy(() => import('./pages/doctor/Profile'));
const DoctorAvailability = lazy(() => import('./pages/doctor/Availability'));
const BookAppointmentPage = lazy(() => import('./pages/patient/BookAppointment'));
const AIHealthAssistant = lazy(() => import('./pages/AIHealthAssistant'));

// 👉 Lazy load your VideoCall page
const VideoCall = lazy(() => import('./pages/VideoCall'));  // <<---- Added this line

// Component to redirect to the appropriate dashboard based on user role
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  switch(user?.role) {
    case 'patient':
      return <Navigate to="/patient/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'admin':
      return <Navigate to="/login" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Protected route component
const ProtectedRoute = ({ children, requiredRole }: { children: JSX.Element, requiredRole?: string }) => {
  const { user, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return <SuspenseFallback />;
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Public route component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, initialized } = useAuth();
  
  if (!initialized) {
    return <SuspenseFallback />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main router component
const AppRouter = () => {
  const { initialized } = useAuth();
  
  if (!initialized) {
    return <SuspenseFallback />;
  }
  
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />
          
          {/* Dashboard redirect */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          
          {/* Patient routes */}
          <Route path="patient/dashboard" element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="patient/appointments" element={
            <ProtectedRoute requiredRole="patient">
              <PatientAppointments />
            </ProtectedRoute>
          } />
          <Route path="patient/booking" element={
            <ProtectedRoute requiredRole="patient">
              <BookAppointmentPage />
            </ProtectedRoute>
          } />
          <Route path="patient/profile" element={
            <ProtectedRoute requiredRole="patient">
              <PatientProfile />
            </ProtectedRoute>
          } />

          {/* Doctor routes */}
          <Route path="doctor/dashboard" element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          <Route path="doctor/appointments" element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorAppointments />
            </ProtectedRoute>
          } />
          <Route path="doctor/profile" element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorProfile />
            </ProtectedRoute>
          } />
          <Route path="doctor/availability" element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorAvailability />
            </ProtectedRoute>
          } />

          {/* AI Health Assistant route */}
          <Route path="ai-health-assistant" element={<AIHealthAssistant />} />

          {/* Video Call Placeholder */}
          <Route path="video-call" element={<VideoCallPlaceholder />} />

          {/* 👉 Real Video Call Route (New) */}
          <Route path="vc" element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          } />
          
        </Route>
      </Routes>
    </Suspense>
  );
};

// Main App component
const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppRouter />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
