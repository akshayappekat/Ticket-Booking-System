const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, [
  body('movieId')
    .isMongoId()
    .withMessage('Valid movie ID is required'),
  body('showtimeDate')
    .isISO8601()
    .withMessage('Valid showtime date is required'),
  body('showtimeTime')
    .trim()
    .notEmpty()
    .withMessage('Showtime time is required'),
  body('seats')
    .isArray({ min: 1 })
    .withMessage('At least one seat must be selected'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'cash', 'online'])
    .withMessage('Valid payment method is required'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { 
      movieId, 
      showtimeDate, 
      showtimeTime, 
      seats, 
      quantity, 
      paymentMethod, 
      notes 
    } = req.body;

    // Find movie and validate showtime
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ 
        message: 'Movie not found' 
      });
    }

    // Find the specific showtime
    const showtime = movie.showtimes.find(
      st => 
        st.date.toDateString() === new Date(showtimeDate).toDateString() &&
        st.time === showtimeTime &&
        st.isActive
    );

    if (!showtime) {
      return res.status(404).json({ 
        message: 'Showtime not found or inactive' 
      });
    }

    // Check seat availability
    if (showtime.availableSeats < quantity) {
      return res.status(400).json({ 
        message: 'Not enough seats available' 
      });
    }

    // Check if seats are already booked
    const existingBookings = await Booking.find({
      movie: movieId,
      'showtime.date': new Date(showtimeDate),
      'showtime.time': showtimeTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    const bookedSeats = existingBookings.flatMap(booking => booking.seats);
    const requestedSeats = seats;

    // Check if any requested seat is already booked
    const conflictingSeats = requestedSeats.filter(seat => bookedSeats.includes(seat));
    if (conflictingSeats.length > 0) {
      return res.status(400).json({ 
        message: `Seats ${conflictingSeats.join(', ')} are already booked` 
      });
    }

    // Calculate total amount
    const totalAmount = showtime.price * quantity;

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      movie: movieId,
      showtime: {
        date: new Date(showtimeDate),
        time: showtimeTime
      },
      seats: requestedSeats,
      quantity,
      totalAmount,
      paymentMethod,
      notes
    });

    // Update available seats
    showtime.availableSeats -= quantity;
    await movie.save();

    // Populate movie details
    await booking.populate('movie', 'title poster');

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      message: 'Server error while creating booking' 
    });
  }
});

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { user: req.user.id };
    
    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate('movie', 'title poster')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching bookings' 
    });
  }
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('movie', 'title poster director cast genre duration')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found' 
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to view this booking' 
      });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching booking' 
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot be more than 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('movie');

    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found' 
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to cancel this booking' 
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Booking is already cancelled' 
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ 
        message: 'Cannot cancel completed booking' 
      });
    }

    // Check if showtime is within cancellation window (e.g., 2 hours before)
    const showtimeDateTime = new Date(booking.showtime.date);
    const [hours, minutes] = booking.showtime.time.split(':');
    showtimeDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const now = new Date();
    const timeDiff = showtimeDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 2) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking within 2 hours of showtime' 
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;
    booking.cancellationReason = req.body.reason || 'Cancelled by user';

    await booking.save();

    // Update available seats in movie
    const movie = await Movie.findById(booking.movie);
    if (movie) {
      const showtime = movie.showtimes.find(
        st => 
          st.date.toDateString() === booking.showtime.date.toDateString() &&
          st.time === booking.showtime.time
      );

      if (showtime) {
        showtime.availableSeats += booking.quantity;
        await movie.save();
      }
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      message: 'Server error while cancelling booking' 
    });
  }
});

// @desc    Get booking by code
// @route   GET /api/bookings/code/:code
// @access  Private
router.get('/code/:code', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingCode: req.params.code })
      .populate('movie', 'title poster director cast genre duration')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found' 
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to view this booking' 
      });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking by code error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching booking' 
    });
  }
});

module.exports = router; 