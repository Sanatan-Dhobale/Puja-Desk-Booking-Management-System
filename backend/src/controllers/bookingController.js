import Booking from '../models/Booking.js';

function notFound() {
  const error = new Error('Booking not found');
  error.status = 404;
  return error;
}

export async function getBookings(req, res) {
  const { search, status, sortBy = 'createdAt', order = 'desc' } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const filter = {};

  if (status) filter.status = status;
  if (search) {
    // Escape regex characters so search is literal text supplied by the user.
    const text = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = ['devotee.name', 'devotee.email', 'devotee.phone', 'pujaName'].map((field) => ({
      [field]: { $regex: text, $options: 'i' },
    }));
  }

  const direction = order === 'asc' ? 1 : -1;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ [sortBy]: direction, _id: direction })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Bookings fetched successfully',
    data: bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getBookingById(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw notFound();

  res.json({ success: true, message: 'Booking fetched successfully', data: booking });
}

export async function createBooking(req, res) {
  const { devotee, pujaName, date, amount, status } = req.body;
  const booking = await Booking.create({ devotee, pujaName, date, amount, status });

  res.status(201).json({ success: true, message: 'Booking created successfully', data: booking });
}

export async function updateBookingStatus(req, res) {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { $set: { status: req.body.status } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!booking) throw notFound();

  res.json({ success: true, message: 'Booking status updated successfully', data: booking });
}
