import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="max-w-lg w-full px-4 py-8 bg-white rounded-lg shadow-md text-center">
        <div className="flex justify-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-primary-600" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-secondary-900">404 - Page Not Found</h1>
        <p className="mt-2 text-secondary-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 space-y-4">
          <Link
            to="/"
            className="block w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to Home
          </Link>
          <Link
            to="/patient/dashboard"
            className="block w-full px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-300 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Patient Dashboard
          </Link>
          <Link
            to="/doctor/dashboard"
            className="block w-full px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-300 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Doctor Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 