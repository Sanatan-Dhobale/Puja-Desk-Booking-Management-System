import { AlertCircle, LoaderCircle } from "lucide-react";

export default function ApiState({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="api-state" role="status">
        <LoaderCircle size={25} className="loading-spinner" />
        <p>Loading bookings…</p>
      </div>
    );
  }
  return (
    <div className="api-state api-error" role="alert">
      <AlertCircle size={25} />
      <h3>Unable to load bookings</h3>
      <p>{error}</p>
      <button className="button button-secondary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
