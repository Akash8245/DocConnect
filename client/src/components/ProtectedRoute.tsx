import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  role?: 'patient' | 'doctor' | 'any';
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  role = 'any',
  children 
}) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (role !== 'any' && user.role !== role) {
    // Redirect to the appropriate dashboard based on user role
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // Render children or outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 