import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Flower2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import Modal from "./Modal.jsx";

function SidebarContent({ view, onNavigate, onHelp, counts }) {
  return (
    <div className="sidebar-content">
      <a
        className="brand"
        href="#/bookings"
        onClick={(event) => {
          event.preventDefault();
          onNavigate("Bookings");
        }}
      >
        <span className="brand-mark">
          <Flower2 size={27} strokeWidth={1.6} />
        </span>
        <span>
          Puja<span className="font-normal">Desk</span>
          <small>BOOKING MANAGEMENT</small>
        </span>
      </a>
      <div className="workspace">
        <span className="workspace-icon">
          <Flower2 size={19} />
        </span>
        <span>
          Temple workspace<small>Administrator</small>
        </span>
        <ChevronDown size={14} />
      </div>
      <p className="nav-label">WORKSPACE</p>
      <nav aria-label="Main navigation">
        {[
          [CalendarDays, "Bookings"],
          [BookOpen, "Puja services"],
        ].map(([Icon, label]) => (
          <button
            key={label}
            className={`nav-item ${view === label ? "active" : ""}`}
            onClick={() => onNavigate(label)}
            aria-current={view === label ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
            {label === "Bookings" && (
              <span className="nav-count">{counts}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="ritual-note">
          <Sparkles size={20} />
          <strong>Space for the sacred.</strong>
          <p>
            Less paperwork.
            <br />
            More meaningful moments.
          </p>
          <span>
            Made for your daily rituals <ArrowUpRight size={13} />
          </span>
        </div>
        <button className="nav-item help-link" onClick={onHelp}>
          <HelpCircle size={19} />
          Help & guide
          <ArrowUpRight size={14} />
        </button>
        <div className="sidebar-footer">
          <span className="online-dot" />
          Booking workspace<span>v1.0</span>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose, ...props }) {
  return (
    <>
      <aside className="sidebar">
        <SidebarContent {...props} />
      </aside>
      {open && (
        <Modal
          title="Your workspace"
          className="mobile-navigation"
          onClose={onClose}
        >
          <SidebarContent {...props} />
        </Modal>
      )}
    </>
  );
}
