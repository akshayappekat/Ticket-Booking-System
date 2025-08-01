import React from 'react';
import { useParams } from 'react-router-dom';

const BookingPage = () => {
  const { movieId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Tickets</h1>
          <p className="text-gray-600">
            Booking functionality for movie ID: {movieId}
          </p>
          <p className="text-gray-600 mt-4">
            This page would include seat selection, payment form, and booking confirmation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 