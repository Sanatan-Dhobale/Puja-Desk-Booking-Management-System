import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  IndianRupee,
  Hourglass,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import StatCard from "./components/StatCard.jsx";
import BookingTable from "./components/BookingTable.jsx";
import BookingDetailsPage from "./components/BookingDetailsPage.jsx";
import ServicesPanel from "./components/ServicesPanel.jsx";
import ApiState from "./components/ApiState.jsx";
import Modal from "./components/Modal.jsx";
import { BookingForm } from "./components/BookingDialogs.jsx";
import { sortOptions } from "./constants.js";
import {
  createBooking,
  getBookings,
  errorMessage,
} from "./services/bookingApi.js";
import { currency, exportBookings } from "./utils.js";

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
  });
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All bookings");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [toast, setToast] = useState("");
  const detailId = route.startsWith("#/bookings/")
    ? route.slice("#/bookings/".length)
    : null;
  const isDetail = detailId !== null;
  const view = route === "#/services" ? "Puja services" : "Bookings";
  const closeDialog = useCallback(() => {
    if (!creating) setDialog(null);
  }, [creating]);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    function onHashChange() {
      setRoute(window.location.hash);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function searchShortcut(event) {
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName,
        )
      ) {
        const input = document.querySelector('[aria-label="Search bookings"]');
        if (input) {
          event.preventDefault();
          input.focus();
        }
      }
    }
    document.addEventListener("keydown", searchShortcut);
    return () => document.removeEventListener("keydown", searchShortcut);
  }, []);

  useEffect(() => {
    if (isDetail) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    // A short delay avoids a request for every keystroke. Cleanup cancels old requests.
    const timeout = setTimeout(async () => {
      try {
        const params = { page, limit: pageSize, ...sortOptions[sort] };
        if (search.trim()) params.search = search.trim();
        if (status !== "All bookings") params.status = status;
        const result = await getBookings(params, controller.signal);
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, result.pagination.totalPages);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setBookings(result.data);
        setPagination(result.pagination);
        setLoading(false);
      } catch (error) {
        if (!controller.signal.aborted) {
          setBookings([]);
          setError(errorMessage(error));
          setLoading(false);
        }
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, status, sort, page, pageSize, revision, isDetail]);

  useEffect(() => {
    const controller = new AbortController();
    setSummary(null);
    setSummaryError("");
    async function loadSummary() {
      try {
        // Existing list endpoints provide global counts without downloading every record.
        const [all, pending, confirmed, inProgress, completed] =
          await Promise.all([
            getBookings({ limit: 1 }, controller.signal),
            getBookings({ status: "Pending", limit: 5 }, controller.signal),
            getBookings({ status: "Confirmed", limit: 1 }, controller.signal),
            getBookings({ status: "In Progress", limit: 1 }, controller.signal),
            getBookings({ status: "Completed", limit: 1 }, controller.signal),
          ]);
        if (!controller.signal.aborted)
          setSummary({
            counts: {
              "All bookings": all.pagination.total,
              Pending: pending.pagination.total,
              Confirmed: confirmed.pagination.total,
              "In Progress": inProgress.pagination.total,
              Completed: completed.pagination.total,
            },
            pending: pending.data,
          });
      } catch (error) {
        if (!controller.signal.aborted) setSummaryError(errorMessage(error));
      }
    }
    loadSummary();
    return () => controller.abort();
  }, [revision]);

  function navigate(nextView) {
    window.location.hash =
      nextView === "Puja services" ? "/services" : "/bookings";
    setSidebarOpen(false);
    setSearch("");
    setStatus("All bookings");
    setPage(1);
  }

  function refresh(message) {
    setRevision((value) => value + 1);
    if (message) setToast(message);
  }

  function openCreate() {
    setCreateError("");
    setDialog("create");
  }

  async function submitBooking(values) {
    if (creating) return;
    setCreating(true);
    setCreateError("");
    try {
      await createBooking(values);
      setDialog(null);
      navigate("Bookings");
      setSort("newest");
      refresh("Booking created and saved to MongoDB.");
    } catch (error) {
      setCreateError(errorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  const counts = summary?.counts;
  const pageValue = bookings.reduce((sum, booking) => sum + booking.amount, 0);
  const pageActions = {
    onPage: setPage,
    onPageSize: (value) => {
      setPageSize(value);
      setPage(1);
    },
  };

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        view={view}
        onNavigate={navigate}
        onHelp={() => {
          setSidebarOpen(false);
          setDialog("help");
        }}
        counts={counts?.["All bookings"] ?? "—"}
      />
      <div className="main-shell">
        <Header
          view={isDetail ? "Booking details" : view}
          onMenu={() => setSidebarOpen(true)}
          onNotifications={() => setDialog("notifications")}
          pendingCount={counts?.Pending}
        />
        <main>
          {isDetail ? (
            <BookingDetailsPage
              key={detailId}
              id={detailId}
              onSaved={refresh}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span />
                    YOUR DAILY WORKSPACE
                  </div>
                  <h1>
                    {view === "Bookings" ? "All bookings" : "Puja services"}
                  </h1>
                  <p>A little clarity for every sacred commitment.</p>
                </div>
                <button className="button button-primary" onClick={openCreate}>
                  <Plus size={18} />
                  New booking
                </button>
              </div>
              {summaryError && (
                <div className="summary-error" role="alert">
                  <span>Statistics unavailable: {summaryError}</span>
                  <button className="text-button" onClick={() => refresh()}>
                    Retry statistics
                  </button>
                </div>
              )}
              {view !== "Puja services" ? (
                <>
                  <div className="stats-grid">
                    <StatCard
                      label="Total bookings"
                      value={counts?.["All bookings"] ?? "—"}
                      note="Across all puja services"
                      icon={CalendarDays}
                    />
                    <StatCard
                      label="Pending bookings"
                      value={counts?.Pending ?? "—"}
                      note="Awaiting confirmation"
                      icon={Hourglass}
                      accent="saffron"
                    />
                    <StatCard
                      label="Confirmed bookings"
                      value={counts?.Confirmed ?? "—"}
                      note="Ready for the sacred day"
                      icon={CalendarCheck2}
                      accent="green"
                    />
                    <StatCard
                      label="In progress"
                      value={counts?.["In Progress"] ?? "—"}
                      note="Rituals underway"
                      icon={Clock3}
                      accent="violet"
                    />
                    <StatCard
                      label="Completed bookings"
                      value={counts?.Completed ?? "—"}
                      note="Rituals completed"
                      icon={Check}
                      accent="green"
                    />
                    <StatCard
                      label="Page booking value"
                      value={loading || error ? "—" : currency(pageValue)}
                      note="Loaded page only · not payments"
                      icon={IndianRupee}
                      accent="saffron"
                    />
                  </div>
                  <BookingTable
                    bookings={bookings}
                    pagination={pagination}
                    counts={counts}
                    loading={loading}
                    error={error}
                    onRetry={() => refresh()}
                    search={search}
                    onSearch={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                    status={status}
                    onStatus={(value) => {
                      setStatus(value);
                      setPage(1);
                    }}
                    sort={sort}
                    onSort={(value) => {
                      setSort(value);
                      setPage(1);
                    }}
                    {...pageActions}
                    onCreate={openCreate}
                    onExport={() => {
                      exportBookings(bookings);
                      setToast("Current page exported as CSV.");
                    }}
                  />
                </>
              ) : (
                <ServicesPanel
                  bookings={bookings}
                  pagination={pagination}
                  loading={loading}
                  error={error}
                  onRetry={() => refresh()}
                  {...pageActions}
                  onSelect={(name) => {
                    navigate("Bookings");
                    setSearch(name);
                  }}
                />
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={14} />A thoughtful workspace for meaningful
              moments.
            </span>
            <span>
              Booking management <span className="footer-dot">·</span>Express +
              MongoDB
            </span>
          </footer>
        </main>
      </div>
      {dialog && (
        <Modal
          key={dialog}
          title={
            dialog === "create"
              ? "Create a new booking"
              : dialog === "help"
                ? "A little help, when you need it"
                : "Workspace notifications"
          }
          onClose={closeDialog}
        >
          {dialog === "create" && (
            <BookingForm
              onSubmit={submitBooking}
              onCancel={closeDialog}
              saving={creating}
              serverError={createError}
            />
          )}
          {dialog === "notifications" && (
            <div className="notifications">
              {!summary ? (
                <ApiState
                  loading={!summaryError}
                  error={summaryError}
                  onRetry={() => refresh()}
                />
              ) : (
                <>
                  <p className="modal-description">
                    {counts.Pending} bookings are waiting for confirmation.
                    Showing the latest {summary.pending.length}.
                  </p>
                  {summary.pending.map((booking) => (
                    <a
                      key={booking._id}
                      className="notification-link"
                      href={`#/bookings/${booking._id}`}
                      onClick={closeDialog}
                    >
                      <span className="notification-icon">
                        <Clock3 size={18} />
                      </span>
                      <span>
                        <strong>{booking.devotee.name}</strong>
                        <small>{booking.pujaName} · Pending</small>
                      </span>
                      <ChevronRight size={17} />
                    </a>
                  ))}
                  {counts.Pending === 0 ? (
                    <p>You’re all caught up.</p>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => {
                        navigate("Bookings");
                        setStatus("Pending");
                        closeDialog();
                      }}
                    >
                      View all pending bookings
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          {dialog === "help" && (
            <div className="help-content">
              <CircleHelp size={28} />
              <p>
                Your bookings are loaded from MongoDB through the Express API.
                New bookings and status updates are saved to the database.
              </p>
              <h3>Find a booking</h3>
              <p>
                Search by devotee, phone, email, or puja name. Filters and
                sorting apply to all matching database records. The page
                controls use totals returned by the API.
              </p>
              <h3>Understand your booking statistics</h3>
              <p>
                Status counts cover all bookings. Booking value, service
                summaries, and CSV export cover only the loaded page. Open a
                booking to view its full details and save a status change.
              </p>
              <button className="button button-primary" onClick={closeDialog}>
                Got it
                <Check size={16} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {toast}
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
