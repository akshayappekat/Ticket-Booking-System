import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMovie } from '../contexts/MovieContext';
import { FaSearch, FaStar, FaPlay, FaTicketAlt } from 'react-icons/fa';

const Home = () => {
  const { movies, loading, fetchMovies, filters, setFilters } = useMovie();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMovies(1, { featured: 'true' });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ search: searchTerm });
    fetchMovies(1, { search: searchTerm });
  };

  const handleGenreFilter = (genre) => {
    setFilters({ genre });
    fetchMovies(1, { genre });
  };

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-900 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Book Your Movie Tickets
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Discover the latest movies and secure your seats online
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search for movies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-r-lg transition-colors"
                >
                  <FaSearch className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Genre Filter */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreFilter(genre)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Movies */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Movies
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the latest blockbusters and timeless classics available for booking
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <div key={movie._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x400?text=Movie+Poster';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-sm font-semibold">
                      {movie.rating}/10
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <Link
                          to={`/movies/${movie._id}`}
                          className="bg-primary-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-primary-700 transition-colors"
                        >
                          <FaPlay className="h-4 w-4" />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {movie.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {movie.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1">
                        <FaStar className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-gray-600">
                          {movie.rating > 0 ? movie.rating.toFixed(1) : 'No ratings'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {movie.duration} min
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {movie.genre.slice(0, 2).map((genre, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-semibold">
                        ${movie.showtimes?.[0]?.price || 0}
                      </span>
                      <Link
                        to={`/booking/${movie._id}`}
                        className="bg-primary-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-primary-700 transition-colors"
                      >
                        <FaTicketAlt className="h-4 w-4" />
                        <span>Book Now</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {movies.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No movies found. Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Book Your Next Movie?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of movie lovers who trust us for their entertainment
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 