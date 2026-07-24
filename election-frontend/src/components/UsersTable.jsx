import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/admin.css";
import "../styles/protectedRoute.css";

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const currentRole = localStorage.getItem("role");

  useEffect(() => {
    if (currentRole === "ADMIN") {
      fetchUsers();
    }
  }, [currentRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching user data Matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ Premium Component Security Check
  if (currentRole !== "ADMIN") {
    return (
      <div className="premium-denied-container">
        <div className="premium-denied-card animate-fade">
          <div className="denied-security-shield">
            <span className="shield-lock-icon">🔒</span>
          </div>
          <h1>Terminal Access Denied</h1>
          <p className="denied-status-code">SECURITY PROTOCOL LAYER: THREAT LEVEL ALPHA</p>
          <p className="denied-message">
            Your credentials do not match the required administrative authorization tier to read, audit, or monitor global system node registries.
          </p>
          <div className="denied-audit-footer">
            <span>AUDIT ID: {Math.floor(100000 + Math.random() * 900000)}</span>
            <span>•</span>
            <span>AUTOMATIC INCIDENT LOGGED</span>
          </div>
        </div>
      </div>
    );
  }

  // ⚡ FILTER: Strictly active administrators matching the search query
  const adminUsers = users.filter((u) => {
    const isAdmin = u.role === "ADMIN";
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return isAdmin && matchesSearch;
  });

  return (
    <div className="premium-table-container animate-fade">
      {/* 📊 High-Density Header Panel */}
      <div className="table-header-zone">
        <div className="header-text-group">
          <h2>Administrative Infrastructure Directory</h2>
          <p className="subtitle">Operational directory of security nodes, core system managers, and audit commanders</p>
        </div>

        {/* Real-time system stats banner */}
        <div className="system-stats-banner">
          <div className="stat-card-mini">
            <span className="stat-label">Active Nodes</span>
            <span className="stat-value">{adminUsers.length}</span>
          </div>
        </div>
      </div>

      {/* 🔍 Interactive Control Toolbar */}
      <div className="table-control-toolbar">
        <div className="search-wrapper-premium">
          <span className="search-icon-svg">🔍</span>
          <input
            type="text"
            className="premium-search-input"
            placeholder="Search credentials, email endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 🗃️ Responsive Premium Table Wrap */}
      <div className="premium-responsive-table-wrapper">
        <table className="premium-data-table">
          <thead>
            <tr>
              <th>Node Identifier</th>
              <th>Email Endpoint</th>
              <th>Communication Channel</th>
              <th className="align-right">Authorization Level</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4">
                  <div className="table-skeleton-loader">
                    <div className="spinner-mini"></div>
                    <span>Resolving cryptographic directory records...</span>
                  </div>
                </td>
              </tr>
            ) : adminUsers.length === 0 ? (
              <tr>
                <td colSpan="4">
                  <div className="table-empty-premium">
                    <span className="empty-icon">📁</span>
                    <h4>No Admin Nodes Resolved</h4>
                    <p>Modify your search criteria or review local administrative database schemas.</p>
                  </div>
                </td>
              </tr>
            ) : (
              adminUsers.map((u) => {
                const initial = u.full_name ? u.full_name.charAt(0).toUpperCase() : "A";
                return (
                  <tr key={u.id} className="table-interactive-row">
                    {/* User Node Info Column */}
                    <td>
                      <div className="user-profile-cell">
                        <div className="cell-avatar-monogram">{initial}</div>
                        <div className="cell-text-stack">
                          <span className="cell-primary-name">{u.full_name}</span>
                          <span className="cell-secondary-meta">ID: #{String(u.id).padStart(5, '0')}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email Endpoint */}
                    <td className="monospace-cell">{u.email}</td>

                    {/* Communication Phone */}
                    <td className="monospace-cell">{u.phone || "Offline Node"}</td>

                    {/* Authority Level Badge */}
                    <td className="align-right">
                      <span className="premium-role-badge">
                        <span className="status-dot"></span>
                        Administrator
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}