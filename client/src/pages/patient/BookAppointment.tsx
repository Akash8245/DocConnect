import React from 'react';
import Booking from './Booking';

/**
 * BookAppointment component - serves as a wrapper for the Booking component
 * This provides compatibility with the route defined in App.tsx
 */
const BookAppointment: React.FC = () => {
  return <Booking />;
};

export default BookAppointment; 