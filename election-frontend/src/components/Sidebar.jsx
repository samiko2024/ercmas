import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/sidebar.css";

export default function Sidebar({ open, setOpen }) {
  const [role, setRole] = useState("");
  const location = useLocation();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole || "");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const formatRole = (str) => {
    if (!str) return "Authorized Operator";
    return str
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to close sidebar on mobile link click
  const handleLinkClick = () => {
    if (window.innerWidth <= 920) {
      setOpen(false);
    }
  };

  return (
    <aside className={`sidebar-panel ${open ? "is-open" : ""}`}>
      {/* Mobile Close Handle */}
      <button className="sidebar-close-trigger" onClick={() => setOpen(false)} aria-label="Close Navigation">
        ✕
      </button>

      {/* Brand Profile Architecture */}
      <div className="sidebar-identity-block">
        <div className="logo-wrapper">
          <img src="/ndc-logo.png" alt="NDC Logo" className="brand-emblem" />
        </div>
        <h2 className="brand-acronym">ERCMAS</h2>
        <div className="role-badge-container">
          <span className="role-pill">{formatRole(role)}</span>
        </div>
      </div>

      {/* Navigation Matrix */}
      <nav className="sidebar-navigation-links">
        {role === "POLLING_AGENT" && (
          <>
            <Link to="/submit" onClick={handleLinkClick} className={`nav-item-link ${location.pathname === "/submit" ? "is-active" : ""}`}>
              <span className="nav-icon">🗳️</span> Submit Result
            </Link>
            <Link to="/report-incident" onClick={handleLinkClick} className={`nav-item-link ${location.pathname === "/report-incident" ? "is-active" : ""}`}>
              <span className="nav-icon">⚠️</span> Report Incident
            </Link>
          </>
        )}

        {role === "WARD_AGENT" && (
          <Link to="/ward" onClick={handleLinkClick} className={`nav-item-link ${location.pathname === "/ward" ? "is-active" : ""}`}>
            <span className="nav-icon">📊</span> Ward Dashboard
          </Link>
        )}

        {role === "ADMIN" && (
          <>
            <Link to="/dashboard" onClick={handleLinkClick} className={`nav-item-link ${location.pathname === "/dashboard" ? "is-active" : ""}`}>
              <span className="nav-icon">🖥️</span> Dashboard Overview
            </Link>
            <Link to="/admin/flags" onClick={handleLinkClick} className={`nav-item-link ${location.pathname === "/admin/flags" ? "is-active" : ""}`}>
              <span className="nav-icon">🚩</span> Flagged Incidents
            </Link>
            <Link to="/admin" onClick={handleLinkClick} className={`nav-item-link ${location.pathname === "/admin" ? "is-active" : ""}`}>
              <span className="nav-icon">👥</span> User Deployment
            </Link>
            <Link to="/admin/location" onClick={handleLinkClick} className={`nav-item-link ${location.pathname === "/admin/location" ? "is-active" : ""}`}>
              <span className="nav-icon">📍</span> Manage Locations
            </Link>
            <Link to="/admin/national-reports" onClick={handleLinkClick} className={`nav-item-link ${location.pathname === "/admin/upload-pu" ? "is-active" : ""}`}>
              <span className="nav-icon">📤</span> Ward Agent Report
            </Link>

          </>
        )}
      </nav>

      {/* Secure Terminal Exit */}
      <div className="sidebar-action-footer">
        <button onClick={handleLogout} className="secure-logout-trigger">
          <span className="logout-icon">🔓</span> Logout Terminal
        </button>
      </div>
    </aside>
  );
}