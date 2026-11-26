import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  getBooking,
  updateBookingStatus,
  errorMessage,
} from "../services/bookingApi.js";
import { BookingDetails } from "./BookingDialogs.jsx";
import ApiState from "./ApiState.jsx";

export default function BookingDetailsPage({ id, onSaved }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setSaveError("");
    setBooking(null);
    async function load() {
      try {
        const result = await getBooking(id, controller.signal);
        if (!controller.signal.aborted) setBooking(result.data);
      } catch (error) {
        if (!controller.signal.aborted) setError(errorMessage(error));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id, retry]);

  async function saveStatus(bookingId, status) {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await updateBookingStatus(bookingId, status);
      setBooking(result.data);
      onSaved("Booking status saved to MongoDB.");
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="booking-details-page">
      <a className="back-link" href="#/bookings">
        <ArrowLeft size={17} />
        Back to bookings
      </a>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BOOKING RECORD</div>
          <h1>Booking details</h1>
          <p>View devotee details and manage the booking status.</p>
        </div>
      </div>
      <div className="detail-card">
        {loading || error ? (
          <ApiState
            loading={loading}
            error={error}
            onRetry={() => setRetry((value) => value + 1)}
          />
        ) : (
          booking && (
            <>
              <div className="record-id">
                MongoDB ID <code>{booking._id}</code>
              </div>
              <BookingDetails
                key={booking._id + booking.status}
                booking={booking}
                onUpdate={saveStatus}
                onClose={() => {
                  window.location.hash = "/bookings";
                }}
                saving={saving}
                error={saveError}
              />
            </>
          )
        )}
      </div>
    </section>
  );
}
