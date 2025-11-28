import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { 
  CalendarIcon, 
  ClockIcon, 
  PlusCircleIcon,
  TrashIcon,
  CheckCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface AvailabilitySlot {
  _id?: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: 'first-time' | 'follow-up' | 'both';
  isBooked?: boolean;
}

// Generate an array of the next 7 days
const getNextSevenDays = () => {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = date.toISOString().split('T')[0];
    const dayMonth = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    
    days.push({
      date: formattedDate,
      dayName,
      dayMonth,
      isToday: i === 0
    });
  }
  
  return days;
};

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', 
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', 
  '17:30', '18:00', '18:30', '19:00'
];

const sessionTypes = [
  { value: 'first-time', label: 'First-Time Visit (60 min)' },
  { value: 'follow-up', label: 'Follow-Up Visit (30 min)' },
  { value: 'both', label: 'Both Types' }
];

const Availability = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const token = localStorage.getItem('token');
  
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextSevenDays] = useState(getNextSevenDays());
  const [selectedDate, setSelectedDate] = useState(nextSevenDays[0].date);
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({
    date: nextSevenDays[0].date,
    startTime: timeSlots[0],
    endTime: timeSlots[2],
    sessionType: 'both'
  });
  const [error, setError] = useState('');
  const [showDemoMessage, setShowDemoMessage] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
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
        
        // Calculate the date range for the API request
        const startDate = nextSevenDays[0].date;
        const endDate = nextSevenDays[6].date;
        
        // Fetch doctor's ID from the user context
        const doctorId = user?.id;
        
        if (!doctorId) {
          setError('User information is missing. Please log in again.');
          setLoading(false);
          return;
        }
        
        console.log('Fetching availability for doctor:', doctorId, 'Date range:', startDate, 'to', endDate);
        
        try {
          // Fetch availability slots for the next 7 days
          const response = await axios.get(
            `/api/doctors/${doctorId}/availability?startDate=${startDate}&endDate=${endDate}`, 
            config
          );
          
          console.log('Availability API response:', response.data);
          
          // Transform the backend data format to match our frontend format
          const transformedSlots = [];
          
          if (Array.isArray(response.data)) {
            console.log('Processing availability data arrays:', response.data.length, 'days');
            
            response.data.forEach(dayAvailability => {
              if (dayAvailability.slots && Array.isArray(dayAvailability.slots)) {
                dayAvailability.slots.forEach(slot => {
                  transformedSlots.push({
                    _id: slot._id || `temp-${Date.now()}-${Math.random()}`,
                    date: new Date(dayAvailability.date).toISOString().split('T')[0],
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    // Default to 'both' since the backend doesn't have sessionType yet
                    sessionType: 'both',
                    isBooked: slot.isBooked || false
                  });
                });
              }
            });
          } else if (response.data && typeof response.data === 'object') {
            console.log('Processing availability data object');
            // Handle case where API returns a single object instead of array
            setShowDemoMessage(true);
            // Use demo data for development
            const today = nextSevenDays[0].date;
            transformedSlots.push({
              _id: `demo-1`,
              date: today,
              startTime: '09:00',
              endTime: '10:00',
              sessionType: 'both',
              isBooked: false
            }, {
              _id: `demo-2`,
              date: today,
              startTime: '14:00',
              endTime: '15:00',
              sessionType: 'both',
              isBooked: false
            });
          }
          
          console.log('Transformed availability slots:', transformedSlots.length, 'slots');
          setAvailabilitySlots(transformedSlots);
        } catch (err) {
          console.error('Error fetching availability from API:', err);
          
          // Fallback to empty slots if API fails
          setAvailabilitySlots([]);
          setError('Failed to load availability data. The API endpoint may not be ready yet.');
        }
      } catch (err: any) {
        console.error('Error in availability fetch process:', err);
        setError('Failed to load availability data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [token, nextSevenDays, user]);

  const handleAddSlot = () => {
    // Validate that end time is after start time
    if (newSlot.startTime >= newSlot.endTime) {
      alert('End time must be after start time');
      return;
    }

    // Check for overlapping slots on the same date
    const isOverlapping = availabilitySlots.some(slot => 
      slot.date === newSlot.date && 
      (
        (newSlot.startTime >= slot.startTime && newSlot.startTime < slot.endTime) ||
        (newSlot.endTime > slot.startTime && newSlot.endTime <= slot.endTime) ||
        (newSlot.startTime <= slot.startTime && newSlot.endTime >= slot.endTime)
      )
    );

    if (isOverlapping) {
      alert('This slot overlaps with an existing availability slot');
      return;
    }

    // Add new slot with temporary ID
    const newSlotWithId = {
      ...newSlot,
      _id: `temp-${Date.now()}` // Temporary ID until saved to database
    };
    
    setAvailabilitySlots([...availabilitySlots, newSlotWithId]);
    
    // Reset form but keep the same date selected
    setNewSlot({
      date: selectedDate,
      startTime: timeSlots[0],
      endTime: timeSlots[2],
      sessionType: 'both'
    });
  };

  const handleRemoveSlot = async (slotId: string) => {
    try {
      // Check if it's a temporary ID or a real one from the database
      const isTemporaryId = slotId.includes('temp-') || slotId.includes('demo-');
      
      if (!isTemporaryId && token) {
        // If it's a real ID, delete from the database
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        await axios.delete(`/api/doctors/availability/${slotId}`, config);
      }
      
      // Remove from state
      setAvailabilitySlots(availabilitySlots.filter(slot => slot._id !== slotId));
      
    } catch (err: any) {
      console.error('Error removing availability slot:', err);
      alert('Failed to remove availability slot. Please try again.');
    }
  };

  const handleSaveAvailability = async () => {
    if (!token) {
      setError('Authentication token not found. Please login again.');
      return;
    }
    
    if (!user || !user.id) {
      setError('User information is missing. Please log in again.');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Filter out slots that don't have a proper database ID (temporary IDs)
      const newSlots = availabilitySlots.filter(slot => !slot._id || slot._id.toString().includes('temp-') || slot._id.includes('demo-'));
      
      // Make API call to save new slots
      if (newSlots.length > 0) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        console.log('Saving new availability slots:', newSlots.length, 'slots');
        
        // Format slots according to the backend API expectations
        // Group slots by date
        const slotsByDate = newSlots.reduce((acc: any, slot) => {
          if (!acc[slot.date]) {
            acc[slot.date] = [];
          }
          
          // Format the slot to match backend expectations - exclude sessionType which isn't in the backend schema
          acc[slot.date].push({
            startTime: slot.startTime,
            endTime: slot.endTime
          });
          
          return acc;
        }, {});
        
        // Save slots for each date
        const savePromises = Object.keys(slotsByDate).map(date => {
          return axios.post('/api/doctors/availability', {
            date: date,
            slots: slotsByDate[date]
          }, config);
        });
        
        await Promise.all(savePromises);
        
        // Reset the temporary IDs with new ones from the database
        // Ideally we'd fetch the updated data from the server here
        // but for simplicity, we'll just refresh the page
        window.location.reload();
      } else {
        alert('No new availability slots to save');
      }
    } catch (err: any) {
      console.error('Error saving availability:', err);
      setError('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setNewSlot({
      ...newSlot,
      date
    });
  };

  const getSessionTypeLabel = (type: string) => {
    const sessionType = sessionTypes.find(st => st.value === type);
    return sessionType ? sessionType.label : 'Unknown';
  };

  // Filter availability slots for the selected date
  const filteredSlots = availabilitySlots.filter(
    slot => slot.date === selectedDate
  ).sort((a, b) => {
    // Sort by start time
    return a.startTime.localeCompare(b.startTime);
  });

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
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Allow users to still try adding availability even if fetch failed */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Set Your Availability</h2>
              <p className="text-sm text-gray-500">
                Select dates and times when you're available for appointments.
              </p>
            </div>
          
            {/* Calendar days */}
            <div className="flex overflow-x-auto p-4 border-b">
              {nextSevenDays.map(day => (
                <button
                  key={day.date}
                  onClick={() => handleDateSelect(day.date)}
                  className={`flex flex-col items-center p-3 mx-1 rounded-lg min-w-[80px] ${
                    selectedDate === day.date 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'hover:bg-gray-100'
                  } ${day.isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                >
                  <span className="text-xs font-medium">{day.dayName}</span>
                  <span className="mt-1 text-lg font-semibold">{day.dayMonth}</span>
                </button>
              ))}
            </div>
            
            {/* Add new time slot form */}
            <div className="p-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">Add New Time Slot</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <select
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {timeSlots.map(time => (
                      <option key={`start-${time}`} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <select
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {timeSlots.map(time => (
                      <option key={`end-${time}`} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                  <select
                    value={newSlot.sessionType}
                    onChange={(e) => setNewSlot({ ...newSlot, sessionType: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {sessionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Add Time Slot
                  </button>
                </div>
              </div>
              
              {showDemoMessage && (
                <div className="bg-yellow-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-yellow-700">
                    Note: You're currently seeing demo data. Any changes you make will be saved to your local session.
                  </p>
                </div>
              )}
              
              {/* Display slots for the selected date */}
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">
                  Available Time Slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                
                {filteredSlots.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <p className="text-gray-500">No availability set for this date.</p>
                    <p className="text-gray-400 text-sm mt-1">Add time slots above to make yourself available.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {filteredSlots.map(slot => (
                      <li key={slot._id} className={`flex items-center justify-between p-3 rounded-md ${slot.isBooked ? 'bg-gray-100' : 'bg-blue-50'}`}>
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="text-sm font-medium">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {getSessionTypeLabel(slot.sessionType)}
                          </span>
                          {slot.isBooked && (
                            <span className="ml-3 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              <UserGroupIcon className="h-3 w-3 inline mr-1" />
                              Booked
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveSlot(slot._id as string)}
                          disabled={slot.isBooked}
                          className={`p-2 rounded-full ${slot.isBooked ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:bg-red-100'}`}
                          title={slot.isBooked ? "Cannot remove booked slot" : "Remove slot"}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Save button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAvailability}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Set Your Availability</h2>
            <p className="text-sm text-gray-500">
              Select dates and times when you're available for appointments.
            </p>
          </div>
          
          {showDemoMessage && (
            <div className="bg-yellow-50 p-3 mx-4 mt-4 rounded-md">
              <p className="text-sm text-yellow-700">
                Note: You're currently seeing demo data. Any changes you make will be saved to your local session.
              </p>
            </div>
          )}
          
          {/* Calendar days */}
          <div className="flex overflow-x-auto p-4 border-b">
            {nextSevenDays.map(day => (
              <button
                key={day.date}
                onClick={() => handleDateSelect(day.date)}
                className={`flex flex-col items-center p-3 mx-1 rounded-lg min-w-[80px] ${
                  selectedDate === day.date 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                } ${day.isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              >
                <span className="text-xs font-medium">{day.dayName}</span>
                <span className="mt-1 text-lg font-semibold">{day.dayMonth}</span>
              </button>
            ))}
          </div>
          
          {/* Add new time slot form */}
          <div className="p-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Add New Time Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <select
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {timeSlots.map(time => (
                    <option key={`start-${time}`} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <select
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {timeSlots.map(time => (
                    <option key={`end-${time}`} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                <select
                  value={newSlot.sessionType}
                  onChange={(e) => setNewSlot({ ...newSlot, sessionType: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {sessionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Add Time Slot
                </button>
              </div>
            </div>
            
            {/* Display slots for the selected date */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                Available Time Slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              
              {filteredSlots.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-md text-center">
                  <p className="text-gray-500">No availability set for this date.</p>
                  <p className="text-gray-400 text-sm mt-1">Add time slots above to make yourself available.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredSlots.map(slot => (
                    <li key={slot._id} className={`flex items-center justify-between p-3 rounded-md ${slot.isBooked ? 'bg-gray-100' : 'bg-blue-50'}`}>
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {getSessionTypeLabel(slot.sessionType)}
                        </span>
                        {slot.isBooked && (
                          <span className="ml-3 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            <UserGroupIcon className="h-3 w-3 inline mr-1" />
                            Booked
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveSlot(slot._id as string)}
                        disabled={slot.isBooked}
                        className={`p-2 rounded-full ${slot.isBooked ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:bg-red-100'}`}
                        title={slot.isBooked ? "Cannot remove booked slot" : "Remove slot"}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Save button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAvailability}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Availability; 