import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { CalendarIcon, VideoCameraIcon, ClockIcon } from '@heroicons/react/24/outline';

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

const PatientDashboard = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const token = localStorage.getItem('token');
  
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Set up axios headers
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // Fetch appointments - get both pending and confirmed
        const appointmentsRes = await axios.get('/api/appointments', config);
        
        // Filter for upcoming appointments (not cancelled or completed)
        const upcoming = appointmentsRes.data.filter(
          (apt: Appointment) => apt.status === 'confirmed' || apt.status === 'pending'
        );
        
        setUpcomingAppointments(upcoming);
        
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

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
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
        </div>
      </div>
    );
  }

  // Get next upcoming confirmed appointment
  const nextAppointment = upcomingAppointments.find(apt => apt.status === 'confirmed');

  return (
    <div className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-semibold text-secondary-900">
          Welcome, {user?.name}
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
                      Upcoming Appointments
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-secondary-900">
                        {upcomingAppointments.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-secondary-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  to="/patient/appointments"
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
                        {nextAppointment 
                          ? formatDate(nextAppointment.date)
                          : 'No upcoming calls'}
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
                      Book New Appointment
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-secondary-900">
                        Find a doctor
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-secondary-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  to="/patient/booking"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Book now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming appointments */}
        {upcomingAppointments.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-lg font-medium text-secondary-900">Your Appointments</h2>
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-secondary-200">
                {upcomingAppointments.map((appointment) => (
                  <li key={appointment._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full object-cover"
                            src={appointment.doctor.profilePicture || `https://ui-avatars.com/api/?name=${appointment.doctor.name}`} 
                            alt={appointment.doctor.name} 
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-md font-medium text-secondary-900">{appointment.doctor.name}</h3>
                          <p className="text-sm text-secondary-600">{appointment.doctor.specialization}</p>
                          <p className="text-sm text-secondary-500">{formatDate(appointment.date)} • {appointment.startTime} - {appointment.endTime}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                        {appointment.status === 'confirmed' && (
                          <Link
                            to={`/video-call/${appointment._id}`}
                            className="mt-2 text-primary-600 hover:text-primary-900 text-sm font-medium"
                          >
                            Join Call
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-10 text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-secondary-900">No appointments yet</h3>
            <p className="mt-2 text-secondary-500">
              You don't have any upcoming appointments scheduled.
            </p>
            <div className="mt-6">
              <Link
                to="/patient/booking"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ClockIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Find a Doctor
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientDashboard; 