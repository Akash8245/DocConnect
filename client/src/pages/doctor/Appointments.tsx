import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { 
  CalendarIcon,
  VideoCameraIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Patient {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

const Appointments = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const token = localStorage.getItem('token');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showDemoData, setShowDemoData] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }
      
      if (!user || !user.id) {
        setError('User information is missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        // Set up axios headers
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        console.log('Fetching appointments data...');
        
        try {
          // Fetch all appointments
          const response = await axios.get('/api/appointments', config);
          
          console.log('Appointments response:', response.data);
          
          if (Array.isArray(response.data) && response.data.length > 0) {
            setAppointments(response.data);
            setFilteredAppointments(response.data);
          } else if (Array.isArray(response.data) && response.data.length === 0) {
            console.log('No appointments found in response');
            setAppointments([]);
            setFilteredAppointments([]);
          } else {
            console.warn('Unexpected response format for appointments:', response.data);
            
            // Use demo data for development/fallback
            setShowDemoData(true);
            
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const demoAppointments: Appointment[] = [
              {
                _id: 'demo-1',
                patient: {
                  _id: 'patient-1',
                  name: 'John Demo',
                  email: 'john@example.com',
                  profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg'
                },
                date: today.toISOString().split('T')[0],
                startTime: '10:00',
                endTime: '10:30',
                status: 'confirmed',
                notes: 'Regular checkup'
              },
              {
                _id: 'demo-2',
                patient: {
                  _id: 'patient-2',
                  name: 'Alice Demo',
                  email: 'alice@example.com',
                  profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg'
                },
                date: tomorrow.toISOString().split('T')[0],
                startTime: '14:00',
                endTime: '14:30',
                status: 'pending',
                notes: 'Follow-up appointment'
              }
            ];
            
            setAppointments(demoAppointments);
            setFilteredAppointments(demoAppointments);
          }
        } catch (apiErr: any) {
          console.error('Error fetching appointments from API:', apiErr);
          
          if (apiErr.response?.status === 401) {
            setError('Your session has expired. Please login again.');
          } else {
            setError('Failed to load appointments. The server may be unavailable.');
            
            // Provide demo data even on error
            setShowDemoData(true);
            
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const demoAppointments: Appointment[] = [
              {
                _id: 'demo-1',
                patient: {
                  _id: 'patient-1',
                  name: 'John Demo',
                  email: 'john@example.com',
                  profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg'
                },
                date: today.toISOString().split('T')[0],
                startTime: '10:00',
                endTime: '10:30',
                status: 'confirmed',
                notes: 'Regular checkup'
              },
              {
                _id: 'demo-2',
                patient: {
                  _id: 'patient-2',
                  name: 'Alice Demo',
                  email: 'alice@example.com',
                  profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg'
                },
                date: tomorrow.toISOString().split('T')[0],
                startTime: '14:00',
                endTime: '14:30',
                status: 'pending',
                notes: 'Follow-up appointment'
              }
            ];
            
            setAppointments(demoAppointments);
            setFilteredAppointments(demoAppointments);
          }
        }
      } catch (err: any) {
        console.error('Error in appointment fetch process:', err);
        setError('Failed to load appointments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [token, user]);

  useEffect(() => {
    // Apply filter
    if (filter === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(appointments.filter(app => app.status === filter));
    }
  }, [filter, appointments]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (time: string) => {
    // Convert 24-hour time format to 12-hour format with AM/PM
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleStatusChange = async (appointmentId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    if (!token) {
      alert('Authentication token not found. Please login again.');
      return;
    }
    
    // Don't allow changes to demo data
    if (appointmentId.startsWith('demo-')) {
      alert('This is demo data. Status changes are not saved in demo mode.');
      
      // Update local state anyway to demonstrate the UI flow
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app._id === appointmentId 
            ? { ...app, status: newStatus } 
            : app
        )
      );
      return;
    }
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log(`Updating appointment ${appointmentId} status to ${newStatus}`);
      
      // Make API call to update appointment status
      await axios.put(`/api/appointments/${appointmentId}/status`, { status: newStatus }, config);
      
      // Update local state
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app._id === appointmentId 
            ? { ...app, status: newStatus } 
            : app
        )
      );
      
    } catch (err: any) {
      console.error(`Error changing appointment status to ${newStatus}:`, err);
      alert(`Failed to update appointment status. Please try again.`);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !showDemoData) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-white shadow overflow-hidden rounded-md p-6 text-center">
            <p className="text-secondary-500">No appointments could be loaded.</p>
            <div className="mt-4">
              <Link
                to="/doctor/availability"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ClockIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Set Your Availability
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-secondary-900">
          Manage Your Appointments
        </h1>
        
        {showDemoData && (
          <div className="mt-4 bg-yellow-50 p-3 rounded-md">
            <p className="text-sm text-yellow-700">
              Note: You're currently seeing demo data. Any changes you make will not be saved to the server.
            </p>
          </div>
        )}
        
        {/* Filter controls */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all' 
                ? 'bg-primary-100 text-primary-700 border border-primary-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'pending' 
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'confirmed' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'completed' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-white text-secondary-700 border border-secondary-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
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
          {filteredAppointments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-secondary-500">No appointments found for the selected filter.</p>
              {filter === 'all' && (
                <div className="mt-4">
                  <Link
                    to="/doctor/availability"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ClockIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Set Your Availability
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-secondary-200">
              {filteredAppointments.map((appointment) => (
                <li key={appointment._id} className="p-6 hover:bg-secondary-50">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="flex-shrink-0 mr-4">
                        <img 
                          src={appointment.patient.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patient.name)}`} 
                          alt={appointment.patient.name}
                          className="h-10 w-10 rounded-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-secondary-500 mr-1" />
                          <p className="text-sm font-medium text-secondary-800">{appointment.patient.name}</p>
                        </div>
                        <div className="flex items-center mt-1">
                          <CalendarIcon className="h-5 w-5 text-secondary-500 mr-1" />
                          <p className="text-sm text-secondary-500">{formatDate(appointment.date)}</p>
                        </div>
                        <div className="flex items-center mt-1">
                          <ClockIcon className="h-5 w-5 text-secondary-500 mr-1" />
                          <p className="text-sm text-secondary-500">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</p>
                        </div>
                        {appointment.notes && (
                          <div className="flex items-start mt-1">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-secondary-500 mr-1 mt-0.5" />
                            <p className="text-sm text-secondary-500 italic">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      
                      {/* Action buttons based on appointment status */}
                      <div className="mt-3 flex space-x-2">
                        {appointment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              <CheckCircleIcon className="mr-1 h-4 w-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                              className="inline-flex items-center px-2.5 py-1.5 border border-secondary-300 text-xs font-medium rounded shadow-sm text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              <XCircleIcon className="mr-1 h-4 w-4" />
                              Decline
                            </button>
                          </>
                        )}
                        
                        {appointment.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(appointment._id, 'completed')}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircleIcon className="mr-1 h-4 w-4" />
                              Complete
                            </button>
                            <Link
                              to={`/video-call/${appointment._id}`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <VideoCameraIcon className="mr-1 h-4 w-4" />
                              Join Call
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments; 