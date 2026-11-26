import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
});

export async function getBookings(params = {}, signal) {
  const response = await api.get("/bookings", { params, signal });
  return response.data;
}

export async function getBooking(id, signal) {
  const response = await api.get("/bookings/" + encodeURIComponent(id), {
    signal,
  });
  return response.data;
}

export async function createBooking(booking) {
  const response = await api.post("/bookings", booking);
  return response.data;
}

export async function updateBookingStatus(id, status) {
  const response = await api.put(
    "/bookings/" + encodeURIComponent(id) + "/status",
    { status },
  );
  return response.data;
}

export function errorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === "ECONNABORTED")
    return "The request timed out. Please try again.";
  if (error.request)
    return "Cannot reach the booking server. Check that Express and MongoDB are running.";
  return error.message || "Something went wrong. Please try again.";
}
