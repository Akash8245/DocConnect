import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { HelmetProvider } from 'react-helmet-async';
import SuspenseFallback from './components/SuspenseFallback';
import Layout from './components/Layout';
import "./App.css";

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
const VideoCall = lazy(() => import('./pages/VideoCall'));
const AIHealthAssistant = lazy(() => import('./pages/AIHealthAssistant'));

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

// Video call route wrapper to handle missing ID
const VideoCallWrapper = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  
  if (!appointmentId) {
    // Redirect to the appropriate appointments page if no ID is provided
    return <Navigate to={`/${user?.role}/appointments`} replace />;
  }
  
  return <VideoCall />;
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
          
          {/* AI Health Assistant route - accessible to all users */}
          <Route path="ai-health-assistant" element={<AIHealthAssistant />} />
          
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
          
          {/* Video call route */}
          <Route path="video-call/:appointmentId" element={
            <ProtectedRoute>
              <VideoCallWrapper />
            </ProtectedRoute>
          } />
          
          {/* Catch-all route for video call without ID */}
          <Route path="video-call" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
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
