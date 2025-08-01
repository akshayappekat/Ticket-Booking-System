import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMovie } from '../contexts/MovieContext';
import { FaStar, FaClock, FaCalendar, FaTicketAlt, FaPlay, FaUser, FaLanguage } from 'react-icons/fa';

const MovieDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { currentMovie, loading, fetchMovie } = useMovie();
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  useEffect(() => {
    fetchMovie(id);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentMovie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Movie not found</h2>
          <Link
            to="/"
            className="text-primary-600 hover:text-primary-700"
          >
            Back to movies
          </Link>
        </div>
      </div>
    );
  }

  const activeShowtimes = currentMovie.showtimes.filter(st => st.isActive);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Movie Header */}
          <div className="relative h-96">
            <img
              src={currentMovie.poster}
              alt={currentMovie.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x400?text=Movie+Poster';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-4xl font-bold mb-2">{currentMovie.title}</h1>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <FaStar className="text-yellow-400 mr-1" />
                  <span>{currentMovie.rating > 0 ? currentMovie.rating.toFixed(1) : 'No ratings'}/10</span>
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-1" />
                  <span>{currentMovie.duration} min</span>
                </div>
                <div className="flex items-center">
                  <FaLanguage className="mr-1" />
                  <span>{currentMovie.language}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Movie Details */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Movie</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {currentMovie.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cast</h3>
                    <p className="text-gray-600">{currentMovie.cast.join(', ')}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Director</h3>
                    <p className="text-gray-600">{currentMovie.director}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Genre</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentMovie.genre.map((genre, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Release Date</h3>
                    <p className="text-gray-600">
                      {new Date(currentMovie.releaseDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Showtimes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Showtimes</h3>
                  {activeShowtimes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeShowtimes.map((showtime, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedShowtime === showtime
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                          onClick={() => setSelectedShowtime(showtime)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <FaCalendar className="text-primary-600 mr-2" />
                              <span className="font-medium">
                                {new Date(showtime.date).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {showtime.availableSeats} seats left
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FaClock className="text-gray-500 mr-1" />
                              <span className="text-gray-700">{showtime.time}</span>
                            </div>
                            <span className="font-semibold text-primary-600">
                              ${showtime.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No showtimes available at the moment.</p>
                  )}
                </div>
              </div>

              {/* Booking Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Tickets</h3>
                  
                  {selectedShowtime ? (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Selected Showtime</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Date: {new Date(selectedShowtime.date).toLocaleDateString()}</p>
                          <p>Time: {selectedShowtime.time}</p>
                          <p>Price: ${selectedShowtime.price}</p>
                          <p>Available Seats: {selectedShowtime.availableSeats}</p>
                        </div>
                      </div>

                      {isAuthenticated ? (
                        <Link
                          to={`/booking/${currentMovie._id}`}
                          state={{ selectedShowtime }}
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <FaTicketAlt className="mr-2" />
                          Book Now
                        </Link>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            Please login to book tickets
                          </p>
                          <Link
                            to="/login"
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                          >
                            Login to Book
                          </Link>
                          <Link
                            to="/register"
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Create Account
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaTicketAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Select a showtime above to book tickets
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail; 