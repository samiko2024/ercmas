import { useState } from "react";
import Sidebar from "./Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import "../styles/layout.css";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Check if the current route belongs to a Field Agent action screen
  const isFieldAgentRoute =
    location.pathname === "/submit" ||
    location.pathname === "/report-incident";

  // Assign header text dynamically based on the active path evaluation
  const headerContextBadge = isFieldAgentRoute ? "Field Agent Portal" : "National Command Office";

  return (
    <div className="app-layout">
      {/* Pinned Left Sidebar Wrapper */}
      <div className={`sidebar-wrapper ${open ? "show" : ""}`}>
        <Sidebar open={open} setOpen={setOpen} />
      </div>

      {/* Main Content Workspace */}
      <div className="main-area">

        {/* Mobile View Navigation Header */}
        <div className="mobile-topbar">
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Open Navigation Menu">
            ☰
          </button>
          <span className="mobile-title">ERCMAS</span>
        </div>

        {/* Desktop View Fixed Premium Navigation Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <img src="/coat-of-arms.png" className="coat" alt="Coat of Arms" />
            <img src="/ndc-logo.png" className="ndc" alt="NDC Logo" />
          </div>
          <h2>Election Results Collation Monitoring & Audit System</h2>

          {/* DYNAMIC METADATA BADGE TEXT */}
          <div className="header-right">{headerContextBadge}</div>
        </header>

        {/* Independent Sub-Route Scrolling Viewport Canvas */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}