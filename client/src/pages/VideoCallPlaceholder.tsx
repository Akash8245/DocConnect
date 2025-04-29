import { Link } from 'react-router-dom';

const VideoCallPlaceholder = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Not Available</h2>
        <p className="text-gray-600 mb-6">
          This feature is currently not available.
        </p>
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPlaceholder; 