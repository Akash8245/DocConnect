import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  MagnifyingGlassIcon, 
  CalendarIcon, 
  ClockIcon, 
  CreditCardIcon,
} from '@heroicons/react/24/outline';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  about?: string;
  profilePicture?: string;
}

interface TimeSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const specializations = [
  'All',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Urology',
];

const BookingPage = () => {
  const { doctorId } = useParams<{ doctorId?: string }>();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // State for doctor search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // State for slot selection
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateOptions, setDateOptions] = useState<string[]>([]);
  
  // State for booking
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingStep, setBookingStep] = useState(1);
  
  // Mock payment info
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!token) {
        console.error('Token not found in localStorage');
        setError('Authentication error. Please try logging in again.');
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        // Real API call to fetch doctors
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        console.log('Fetching doctors with token:', token);
        const response = await axios.get('/api/doctors', config);
        console.log('Doctors response:', response.data);
        const fetchedDoctors = response.data;
        
        setDoctors(fetchedDoctors);
        setFilteredDoctors(fetchedDoctors);
        
        // If doctorId is provided, preselect the doctor
        if (doctorId) {
          const doctor = fetchedDoctors.find((d: Doctor) => d._id === doctorId);
          if (doctor) {
            setSelectedDoctor(doctor);
            setBookingStep(2);
            fetchAvailability(doctorId);
          }
        }
      } catch (err: any) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctors();
  }, [doctorId, token]);

  // Filter doctors based on search term and specialization
  useEffect(() => {
    let filtered = [...doctors];
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSpecialization !== 'All') {
      filtered = filtered.filter(doctor => 
        doctor.specialization === selectedSpecialization
      );
    }
    
    setFilteredDoctors(filtered);
  }, [searchTerm, selectedSpecialization, doctors]);

  // Fetch doctor availability
  const fetchAvailability = async (docId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('Token not found in localStorage for availability fetch');
      setError('Authentication error. Please try logging in again.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate next 7 days for date options
      const dates = [];
      const today = new Date();
      
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      setDateOptions(dates);
      setSelectedDate(dates[0]);
      
      // In a real implementation, fetch availability from API
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      try {
        // Try to fetch real availability data
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        console.log(`Fetching availability for doctor ${docId} from ${startDate} to ${endDate}`);
        const availabilityRes = await axios.get(
          `/api/doctors/${docId}/availability?startDate=${startDate}&endDate=${endDate}`,
          config
        );
        
        console.log('Availability response:', availabilityRes.data);
        
        // Process availability data
        const firstDateAvailability = availabilityRes.data.find(
          (a: any) => a.date.split('T')[0] === dates[0]
        );
        
        if (firstDateAvailability) {
          // Map API data to our slot format
          const mappedSlots = firstDateAvailability.slots.map((slot: any) => ({
            _id: slot._id || `slot_${dates[0]}_${slot.startTime}`,
            date: dates[0],
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: !slot.isBooked
          }));
          
          setAvailableSlots(mappedSlots);
        } else {
          // No availability for this date
          console.log('No availability for the selected date, generating mock slots');
          setAvailableSlots([]);
          generateSlotsForDate(dates[0]);
        }
      } catch (error: any) {
        console.error('Error fetching availability:', error);
        console.error('Error details:', error.response?.data || 'No details available');
        // Fallback to generate some slots
        console.log('Falling back to mock slot generation');
        generateSlotsForDate(dates[0]);
      }
    } catch (error: any) {
      console.error('Error setting up availability:', error);
      console.error('Error details:', error.response?.data || 'No details available');
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback slots for a selected date
  const generateSlotsForDate = (date: string) => {
    // Generate time slots as fallback
    const timeSlots: TimeSlot[] = [];
    const startHours = [9, 11, 13, 15, 17];
    
    startHours.forEach((hour, index) => {
      timeSlots.push({
        _id: `slot_${date}_${index}`,
        date,
        startTime: `${hour}:00`,
        endTime: `${hour + 2}:00`,
        isAvailable: Math.random() > 0.3, // 70% chance of being available
      });
    });
    
    setAvailableSlots(timeSlots);
    setSelectedSlot(null);
  };

  // Handle doctor selection
  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setBookingStep(2);
    fetchAvailability(doctor._id);
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    
    if (selectedDoctor) {
      // In a real app, fetch availability for this specific date
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        axios.get(`/api/doctors/${selectedDoctor._id}/availability?startDate=${date}&endDate=${date}`, config)
          .then(res => {
            const dateAvailability = res.data.find((a: any) => a.date.split('T')[0] === date);
            
            if (dateAvailability) {
              // Map API data to our slot format
              const mappedSlots = dateAvailability.slots.map((slot: any) => ({
                _id: slot._id || `slot_${date}_${slot.startTime}`,
                date: date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isAvailable: !slot.isBooked
              }));
              
              setAvailableSlots(mappedSlots);
            } else {
              // No availability for this date
              setAvailableSlots([]);
            }
          })
          .catch(err => {
            console.error('Error fetching date availability:', err);
            // Fallback
            generateSlotsForDate(date);
          });
      } catch (error) {
        console.error('Error fetching date availability:', error);
        // Fallback
        generateSlotsForDate(date);
      }
    } else {
      generateSlotsForDate(date);
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'notes') {
      setNotes(value);
    } else {
      setPaymentInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle booking submission
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !selectedDoctor || !selectedSlot) {
      alert('Missing required information. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      
      const bookingData = {
        doctorId: selectedDoctor._id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes
      };
      
      // Real API call to book appointment
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      await axios.post('/api/appointments/book', bookingData, config);
      
      setLoading(false);
      alert('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (err: any) {
      setLoading(false);
      alert(err.response?.data?.message || 'Error booking appointment. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render booking step content
  const renderStepContent = () => {
    switch (bookingStep) {
      case 1:
        return (
          <div className="mt-6">
            <h2 className="text-xl font-medium text-secondary-900">Find a Doctor</h2>
            
            <div className="mt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative rounded-md shadow-sm flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  className="input pl-10"
                  placeholder="Search by doctor name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="sm:w-1/3">
                <select
                  className="input"
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                >
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="bg-white overflow-hidden shadow rounded-lg doctor-card"
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <img
                            className="h-16 w-16 rounded-full object-cover"
                            src={doctor.profilePicture || 'https://via.placeholder.com/150'}
                            alt={doctor.name}
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-secondary-900">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-primary-600">{doctor.specialization}</p>
                        </div>
                      </div>
                      {doctor.about && (
                        <p className="mt-3 text-sm text-secondary-500 line-clamp-3">{doctor.about}</p>
                      )}
                    </div>
                    <div className="border-t border-secondary-200 bg-secondary-50 px-5 py-3">
                      <button
                        type="button"
                        className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-secondary-500 py-10">
                  No doctors found matching your criteria.
                </div>
              )}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="mt-6">
            <div className="flex items-start">
              <button
                type="button"
                onClick={() => {
                  setBookingStep(1);
                  setSelectedDoctor(null);
                }}
                className="mr-4 text-primary-600 hover:text-primary-500"
              >
                ← Back to doctors
              </button>
              
              <h2 className="text-xl font-medium text-secondary-900">
                Book an appointment with {selectedDoctor?.name}
              </h2>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-20 w-20">
                        <img
                          className="h-20 w-20 rounded-full object-cover"
                          src={selectedDoctor?.profilePicture || 'https://via.placeholder.com/150'}
                          alt={selectedDoctor?.name}
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-secondary-900">
                          {selectedDoctor?.name}
                        </h3>
                        <p className="text-sm text-primary-600">{selectedDoctor?.specialization}</p>
                      </div>
                    </div>
                    {selectedDoctor?.about && (
                      <p className="mt-4 text-sm text-secondary-500">{selectedDoctor.about}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-secondary-900 mb-4">
                      Select Date & Time
                    </h3>
                    
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {dateOptions.map(date => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          className={`calendar-day ${
                            selectedDate === date
                              ? 'calendar-day-selected'
                              : 'calendar-day-available'
                          }`}
                        >
                          {formatDate(date)}
                        </button>
                      ))}
                    </div>
                    
                    <h4 className="text-md font-medium text-secondary-800 mt-6 mb-3">
                      Available Time Slots
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot) => (
                          <button
                            key={slot._id}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => handleSlotSelect(slot)}
                            className={`py-2 px-3 rounded-md text-center text-sm focus:outline-none ${
                              selectedSlot?._id === slot._id
                                ? 'bg-primary-600 text-white'
                                : slot.isAvailable
                                ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                                : 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                            }`}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-full text-secondary-500 py-2">
                          No available slots for this date.
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <label htmlFor="notes" className="label">
                        Notes for the doctor (optional)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        className="input"
                        placeholder="Describe your symptoms or reason for visit"
                        value={notes}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="mt-6">
                      <button
                        type="button"
                        disabled={!selectedSlot}
                        onClick={() => selectedSlot && setBookingStep(3)}
                        className="btn-primary w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedSlot ? 'Continue to Payment' : 'Select a Time Slot'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="mt-6">
            <div className="flex items-start">
              <button
                type="button"
                onClick={() => setBookingStep(2)}
                className="mr-4 text-primary-600 hover:text-primary-500"
              >
                ← Back to schedule
              </button>
              
              <h2 className="text-xl font-medium text-secondary-900">
                Confirm your appointment
              </h2>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Appointment Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={selectedDoctor?.profilePicture || 'https://via.placeholder.com/150'}
                          alt={selectedDoctor?.name}
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-secondary-900">
                          {selectedDoctor?.name}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {selectedDoctor?.specialization}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-secondary-400 mr-2" />
                      <span className="text-sm text-secondary-700">
                        {selectedDate && formatDate(selectedDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-secondary-400 mr-2" />
                      <span className="text-sm text-secondary-700">
                        {selectedSlot?.startTime} - {selectedSlot?.endTime}
                      </span>
                    </div>
                    
                    {notes && (
                      <div className="pt-3 border-t border-secondary-200">
                        <p className="text-sm font-medium text-secondary-900 mb-1">Notes:</p>
                        <p className="text-sm text-secondary-700">{notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-secondary-50 px-5 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-secondary-700">Consultation Fee:</span>
                    <span className="font-medium text-secondary-900">₹399</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
                    <CreditCardIcon className="h-5 w-5 text-secondary-400 mr-2" />
                    Payment Details
                  </h3>
                  
                  <form onSubmit={handleBooking}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="nameOnCard" className="label">
                          Name on card
                        </label>
                        <input
                          type="text"
                          id="nameOnCard"
                          name="nameOnCard"
                          className="input"
                          required
                          value={paymentInfo.nameOnCard}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="cardNumber" className="label">
                          Card number (for demo, any 16 digits)
                        </label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          className="input"
                          required
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          value={paymentInfo.cardNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="expiryDate" className="label">
                            Expiry date
                          </label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            className="input"
                            required
                            placeholder="MM/YY"
                            maxLength={5}
                            value={paymentInfo.expiryDate}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="cvv" className="label">
                            CVV
                          </label>
                          <input
                            type="text"
                            id="cvv"
                            name="cvv"
                            className="input"
                            required
                            placeholder="123"
                            maxLength={3}
                            value={paymentInfo.cvv}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        type="submit"
                        className="btn-primary w-full py-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          'Confirm & Pay ₹399'
                        )}
                      </button>
                      
                      <p className="text-xs text-secondary-500 text-center mt-2">
                        This is a demo payment. No actual charges will be made.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-secondary-900">
          Book an Appointment
        </h1>
        
        {loading && !selectedDoctor ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          renderStepContent()
        )}
      </div>
    </div>
  );
};

export default BookingPage; 