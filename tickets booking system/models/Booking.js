const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie is required']
  },
  showtime: {
    date: {
      type: Date,
      required: [true, 'Showtime date is required']
    },
    time: {
      type: String,
      required: [true, 'Showtime time is required']
    }
  },
  seats: {
    type: [String],
    required: [true, 'Seat selection is required'],
    validate: {
      validator: function(seats) {
        return seats.length > 0;
      },
      message: 'At least one seat must be selected'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'cash', 'online'],
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  bookingCode: {
    type: String,
    unique: true,
    required: [true, 'Booking code is required']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot be more than 200 characters']
  }
}, {
  timestamps: true
});

// Generate unique booking code
bookingSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let bookingCode;
    let isUnique = false;
    
    while (!isUnique) {
      bookingCode = generateCode();
      const existingBooking = await this.constructor.findOne({ bookingCode });
      if (!existingBooking) {
        isUnique = true;
      }
    }
    
    this.bookingCode = bookingCode;
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for formatted booking date
bookingSchema.virtual('formattedBookingDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for formatted showtime
bookingSchema.virtual('formattedShowtime').get(function() {
  const date = new Date(this.showtime.date);
  return `${date.toLocaleDateString('en-US')} at ${this.showtime.time}`;
});

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Index for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ movie: 1, 'showtime.date': 1 });
bookingSchema.index({ bookingCode: 1 });

module.exports = mongoose.model('Booking', bookingSchema); 