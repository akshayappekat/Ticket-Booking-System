const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Showtime date is required']
  },
  time: {
    type: String,
    required: [true, 'Showtime time is required']
  },
  price: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: [0, 'Price cannot be negative']
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Total seats must be at least 1']
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Movie description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  genre: {
    type: [String],
    required: [true, 'At least one genre is required']
  },
  duration: {
    type: Number,
    required: [true, 'Movie duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be negative'],
    max: [10, 'Rating cannot be more than 10'],
    default: 0
  },
  poster: {
    type: String,
    required: [true, 'Movie poster is required']
  },
  trailer: {
    type: String
  },
  director: {
    type: String,
    required: [true, 'Director name is required']
  },
  cast: {
    type: [String],
    required: [true, 'Cast information is required']
  },
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required']
  },
  language: {
    type: String,
    required: [true, 'Language is required']
  },
  showtimes: [showtimeSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better search performance
movieSchema.index({ title: 'text', description: 'text', genre: 'text' });

// Virtual for average rating
movieSchema.virtual('averageRating').get(function() {
  if (this.rating === 0) return 'No ratings yet';
  return this.rating.toFixed(1);
});

// Ensure virtual fields are serialized
movieSchema.set('toJSON', { virtuals: true });
movieSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Movie', movieSchema); 