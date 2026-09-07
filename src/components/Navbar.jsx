import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaHome, FaSignOutAlt, FaUserShield, FaInbox, FaBell, FaCheck } from "react-icons/fa";
import { getNotificationsForCurrentUser, markAllNotificationsRead, markNotificationRead } from "../services/notifications";
import "./Navbar.css";

function Navbar({ admin = false }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(() => getNotificationsForCurrentUser());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setNotifications(getNotificationsForCurrentUser());
    window.addEventListener("lostfound:notifications", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("lostfound:notifications", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const go = (path) => navigate(path);
  const handleLogout = () => { localStorage.removeItem("currentUser"); setOpen(false); alert("Logged out successfully"); navigate("/login"); };

  return (
    <nav className={`navbar ${admin ? "navbar-admin" : "navbar-user"}`}>
      <button className="navbar-logo" onClick={() => go(admin ? "/admin-dashboard" : "/dashboard")}>
        <span className="brand-mark"><FaBoxOpen /></span>
        <span className="brand-copy"><strong>Lost & Found</strong><small>{admin ? "Admin workspace" : "Smart recovery centre"}</small></span>
      </button>
      <div className="navbar-links">
        {!admin && (
          <div className="notification-wrap">
            <button className="notification-button" onClick={() => setOpen((value) => !value)} aria-label="Notifications">
              <FaBell />
              {notifications.filter((item) => !item.read).length > 0 && <span className="notification-count">{notifications.filter((item) => !item.read).length}</span>}
            </button>
            {open && (
              <div className="notification-panel">
                <div className="notification-header"><strong>Notifications</strong>{notifications.some((item) => !item.read) && <button onClick={markAllNotificationsRead}><FaCheck /> Mark all read</button>}</div>
                {!notifications.length ? <p className="notification-empty">No notifications yet.</p> : notifications.slice(0, 8).map((item) => (
                  <button key={item.id} className={`notification-item ${item.read ? "read" : "unread"}`} onClick={() => markNotificationRead(item.id)}>
                    <strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString()}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button onClick={() => go(admin ? "/admin-dashboard" : "/dashboard")}>🏠 <span>Dashboard</span></button>
        {!admin && <button onClick={() => go("/report-lost-item")}>🧳 <span>Report Lost</span></button>}
        {!admin && <button onClick={() => go("/report-found-item")}>📦 <span>Report Found</span></button>}
        {!admin && <button onClick={() => go("/ai-matches")}>🤖 <span>AI Match</span></button>}
        {!admin && <button onClick={() => go("/my-claims")}>🛡️ <span>My Claims</span></button>}
        {admin && <button onClick={() => go("/admin-found-intake")}><FaInbox/> <span>Found Intake</span></button>}
        {admin && <button onClick={() => go("/admin-claims")}><FaUserShield/> <span>Claim Reviews</span></button>}
        <button className="logout-nav" onClick={handleLogout}><FaSignOutAlt/> <span>Logout</span></button>
      </div>
    </nav>
  );
}
export default Navbar;
