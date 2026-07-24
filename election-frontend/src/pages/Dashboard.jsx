import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_votes: 0,
    total_results: 0,
    flags: 0,
  });

  const [activities, setActivities] = useState([]);
  const [pollingUnits, setPollingUnits] = useState({});
  const [usersCache, setUsersCache] = useState({}); // Populated dynamically by fetchUsers
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentRole = localStorage.getItem("role");

  const BACKEND_BASE_URL = "http://127.0.0.1:5000";

  useEffect(() => {
    API.get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch(() => alert("Failed to load dashboard metrics summary"));

    const fetchDashboardData = async () => {
      try {
        setLoadingActivities(true);

        // 1. Fetch recent activities stream
        const res = await API.get("/dashboard/recent-activities");
        const activityList = res.data;
        setActivities(activityList);

        // 2. Resolve location parameters
        const uniquePuIds = [...new Set(activityList.map(item => item.pu_id).filter(Boolean))];
        const locationCache = {};

        await Promise.all(
          uniquePuIds.map(async (id) => {
            try {
              const puRes = await API.get(`/locations/polling-unit/${id}`);
              locationCache[id] = {
                name: puRes.data.name || "Unknown Station Location",
                code: puRes.data.code || "N/A",
                ward: puRes.data.ward_name || puRes.data.ward?.name || "N/A",
                lga: puRes.data.lga_name || puRes.data.lga?.name || "N/A",
                state: puRes.data.state_name || puRes.data.state?.name || "N/A"
              };
            } catch (err) {
              console.error(`Could not resolve location metadata for PU ${id}:`, err);
              locationCache[id] = { name: "Unknown Station Location", code: "N/A", ward: "N/A", lga: "N/A", state: "N/A" };
            }
          })
        );

        setPollingUnits(locationCache);
      } catch (err) {
        console.error("Failed to load audit trail activities:", err);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (currentRole === "ADMIN") {
      fetchUsers();
    }
  }, [currentRole]);

  // Builds the dictionary cache structure needed by getAgentData
  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      const userMap = {};

      res.data.forEach((u) => {
        if (u.id) {
          userMap[String(u.id).toLowerCase()] = {
            full_name: u.full_name,
            phone: u.phone || "No phone provided"
          };
        }
      });

      setUsersCache(userMap);
    } catch (err) {
      console.log("Error fetching user data Matrix:", err);
    }
  };

  const handleOpenInspector = (activityItem) => {
    setSelectedActivity(activityItem);
    setIsModalOpen(true);
  };

  const getAgentData = (userMap) => {
    if (!userMap) return { full_name: "Unassigned Agent / System Node", phone: "N/A" };
    const normalizedKey = String(userMap).toLowerCase();
    return usersCache[normalizedKey] || { full_name: "Unassigned Agent / System Node", phone: "N/A" };
  };

  return (
    <div className="admin-dashboard-container">
      <h1 className="main-title">Dashboard Overview</h1>

      {/* Stats Summary Widgets */}
      <div className="stats-grid">
        <div className="stat-card total-votes">
          <div className="stat-value">{stats.total_votes.toLocaleString()}</div>
          <div className="stat-label">Total Votes Counted</div>
        </div>

        <div className="stat-card reported-pus">
          <div className="stat-value">{stats.total_results}</div>
          <div className="stat-label">Polling Units Reported</div>
        </div>

        <div className={`stat-card critical-flags ${stats.flags > 0 ? "has-flags" : "clear-flags"}`}>
          <div className="stat-value">{stats.flags}</div>
          <div className="stat-label">Flagged Critical Incidents</div>
        </div>
      </div>

      {/* Live Ledger Activity Streams */}
      <div className="activity-section">
        <h2 className="section-title">Live Node Audits & Activity Stream</h2>

        <div className="table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Type Context</th>
                <th>Polling Unit Location Node</th>
                <th>Administrative Tree Axis</th>
                <th>Metrics Payload</th>
                <th>Audit Status</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loadingActivities ? (
                <tr>
                  <td colSpan="7" className="table-state-message text-loading">
                    Resolving multi-tier spatial identity parameters...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-state-message">
                    No recent audit trails streaming...
                  </td>
                </tr>
              ) : (
                activities.map((item, index) => {
                  const resolvedLocation = pollingUnits[item.pu_id];
                  return (
                    <tr key={item.id || index}>
                      <td>
                        <span className={`badge-type ${item.type === "INCIDENT" ? "type-incident" : "type-result"}`}>
                          {item.type}
                        </span>
                      </td>
                      <td>
                        <strong className="location-node-title">
                          {resolvedLocation ? resolvedLocation.name : "Resolving Location..."}
                        </strong>
                        <small className="location-node-code">
                          {resolvedLocation?.code ? `Code: ${resolvedLocation.code}` : `ID: ${item.pu_id || "N/A"}`}
                        </small>
                      </td>
                      <td className="admin-axis-cell">
                        {resolvedLocation ? (
                          <div>
                            <strong>{resolvedLocation.state}</strong>, <small>{resolvedLocation.lga} LGA</small>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="payload-cell">
                        {item.type === "RESULT" ? (
                          <span>🗳️ {item.votes?.toLocaleString()} votes</span>
                        ) : (
                          <span className="text-warning-bold">⚠️ {item.incident_type}</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${item.flagged ? "flagged" : "normal"}`}>
                          {item.flagged ? "Flagged / Threat" : "Verified / Clear"}
                        </span>
                      </td>
                      <td className="timestamp-cell">{item.time}</td>
                      <td>
                        <button className="view-btn" onClick={() => handleOpenInspector(item)}>
                          Inspect Code Node
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Modal Viewport Overlay */}
      {isModalOpen && selectedActivity && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Data Layer Forensic Inspector</h3>
                <small>Node Transaction Reference ID: {selectedActivity.id}</small>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-map-banner">
                <strong className="banner-subtext">GEOPOLITICAL DISPOSITION MAP</strong>
                <span className="banner-maintext">
                  {pollingUnits[selectedActivity.pu_id]?.state || "Unspecified"} State &gt; {pollingUnits[selectedActivity.pu_id]?.lga || "Unspecified"} LGA &gt; Ward: {pollingUnits[selectedActivity.pu_id]?.ward || "Unspecified"}
                </span>
              </div>

              <div className="modal-grid-details">
                <div>
                  <strong className="detail-label">GEOGRAPHIC LOCATION POINT</strong>
                  <span className="detail-value">{pollingUnits[selectedActivity.pu_id]?.name || "Resolving..."} ({pollingUnits[selectedActivity.pu_id]?.code || selectedActivity.pu_id})</span>
                </div>
                <div>
                  <strong className="detail-label">AUDIT FLOW CONTEXT PROFILE</strong>
                  <span className="detail-value text-bold">{selectedActivity.type}</span>
                </div>
              </div>

              <div className="modal-divider"></div>
              <div className="modal-grid-details agent-details-row">
                <div>
                  <strong className="detail-label">ASSIGNED FIELD AGENT</strong>
                  <span className="detail-value text-bold">
                    👤 {getAgentData(selectedActivity.submitted_by || selectedActivity.user_id).full_name}
                  </span>
                </div>
                <div>
                  <strong className="detail-label">AGENT COMMUNICATIONS CHANNEL</strong>
                  <span className="detail-value">
                    📞 {getAgentData(selectedActivity.submitted_by || selectedActivity.user_id).phone}
                  </span>
                </div>
              </div>

              <div className="modal-divider"></div>

              <div className="modal-payload-content">
                {selectedActivity.type === "RESULT" ? (
                  <div>
                    <p className="payload-summary-text"><strong>Total Aggregation:</strong> {selectedActivity.votes?.toLocaleString()} Votes</p>
                    {selectedActivity.media_url && (
                      <div className="modal-image-wrapper">
                        <img src={`${BACKEND_BASE_URL}${selectedActivity.media_url}`} alt="EC8A Scan Evidence Layer" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="incident-narrative-box">
                    <p><strong>Classification:</strong> {selectedActivity.incident_type}</p>
                    <p><strong>Narrative:</strong> <span className="text-italic">"{selectedActivity.description}"</span></p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsModalOpen(false)} className="modal-dismiss-btn">
                Dismiss Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}