import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { useContext } from 'react';
import { 
  CalendarIcon,
  VideoCameraIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  profilePicture?: string;
}

interface Appointment {
  _id: string;
  doctor: Doctor;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

// Simple Appointments component with fixed loading issue
const Appointments = () => {
  // State variables
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Load appointments when component mounts
  useEffect(() => {
    // Always set a loading timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Loading took too long. Please try again.');
      }
    }, 10000); // 10 seconds timeout
    
    // Check for token directly from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      setError('Please log in to view your appointments');
      return () => clearTimeout(loadingTimeout);
    }
    
    // Create cancellation source for cleaning up
    const source = axios.CancelToken.source();
    
    // Fetch appointments
    const fetchData = async () => {
      try {
        // Use hardcoded URL to avoid proxy issues
        const response = await axios.get('/api/appointments', {
          headers: { Authorization: `Bearer ${token}` },
          cancelToken: source.token,
          timeout: 8000 // 8 seconds timeout
        });
        
        // Process the response
        if (response.data && Array.isArray(response.data)) {
          // Sort appointments by date
          const sortedData = [...response.data].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          setAppointments(sortedData);
          setFilteredAppointments(filter === 'all' 
            ? sortedData 
            : sortedData.filter(app => app.status === filter)
          );
        } else {
          // Handle empty or invalid data
          setAppointments([]);
          setFilteredAppointments([]);
        }
        
        // Clear the loading state
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching appointments:', err);
        
        // Handle specific error cases
        if (axios.isCancel(err)) {
          console.log('Request cancelled:', err.message);
        } else if (err.response?.status === 401) {
          // Authentication error
          setError('Your session has expired. Please login again.');
          localStorage.removeItem('token');
          
          // Don't auto-redirect - let user click login button
        } else {
          // General error
          setError(`Could not load appointments: ${err.message || 'Unknown error'}`);
        }
        
        // Clear loading state
        setLoading(false);
      }
    };
    
    // Execute the fetch
    fetchData();
    
    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout);
      source.cancel('Component unmounted');
    };
  }, [filter]);
  
  // Handle filter changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    
    // Apply filter immediately to current appointments
    if (newFilter === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(appointments.filter(app => app.status === newFilter));
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      return dateString; // Fallback to raw string if date parsing fails
    }
  };
  
  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please login again.');
      return;
    }
    
    try {
      await axios.put(`/api/appointments/${appointmentId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update both state arrays simultaneously
      const updateAppointment = (list: Appointment[]) => 
        list.map(app => app._id === appointmentId 
          ? { ...app, status: 'cancelled' } 
          : app
        );
      
      setAppointments(updateAppointment);
      setFilteredAppointments(updateAppointment);
      
      alert('Appointment cancelled successfully!');
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to cancel appointment. Please try again.');
    }
  };
  
  // Helper functions for UI
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const canCancel = (appointment: Appointment) => {
    return appointment.status === 'pending' || appointment.status === 'confirmed';
  };
  
  const canJoinCall = (appointment: Appointment) => {
    return appointment.status === 'confirmed';
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-primary-600">Loading your appointments...</p>
        <p className="mt-2 text-xs text-gray-500">This should only take a moment...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main content with dummy data as fallback if no appointments
  const displayAppointments = filteredAppointments.length ? filteredAppointments : [];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-secondary-900">
            My Appointments
          </h1>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-primary-600 hover:text-primary-800"
            aria-label="Refresh appointments"
          >
            Refresh
          </button>
        </div>
        
        {/* Filter controls */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all' 
                ? 'bg-primary-100 text-primary-700 border border-primary-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'pending' 
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange('confirmed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'confirmed' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'completed' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => handleFilterChange('cancelled')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'cancelled' 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            Cancelled
          </button>
        </div>
        
        {/* Appointments list */}
        <div className="mt-6 bg-white shadow overflow-hidden rounded-md">
          {displayAppointments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-secondary-500">No appointments found for the selected filter.</p>
              <Link
                to="/patient/booking"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Book New Appointment
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-secondary-200">
              {displayAppointments.map((appointment) => (
                <li key={appointment._id} className="p-6 hover:bg-secondary-50">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="flex-shrink-0 mr-4">
                        <img 
                          src={appointment.doctor.profilePicture || 'https://via.placeholder.com/40'} 
                          alt={appointment.doctor.name}
                          className="h-10 w-10 rounded-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-secondary-500 mr-1" />
                          <p className="text-sm font-medium text-secondary-800">{appointment.doctor.name}</p>
                        </div>
                        <div className="flex items-center mt-1">
                          <BuildingOfficeIcon className="h-5 w-5 text-secondary-500 mr-1" />
                          <p className="text-sm text-secondary-500">{appointment.doctor.specialization}</p>
                        </div>
                        <div className="flex items-center mt-1">
                          <CalendarIcon className="h-5 w-5 text-secondary-500 mr-1" />
                          <p className="text-sm text-secondary-500">{formatDate(appointment.date)}</p>
                        </div>
                        <div className="flex items-center mt-1">
                          <ClockIcon className="h-5 w-5 text-secondary-500 mr-1" />
                          <p className="text-sm text-secondary-500">
                            {appointment.startTime} - {appointment.endTime}
                          </p>
                        </div>
                        {appointment.notes && (
                          <div className="flex items-start mt-1">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-secondary-500 mr-1 mt-0.5" />
                            <p className="text-sm text-secondary-500">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col mt-4 md:mt-0 md:items-end">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      
                      <div className="mt-4 flex space-x-2">
                        {canJoinCall(appointment) && (
                          <Link
                            to={`/video-call/${appointment._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <VideoCameraIcon className="h-4 w-4 mr-1" />
                            Join Call
                          </Link>
                        )}
                        
                        {canCancel(appointment) && (
                          <button
                            onClick={() => handleCancelAppointment(appointment._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="mt-6 flex justify-center">
          <Link
            to="/patient/booking"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Book New Appointment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Appointments; 