import { Router } from 'express';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import {
  validateBookingId,
  validateBookingQuery,
  validateCreateBooking,
  validateStatusUpdate,
} from '../middleware/validateBooking.js';

const router = Router();

router.get('/', validateBookingQuery, getBookings);
router.get('/:id', validateBookingId, getBookingById);
router.post('/', validateCreateBooking, createBooking);
router.put('/:id/status', validateBookingId, validateStatusUpdate, updateBookingStatus);

export default router;
