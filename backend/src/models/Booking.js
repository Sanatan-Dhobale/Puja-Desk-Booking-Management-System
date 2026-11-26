import mongoose from 'mongoose';

export const pujaNames = ['Ganesh Puja', 'Durga Puja', 'Arogya Prapti Puja', 'Laxmi Puja'];

export const bookingStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed'];

const bookingSchema = new mongoose.Schema(
  {
    devotee: {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      phone: {
        type: String,
        required: true,
        trim: true,
        match: /^\+?[0-9]{7,15}$/,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 254,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      address: { type: String, trim: true, maxlength: 500 },
    },
    pujaName: { type: String, required: true, trim: true, enum: pujaNames },
    date: { type: Date, required: true },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: 'Amount must be a finite number',
      },
    },
    status: { type: String, enum: bookingStatuses, default: 'Pending' },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model('Booking', bookingSchema);
