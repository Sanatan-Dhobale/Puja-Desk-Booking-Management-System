import { ArrowRight, Flower2 } from "lucide-react";
import { currency } from "../utils.js";
import ApiState from "./ApiState.jsx";
import Pagination from "./Pagination.jsx";

export default function ServicesPanel({
  bookings,
  pagination,
  loading,
  error,
  onRetry,
  onPage,
  onPageSize,
  onSelect,
}) {
  if (loading || error)
    return <ApiState loading={loading} error={error} onRetry={onRetry} />;
  const services = [...new Set(bookings.map((booking) => booking.pujaName))];
  return (
    <section>
      <div className="services-intro">
        <Flower2 size={22} />
        <p>
          Services represented on this page of bookings. Counts and values below
          apply to this page only.
        </p>
      </div>
      <div className="services-grid">
        {services.map((name) => {
          const records = bookings.filter(
            (booking) => booking.pujaName === name,
          );
          return (
            <button
              className="service-card"
              key={name}
              onClick={() => onSelect(name)}
            >
              <span className="service-icon">
                <Flower2 size={26} strokeWidth={1.4} />
              </span>
              <h2>{name}</h2>
              <p>
                {records.length} on this page <span>·</span>
                {
                  records.filter((booking) => booking.status === "Completed")
                    .length
                }{" "}
                completed
              </p>
              <div>
                <strong>
                  {currency(
                    records.reduce((sum, booking) => sum + booking.amount, 0),
                  )}
                </strong>
                <ArrowRight size={17} />
              </div>
            </button>
          );
        })}
      </div>
      {!services.length && (
        <div className="empty-state">
          <Flower2 size={30} />
          <h3>No services booked yet</h3>
          <p>Services will appear when bookings are created.</p>
        </div>
      )}
      <Pagination
        pagination={pagination}
        onPage={onPage}
        onPageSize={onPageSize}
      />
    </section>
  );
}
