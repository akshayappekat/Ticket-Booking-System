const express = require('express');
const { body, validationResult } = require('express-validator');
const Movie = require('../models/Movie');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all movies (public)
// @route   GET /api/movies
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { isActive: true };
    
    // Search functionality
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    // Genre filter
    if (req.query.genre) {
      filter.genre = { $in: [req.query.genre] };
    }
    
    // Featured movies
    if (req.query.featured === 'true') {
      filter.featured = true;
    }

    const movies = await Movie.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Movie.countDocuments(filter);

    res.json({
      movies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMovies: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching movies' 
    });
  }
});

// @desc    Get single movie
// @route   GET /api/movies/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found' 
      });
    }

    res.json({ movie });
  } catch (error) {
    console.error('Get movie error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching movie' 
    });
  }
});

// @desc    Create movie (admin only)
// @route   POST /api/movies
// @access  Private/Admin
router.post('/', protect, authorize('admin'), [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('genre')
    .isArray({ min: 1 })
    .withMessage('At least one genre is required'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('director')
    .trim()
    .notEmpty()
    .withMessage('Director is required'),
  body('cast')
    .isArray({ min: 1 })
    .withMessage('At least one cast member is required'),
  body('releaseDate')
    .isISO8601()
    .withMessage('Valid release date is required'),
  body('language')
    .trim()
    .notEmpty()
    .withMessage('Language is required'),
  body('poster')
    .trim()
    .notEmpty()
    .withMessage('Poster URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const movie = await Movie.create(req.body);
    res.status(201).json({
      message: 'Movie created successfully',
      movie
    });
  } catch (error) {
    console.error('Create movie error:', error);
    res.status(500).json({ 
      message: 'Server error while creating movie' 
    });
  }
});

// @desc    Update movie (admin only)
// @route   PUT /api/movies/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('genre')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one genre is required'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating must be between 0 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found' 
      });
    }

    res.json({
      message: 'Movie updated successfully',
      movie
    });
  } catch (error) {
    console.error('Update movie error:', error);
    res.status(500).json({ 
      message: 'Server error while updating movie' 
    });
  }
});

// @desc    Delete movie (admin only)
// @route   DELETE /api/movies/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found' 
      });
    }

    res.json({ 
      message: 'Movie deleted successfully' 
    });
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting movie' 
    });
  }
});

// @desc    Add showtime to movie (admin only)
// @route   POST /api/movies/:id/showtimes
// @access  Private/Admin
router.post('/:id/showtimes', protect, authorize('admin'), [
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('time')
    .trim()
    .notEmpty()
    .withMessage('Time is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('totalSeats')
    .isInt({ min: 1 })
    .withMessage('Total seats must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { date, time, price, totalSeats } = req.body;
    
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found' 
      });
    }

    // Check if showtime already exists
    const existingShowtime = movie.showtimes.find(
      showtime => 
        showtime.date.toDateString() === new Date(date).toDateString() &&
        showtime.time === time
    );

    if (existingShowtime) {
      return res.status(400).json({ 
        message: 'Showtime already exists for this date and time' 
      });
    }

    movie.showtimes.push({
      date: new Date(date),
      time,
      price,
      totalSeats,
      availableSeats: totalSeats
    });

    await movie.save();

    res.status(201).json({
      message: 'Showtime added successfully',
      showtime: movie.showtimes[movie.showtimes.length - 1]
    });
  } catch (error) {
    console.error('Add showtime error:', error);
    res.status(500).json({ 
      message: 'Server error while adding showtime' 
    });
  }
});

// @desc    Update showtime (admin only)
// @route   PUT /api/movies/:id/showtimes/:showtimeId
// @access  Private/Admin
router.put('/:id/showtimes/:showtimeId', protect, authorize('admin'), [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required'),
  body('time')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Time is required'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('totalSeats')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total seats must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found' 
      });
    }

    const showtime = movie.showtimes.id(req.params.showtimeId);
    if (!showtime) {
      return res.status(404).json({ 
        message: 'Showtime not found' 
      });
    }

    // Update showtime fields
    Object.keys(req.body).forEach(key => {
      if (key === 'date') {
        showtime.date = new Date(req.body[key]);
      } else if (key === 'totalSeats') {
        const newTotalSeats = req.body[key];
        const bookedSeats = showtime.totalSeats - showtime.availableSeats;
        showtime.totalSeats = newTotalSeats;
        showtime.availableSeats = Math.max(0, newTotalSeats - bookedSeats);
      } else {
        showtime[key] = req.body[key];
      }
    });

    await movie.save();

    res.json({
      message: 'Showtime updated successfully',
      showtime
    });
  } catch (error) {
    console.error('Update showtime error:', error);
    res.status(500).json({ 
      message: 'Server error while updating showtime' 
    });
  }
});

// @desc    Delete showtime (admin only)
// @route   DELETE /api/movies/:id/showtimes/:showtimeId
// @access  Private/Admin
router.delete('/:id/showtimes/:showtimeId', protect, authorize('admin'), async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found' 
      });
    }

    const showtime = movie.showtimes.id(req.params.showtimeId);
    if (!showtime) {
      return res.status(404).json({ 
        message: 'Showtime not found' 
      });
    }

    showtime.remove();
    await movie.save();

    res.json({ 
      message: 'Showtime deleted successfully' 
    });
  } catch (error) {
    console.error('Delete showtime error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting showtime' 
    });
  }
});

module.exports = router; 