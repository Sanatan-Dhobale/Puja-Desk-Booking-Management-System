import { bookingStatuses, pujaNames } from '../models/Booking.js';

function invalid(next, message) {
  const error = new Error(message);
  error.status = 400;
  return next(error);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function validateBookingId(req, res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return invalid(next, 'Invalid booking ID. Use a 24-character MongoDB ObjectId.');
  }
  next();
}

export function validateCreateBooking(req, res, next) {
  const body = req.body;
  if (!isObject(body)) {
    return invalid(next, 'Provide a JSON object as the request body.');
  }

  const allowed = ['devotee', 'pujaName', 'date', 'amount', 'status'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    return invalid(next, 'Unknown booking field. Allowed: devotee, pujaName, date, amount, status.');
  }

  const devotee = body.devotee;
  if (!isObject(devotee)) {
    return invalid(next, 'Devotee details are required.');
  }
  if (Object.keys(devotee).some((key) => !['name', 'phone', 'email', 'address'].includes(key))) {
    return invalid(next, 'Unknown devotee field. Allowed: name, phone, email, address.');
  }
  if (!validText(devotee.name, 100)) {
    return invalid(next, 'Devotee name is required and must be at most 100 characters.');
  }
  if (typeof devotee.phone !== 'string' || !/^\+?[0-9]{7,15}$/.test(devotee.phone.trim())) {
    return invalid(next, 'Devotee phone must contain 7 to 15 digits, optionally starting with +.');
  }
  if (devotee.email !== undefined && (!validText(devotee.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(devotee.email.trim()))) {
    return invalid(next, 'Provide a valid devotee email or omit it.');
  }
  if (devotee.address !== undefined && !validText(devotee.address, 500)) {
    return invalid(next, 'Devotee address must be 1 to 500 characters when provided.');
  }
  if (typeof body.pujaName !== 'string' || !pujaNames.includes(body.pujaName.trim())) {
    return invalid(next, `Puja name must be one of: ${pujaNames.join(', ')}.`);
  }

  // Require a real calendar date, not a date that JavaScript silently rolls forward.
  if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return invalid(next, 'Date must use YYYY-MM-DD format.');
  }
  const date = new Date(body.date);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== body.date) {
    return invalid(next, 'Provide a valid calendar date.');
  }
  if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount < 0) {
    return invalid(next, 'Amount must be a finite number greater than or equal to 0.');
  }
  if (body.status !== undefined && !bookingStatuses.includes(body.status)) {
    return invalid(next, `Status must be one of: ${bookingStatuses.join(', ')}.`);
  }
  next();
}

export function validateStatusUpdate(req, res, next) {
  if (!isObject(req.body) || Object.keys(req.body).length !== 1 || !bookingStatuses.includes(req.body.status)) {
    return invalid(next, `Provide only status, using one of: ${bookingStatuses.join(', ')}.`);
  }
  next();
}

export function validateBookingQuery(req, res, next) {
  const query = req.query;
  const allowed = ['search', 'status', 'sortBy', 'order', 'page', 'limit'];
  if (Object.keys(query).some((key) => !allowed.includes(key) || typeof query[key] !== 'string')) {
    return invalid(next, 'Use only single values for search, status, sortBy, order, page, and limit.');
  }
  if (query.search !== undefined && !validText(query.search, 100)) {
    return invalid(next, 'Search must be 1 to 100 characters.');
  }
  if (query.status !== undefined && !bookingStatuses.includes(query.status)) {
    return invalid(next, `Status must be one of: ${bookingStatuses.join(', ')}.`);
  }
  const sortFields = ['createdAt', 'date', 'amount', 'status', 'pujaName', 'devotee.name'];
  if (query.sortBy !== undefined && !sortFields.includes(query.sortBy)) {
    return invalid(next, `Sort by one of: ${sortFields.join(', ')}.`);
  }
  if (query.order !== undefined && !['asc', 'desc'].includes(query.order)) {
    return invalid(next, 'Order must be asc or desc.');
  }
  for (const key of ['page', 'limit']) {
    if (query[key] !== undefined && (!/^[1-9]\d*$/.test(query[key]) || !Number.isSafeInteger(Number(query[key])))) {
      return invalid(next, `${key} must be a positive integer.`);
    }
  }
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  if (limit > 100) {
    return invalid(next, 'Limit must be at most 100.');
  }
  if (!Number.isSafeInteger((page - 1) * limit)) {
    return invalid(next, 'Page is too large.');
  }
  next();
}
