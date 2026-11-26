import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import connectDB from '../src/config/db.js';
import Booking, { bookingStatuses, pujaNames } from '../src/models/Booking.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

const devotees = [
  ['Aarav Sharma', 'Varanasi'],
  ['Priya Patel', 'Ahmedabad'],
  ['Rohan Mehta', 'Mumbai'],
  ['Ananya Iyer', 'Chennai'],
  ['Vikram Singh', 'Jaipur'],
  ['Meera Joshi', 'Pune'],
  ['Aditya Rao', 'Hyderabad'],
  ['Kavya Nair', 'Kochi'],
  ['Sanjay Gupta', 'Lucknow'],
  ['Diya Desai', 'Surat'],
  ['Arjun Verma', 'Delhi'],
  ['Ishita Shah', 'Vadodara'],
  ['Neha Mishra', 'Prayagraj'],
  ['Rahul Sen', 'Kolkata'],
  ['Sneha Kulkarni', 'Nagpur'],
  ['Karan Malhotra', 'Chandigarh'],
  ['Pooja Reddy', 'Bengaluru'],
  ['Manish Agarwal', 'Indore'],
  ['Ritika Das', 'Bhubaneswar'],
  ['Nikhil Bansal', 'Bhopal'],
  ['Sonal Trivedi', 'Rajkot'],
  ['Deepak Pandey', 'Gorakhpur'],
  ['Tanvi Kapoor', 'Amritsar'],
  ['Varun Sinha', 'Patna'],
  ['Shreya Menon', 'Thiruvananthapuram'],
  ['Amit Chatterjee', 'Durgapur'],
  ['Swati Saxena', 'Kanpur'],
];

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const amounts = [2100, 3100, 2500, 5100];
const samples = devotees.map(([name, city], index) => {
  const status = bookingStatuses[Math.floor(index / 4) % bookingStatuses.length];
  const date = new Date(today + 'T00:00:00.000Z');
  const offset = status === 'Completed' ? -(index % 6 + 1) : status === 'In Progress' ? 0 : index % 14 + 1;
  date.setUTCDate(date.getUTCDate() + offset);

  return {
    // Stable IDs make repeat runs skip these samples instead of duplicating them.
    _id: new mongoose.Types.ObjectId('7365656470756a61' + (index + 1).toString(16).padStart(8, '0')),
    devotee: {
      name,
      phone: '+9190000' + String(index + 1).padStart(5, '0'),
      email: `puja.sample${String(index + 1).padStart(2, '0')}@example.com`,
      address: city + ', India',
    },
    pujaName: pujaNames[index % pujaNames.length],
    date,
    amount: amounts[index % amounts.length] + (index % 3) * 500,
    status,
  };
});

async function seedBookings() {
  try {
    await connectDB();
    const existing = await Booking.find({ _id: { $in: samples.map((booking) => booking._id) } })
      .select('_id').lean();
    const existingIds = new Set(existing.map((booking) => booking._id.toString()));
    const newBookings = samples.filter((booking) => !existingIds.has(booking._id.toString()));
    if (newBookings.length) await Booking.insertMany(newBookings);
    console.log(`Inserted ${newBookings.length} sample bookings; skipped ${existingIds.size} existing samples.`);
    console.log(`Total bookings in the database: ${await Booking.countDocuments()}`);
  } catch (error) {
    console.error('Unable to seed bookings:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedBookings();
