import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { 
  CalendarIcon, 
  VideoCameraIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Patient {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface AppointmentRequest {
  _id: string;
  patient: Patient;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

const DoctorDashboard = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const token = localStorage.getItem('token');
  
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setError('Authentication token not found. Please login again.');
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
        
        console.log('Fetching doctor dashboard data...');
        
        try {
          // Fetch pending appointment requests
          console.log('Fetching pending appointments...');
          const pendingRes = await axios.get('/api/appointments?status=pending', config);
          console.log('Pending appointments response:', pendingRes.data);
          setAppointmentRequests(pendingRes.data);
        } catch (pendingErr) {
          console.error('Error fetching pending appointments:', pendingErr);
          // Don't set error here, try to load other data
        }
        
        try {
          // Fetch upcoming confirmed appointments
          console.log('Fetching confirmed appointments...');
          const upcomingRes = await axios.get('/api/appointments?status=confirmed', config);
          console.log('Confirmed appointments response:', upcomingRes.data);
          
          if (Array.isArray(upcomingRes.data)) {
            setUpcomingAppointments(upcomingRes.data);
          
            // Filter for today's appointments
            const today = new Date().toISOString().split('T')[0];
            const todayAppts = upcomingRes.data.filter((apt: Appointment) => 
              new Date(apt.date).toISOString().split('T')[0] === today
            );
            setTodayAppointments(todayAppts);
            
            // Get the next appointment chronologically
            if (upcomingRes.data.length > 0) {
              // Sort by date and time
              const sortedAppointments = [...upcomingRes.data].sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.startTime}`);
                const dateB = new Date(`${b.date}T${b.startTime}`);
                return dateA.getTime() - dateB.getTime();
              });
              
              // Get the first upcoming appointment (chronologically next)
              setNextAppointment(sortedAppointments[0]);
            } else {
              setNextAppointment(null);
            }
          } else {
            console.warn('Unexpected response format for appointments:', upcomingRes.data);
            setUpcomingAppointments([]);
            setTodayAppointments([]);
          }
        } catch (upcomingErr) {
          console.error('Error fetching confirmed appointments:', upcomingErr);
          // Create empty arrays if this fails
          setUpcomingAppointments([]);
          setTodayAppointments([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

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

  // Handle appointment actions
  const handleAcceptRequest = async (requestId: string) => {
    try {
      if (!token) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Make API call to accept appointment
      await axios.put(`/api/appointments/${requestId}/accept`, {}, config);
      
      // Update local state
      setAppointmentRequests(prevRequests => 
        prevRequests.filter(req => req._id !== requestId)
      );
      
      // Refresh appointments
      const upcomingRes = await axios.get('/api/appointments?status=confirmed', config);
      setUpcomingAppointments(upcomingRes.data);
      
      // Update today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = upcomingRes.data.filter((apt: Appointment) => 
        new Date(apt.date).toISOString().split('T')[0] === today
      );
      setTodayAppointments(todayAppts);
      
      // Update next appointment
      if (upcomingRes.data.length > 0) {
        const sortedAppointments = [...upcomingRes.data].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.startTime}`);
          const dateB = new Date(`${b.date}T${b.startTime}`);
          return dateA.getTime() - dateB.getTime();
        });
        setNextAppointment(sortedAppointments[0]);
      }
      
    } catch (err: any) {
      console.error('Error accepting appointment request:', err);
      alert('Failed to accept appointment. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      if (!token) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Make API call to decline appointment
      await axios.put(`/api/appointments/${requestId}/decline`, {}, config);
      
      // Update local state
      setAppointmentRequests(prevRequests => 
        prevRequests.filter(req => req._id !== requestId)
      );
      
    } catch (err: any) {
      console.error('Error declining appointment request:', err);
      alert('Failed to decline appointment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show a fallback message if data couldn't be loaded but the request didn't completely fail
  const noAppointmentsMessage = (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
      <p className="text-gray-500">No appointments found.</p>
      <p className="text-gray-400 text-sm mt-2">
        Set your availability and patients will be able to book appointments with you.
      </p>
      <Link to="/doctor/availability" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
        Set your availability →
      </Link>
    </div>
  );

  if (error) {
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
          <div className="mt-4">
            <Link to="/doctor/availability" className="text-blue-600 hover:text-blue-800">
              Try setting your availability instead →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-semibold text-secondary-900">
          Welcome, Dr. {user?.name}
        </h1>
        
        {/* Dashboard summary */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-secondary-500 truncate">
                      Today's Appointments
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-secondary-900">
                        {todayAppointments.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-secondary-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  to="/doctor/appointments"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <VideoCameraIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-secondary-500 truncate">
                      Next Video Consultation
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-secondary-900">
                        {nextAppointment ? (
                          `${formatTime(nextAppointment.startTime)} with ${nextAppointment.patient.name}`
                        ) : (
                          'No upcoming calls'
                        )}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-secondary-50 px-5 py-3">
              <div className="text-sm">
                {nextAppointment && (
                  <Link
                    to={`/video-call/${nextAppointment._id}`}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Join when ready
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-secondary-500 truncate">
                      Pending Requests
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-secondary-900">
                        {appointmentRequests.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-secondary-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  to="/doctor/availability"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Manage availability
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment requests */}
        {appointmentRequests.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-medium text-secondary-900">Appointment Requests</h2>
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-secondary-200">
                {appointmentRequests.map((request) => (
                  <li key={request._id}>
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img 
                              className="h-12 w-12 rounded-full object-cover"
                              src={request.patient.profilePicture || `https://ui-avatars.com/api/?name=${request.patient.name}`} 
                              alt={request.patient.name} 
                            />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-secondary-900">{request.patient.name}</h3>
                            <p className="text-sm text-secondary-500">{formatDate(request.date)} • {formatTime(request.startTime)} - {formatTime(request.endTime)}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptRequest(request._id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request._id)}
                            className="inline-flex items-center px-3 py-2 border border-secondary-300 text-sm leading-4 font-medium rounded-md shadow-sm text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <XCircleIcon className="mr-1.5 h-4 w-4" />
                            Decline
                          </button>
                        </div>
                      </div>
                      {request.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-secondary-500 italic">"{request.notes}"</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Upcoming appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-medium text-secondary-900">Upcoming Appointments</h2>
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-secondary-200">
                {upcomingAppointments.map((appointment) => (
                  <li key={appointment._id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover"
                              src={appointment.patient.profilePicture || `https://ui-avatars.com/api/?name=${appointment.patient.name}`} 
                              alt={appointment.patient.name} 
                            />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-md font-medium text-secondary-900">{appointment.patient.name}</h3>
                            <p className="text-sm text-secondary-500">{formatDate(appointment.date)}</p>
                          </div>
                        </div>
                        <div>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </span>
                          <Link
                            to={`/video-call/${appointment._id}`}
                            className="ml-2 text-primary-600 hover:text-primary-900 text-sm font-medium"
                          >
                            Join Call
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Empty state */}
        {appointmentRequests.length === 0 && upcomingAppointments.length === 0 && (
          <div className="mt-10 text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-secondary-900">No appointments yet</h3>
            <p className="mt-2 text-secondary-500">
              You don't have any pending appointment requests or upcoming appointments.
            </p>
            <div className="mt-6">
              <Link
                to="/doctor/availability"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ClockIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Set Your Availability
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard; 