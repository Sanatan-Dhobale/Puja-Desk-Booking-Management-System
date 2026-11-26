import {
  ArrowDownUp,
  ArrowUpRight,
  CalendarDays,
  Download,
  Search,
  SearchX,
} from "lucide-react";
import { statuses } from "../constants.js";
import { bookingReference, currency, formatDate, initials } from "../utils.js";
import StatusBadge from "./StatusBadge.jsx";
import Pagination from "./Pagination.jsx";
import ApiState from "./ApiState.jsx";

export default function BookingTable({
  bookings,
  pagination,
  counts,
  loading,
  error,
  onRetry,
  search,
  onSearch,
  status,
  onStatus,
  sort,
  onSort,
  onPage,
  onPageSize,
  onCreate,
  onExport,
}) {
  const hasFilters = search.trim() || status !== "All bookings";
  return (
    <section
      className="bookings-panel"
      aria-labelledby="bookings-heading"
      aria-busy={loading}
    >
      <div className="panel-heading">
        <div>
          <div className="heading-with-count">
            <h2 id="bookings-heading">Booking management</h2>
            {!loading && !error && (
              <span className="total-count">{pagination.total} matching</span>
            )}
          </div>
          <p>Every devotee. Every detail. All in one place.</p>
        </div>
        <button
          className="button button-secondary export-button"
          onClick={onExport}
          disabled={loading || Boolean(error) || !bookings.length}
        >
          <Download size={16} />
          Export page
        </button>
      </div>
      <div
        className="status-tabs"
        aria-label="Filter bookings by status; counts are across all bookings"
      >
        {["All bookings", ...statuses].map((item) => (
          <button
            key={item}
            aria-pressed={status === item}
            className={status === item ? "selected" : ""}
            onClick={() => onStatus(item)}
          >
            {item}
            {counts?.[item] !== undefined && <span>{counts[item]}</span>}
          </button>
        ))}
      </div>
      <div className="table-toolbar">
        <label className="search-input">
          <Search size={18} />
          <input
            type="search"
            maxLength={100}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search devotee, puja, phone…"
            aria-label="Search bookings"
          />
          <kbd>/</kbd>
        </label>
        <label className="sort-input">
          <ArrowDownUp size={15} />
          <select
            aria-label="Sort bookings"
            value={sort}
            onChange={(event) => onSort(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="date">Puja date: earliest</option>
            <option value="amount">Amount: highest</option>
            <option value="name">Devotee: A to Z</option>
          </select>
        </label>
      </div>
      {loading || error ? (
        <ApiState loading={loading} error={error} onRetry={onRetry} />
      ) : (
        <>
          <div
            className="table-scroll"
            role="region"
            aria-label="Booking records"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>BOOKING ID</th>
                  <th>DEVOTEE</th>
                  <th>PUJA & SCHEDULE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={booking._id}>
                    <td>
                      <a
                        className="booking-reference"
                        href={`#/bookings/${booking._id}`}
                      >
                        {bookingReference(booking)}
                      </a>
                      <small>
                        {formatDate(booking.createdAt, { year: undefined })}
                      </small>
                    </td>
                    <td>
                      <div className="devotee-cell">
                        <span className={`avatar avatar-${index % 4}`}>
                          {initials(booking.devotee.name)}
                        </span>
                        <div>
                          <strong>{booking.devotee.name}</strong>
                          <small>
                            {booking.devotee.email || booking.devotee.phone}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{booking.pujaName}</strong>
                      <small className="date-cell">
                        <CalendarDays size={12} />
                        {formatDate(booking.date)}
                      </small>
                    </td>
                    <td className="amount-cell">{currency(booking.amount)}</td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td>
                      <a
                        className="row-action"
                        href={`#/bookings/${booking._id}`}
                        aria-label={`View booking ${bookingReference(booking)}`}
                      >
                        <ArrowUpRight size={18} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 && (
            <div className="empty-state">
              <SearchX size={30} />
              <h3>{hasFilters ? "No bookings found" : "No bookings yet"}</h3>
              <p>
                {hasFilters
                  ? "Try another search or choose a different status."
                  : "Create your first booking to start managing puja services."}
              </p>
              <button
                className="text-button"
                onClick={
                  hasFilters
                    ? () => {
                        onSearch("");
                        onStatus("All bookings");
                      }
                    : onCreate
                }
              >
                {hasFilters ? "Clear filters" : "Create a booking"}
              </button>
            </div>
          )}
          <Pagination
            pagination={pagination}
            onPage={onPage}
            onPageSize={onPageSize}
          />
        </>
      )}
    </section>
  );
}
