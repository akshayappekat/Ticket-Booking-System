const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin'));

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Search by name or email
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Role filter
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    // Blocked users filter
    if (req.query.blocked === 'true') {
      filter.isBlocked = true;
    } else if (req.query.blocked === 'false') {
      filter.isBlocked = false;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching users' 
    });
  }
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching user' 
    });
  }
});

// @desc    Update user (block/unblock, change role)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/users/:id', [
  body('isBlocked')
    .optional()
    .isBoolean()
    .withMessage('isBlocked must be a boolean'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Prevent admin from blocking themselves
    if (user._id.toString() === req.user.id && req.body.isBlocked === true) {
      return res.status(400).json({ 
        message: 'Cannot block your own account' 
      });
    }

    // Update user fields
    if (req.body.isBlocked !== undefined) user.isBlocked = req.body.isBlocked;
    if (req.body.role) user.role = req.body.role;

    const updatedUser = await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isBlocked: updatedUser.isBlocked,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Server error while updating user' 
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ 
        message: 'Cannot delete your own account' 
      });
    }

    // Check if user has active bookings
    const activeBookings = await Booking.find({
      user: user._id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active bookings' 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting user' 
    });
  }
});

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
router.get('/bookings', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // User filter
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    
    // Movie filter
    if (req.query.movieId) {
      filter.movie = req.query.movieId;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
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

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private/Admin
router.put('/bookings/:id/status', [
  body('status')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found' 
      });
    }

    booking.status = req.body.status;
    
    if (req.body.status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user.id;
      booking.cancellationReason = req.body.reason || 'Cancelled by admin';
    }

    await booking.save();

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ 
      message: 'Server error while updating booking status' 
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalMovies = await Movie.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Monthly statistics
    const monthlyBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Weekly statistics
    const weeklyBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfWeek }
    });

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('movie', 'title poster')
      .sort({ createdAt: -1 })
      .limit(5);

    // Top movies by bookings
    const topMovies = await Booking.aggregate([
      {
        $group: {
          _id: '$movie',
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'movies',
          localField: '_id',
          foreignField: '_id',
          as: 'movie'
        }
      },
      {
        $unwind: '$movie'
      }
    ]);

    res.json({
      statistics: {
        totalUsers,
        totalMovies,
        totalBookings,
        monthlyBookings,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        weeklyBookings
      },
      recentBookings,
      topMovies
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching dashboard data' 
    });
  }
});

// @desc    Get booking analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Booking trends
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Revenue by status
    const revenueByStatus = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Popular showtimes
    const popularShowtimes = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$showtime.time',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      bookingTrends,
      revenueByStatus,
      popularShowtimes
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching analytics' 
    });
  }
});

module.exports = router; 