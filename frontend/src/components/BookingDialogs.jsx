import { useState } from "react";
import {
  CalendarDays,
  Check,
  Flower2,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { statuses, pujaNames } from "../constants.js";
import { bookingReference, currency, formatDate } from "../utils.js";
import StatusBadge from "./StatusBadge.jsx";

export function BookingForm({ onSubmit, onCancel, saving, serverError }) {
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const date = new Date(values.date);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== values.date
    ) {
      setError("Please choose a valid calendar date.");
      return;
    }
    if (!values.name.trim() || !values.pujaName.trim()) {
      setError("Please enter a devotee name and puja name.");
      return;
    }
    onSubmit({
      devotee: {
        name: values.name.trim(),
        phone: values.phone.trim(),
        ...(values.email.trim() && {
          email: values.email.trim().toLowerCase(),
        }),
        ...(values.address.trim() && { address: values.address.trim() }),
      },
      pujaName: values.pujaName.trim(),
      date: values.date,
      amount: Number(values.amount),
      status: values.status,
    });
  }
  return (
    <form className="booking-form" onSubmit={submit}>
      <p className="modal-description">
        A meaningful ritual starts with the little details.
      </p>

      <fieldset disabled={saving}>
        <div className="form-grid">
          <label>
            Devotee name <span>*</span>
            <input
              name="name"
              placeholder="e.g. Asha Sharma"
              required
              maxLength={100}
              autoComplete="name"
            />
          </label>
          <label>
            Phone number <span>*</span>
            <input
              name="phone"
              type="tel"
              placeholder="+919876543210"
              required
              pattern="\+?[0-9]{7,15}"
              title="7–15 digits, with an optional + prefix"
              autoComplete="tel"
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              placeholder="asha@example.com"
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label>
            Puja name <span>*</span>
            <select name="pujaName" required defaultValue="">
              <option value="" disabled>
                Select a puja
              </option>
              {pujaNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Puja date <span>*</span>
            <input name="date" type="date" required />
          </label>
          <label>
            Amount (₹) <span>*</span>
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="2100"
              required
            />
          </label>
          <label className="full-width">
            Address
            <input
              name="address"
              placeholder="City, state or full address"
              maxLength={500}
              autoComplete="street-address"
            />
          </label>
          <label className="full-width">
            Status
            <select name="status" defaultValue="Pending">
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>
      {(error || serverError) && (
        <p className="form-error" role="alert">
          {error || serverError}
        </p>
      )}
      <div className="modal-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="button button-primary"
          disabled={saving}
        >
          <Check size={16} />
          {saving ? "Creating…" : "Create booking"}
        </button>
      </div>
    </form>
  );
}

export function BookingDetails({ booking, onUpdate, onClose, saving, error }) {
  const [status, setStatus] = useState(booking.status);
  const details = [
    [User, "Devotee", booking.devotee.name],
    [Mail, "Email address", booking.devotee.email || "Not provided"],
    [Phone, "Phone number", booking.devotee.phone],
    [MapPin, "Address", booking.devotee.address || "Not provided"],
    [Flower2, "Puja", booking.pujaName],
    [CalendarDays, "Puja date", formatDate(booking.date)],
  ];
  return (
    <div className="booking-details">
      <div className="details-summary">
        <div>
          <p>{bookingReference(booking)}</p>
          <h3>{currency(booking.amount)}</h3>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="details-grid">
        {details.map(([Icon, label, value]) => (
          <div key={label}>
            <Icon size={17} />
            <span>
              <small>{label}</small>
              <strong>{value}</strong>
            </span>
          </div>
        ))}
      </div>
      <label className="status-label">
        Booking status
        <select
          disabled={saving}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {statuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <p className="modal-description">
        Status changes are saved to MongoDB after the server confirms the
        update.
      </p>
      <div className="modal-actions">
        <button
          className="button button-secondary"
          disabled={saving}
          onClick={onClose}
        >
          Back to bookings
        </button>
        <button
          className="button button-primary"
          disabled={saving || status === booking.status}
          onClick={() => onUpdate(booking._id, status)}
        >
          <Check size={16} />
          {saving ? "Saving…" : "Save status"}
        </button>
      </div>
    </div>
  );
}
