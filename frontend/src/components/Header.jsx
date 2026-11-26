import { Bell, ChevronRight, Menu } from "lucide-react";

export default function Header({
  view,
  onMenu,
  onNotifications,
  pendingCount,
}) {
  const date = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <header className="header">
      <div className="header-left">
        <button
          className="icon-button menu-button"
          aria-label="Open navigation"
          onClick={onMenu}
        >
          <Menu size={22} />
        </button>
        <span className="breadcrumb">Workspace</span>
        <ChevronRight size={14} className="breadcrumb" />
        <span className="header-page">{view}</span>
      </div>
      <div className="header-right">
        <span className="header-date">{date}</span>
        <button
          className="icon-button notification-button"
          aria-label={
            pendingCount === undefined
              ? "Open notifications"
              : `Notifications: ${pendingCount} pending bookings`
          }
          onClick={onNotifications}
        >
          <Bell size={19} />
          {pendingCount > 0 && <span className="notification-dot" />}
        </button>
        <span className="header-divider" />
        <div className="avatar admin-avatar">AD</div>
        <div className="admin-label">
          Admin<small>Workspace owner</small>
        </div>
      </div>
    </header>
  );
}
