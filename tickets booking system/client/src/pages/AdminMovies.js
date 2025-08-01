import React from 'react';

const AdminMovies = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Movies</h1>
          <p className="text-gray-600">
            This page would allow admins to add, edit, and delete movies and their showtimes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminMovies; 