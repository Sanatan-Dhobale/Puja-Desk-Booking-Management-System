import express from 'express';
import bookingRoutes from './routes/bookingRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import connectDB from "./config/db.js";

const app = express();

app.use(express.json());

app.use("/api", async (req, res, next) => {
  await connectDB();
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Puja Booking API is running', data: null });
});

app.use('/api/bookings', bookingRoutes);

app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
});

app.use(errorHandler);

export default app;
