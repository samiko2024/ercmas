import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminFlags() {
  const [incidents, setIncidents] = useState([]);
  const [pollingUnits, setPollingUnits] = useState({}); // Stores cached spatial hierarchy context profiles
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");

  // Modal tracking states for forensic view detail inspector
  const [activeIncident, setActiveIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const BACKEND_BASE_URL = "http://127.0.0.1:5000";

  useEffect(() => {
    const fetchIncidentsAndResolveLocations = async () => {
      try {
        setLoading(true);

        // 1️⃣ Pull current live activity stream records matching your dashboard prefix path
        const res = await API.get("/dashboard/recent-activities");

        // Filter out only INCIDENT profiles from the composite stream
        const onlyIncidents = res.data.filter(item => item.type === "INCIDENT" || item.flagged === true);
        setIncidents(onlyIncidents);

        // 2️⃣ Scan through incidents and asynchronously resolve dynamic Polling Unit names along with administrative parents
        const uniquePuIds = [...new Set(onlyIncidents.map(item => item.pu_id).filter(Boolean))];
        const locationCache = {};

        await Promise.all(
          uniquePuIds.map(async (id) => {
            try {
              const puRes = await API.get(`/locations/polling-unit/${id}`);

              // Map out full geo-hierarchy matching your nested schema architecture properties safely
              locationCache[id] = {
                name: puRes.data.name || "Unknown Station Location",
                code: puRes.data.code || "N/A",
                ward: puRes.data.ward_name || puRes.data.ward?.name || "Unspecified Ward",
                lga: puRes.data.lga_name || puRes.data.lga?.name || "Unspecified LGA",
                state: puRes.data.state_name || puRes.data.state?.name || "Unspecified State"
              };
            } catch (err) {
              console.error(`Could not resolve location metadata hierarchy for PU ${id}:`, err);
              locationCache[id] = {
                name: "Unknown Station Location",
                code: "N/A",
                ward: "N/A",
                lga: "N/A",
                state: "N/A"
              };
            }
          })
        );

        setPollingUnits(locationCache);
      } catch (err) {
        console.error("Failed to synchronize critical anomaly streams:", err);
        alert("System Error: Unable to sync active threat vectors.");
      } finally {
        setLoading(false);
      }
    };

    fetchIncidentsAndResolveLocations();
  }, []);

  const handleInspectDetail = (incidentObj) => {
    setActiveIncident(incidentObj);
    setIsModalOpen(true);
  };

  // Filtered dataset compiled dynamically matching search parameters
  const filteredIncidents = incidents.filter((item) => {
    const resolvedPu = pollingUnits[item.pu_id] || {};
    const puName = resolvedPu.name || "";
    const puCode = resolvedPu.code || "";
    const puWard = resolvedPu.ward || "";
    const puLga = resolvedPu.lga || "";
    const puState = resolvedPu.state || "";

    const matchesSearch =
      puName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puWard.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puLga.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puState.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = selectedType === "ALL" || item.incident_type === selectedType;

    return matchesSearch && matchesTab;
  });

  return (
    <div style={{ padding: "30px", background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#0f172a", fontWeight: "700" }}>Critical Security & Operational Flags</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b" }}>Audit tracker for anomalies, systemic violence, and result interferences mapped across regional geopolitical nodes.</p>
        </div>
        <div style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "20px", fontWeight: "600", fontSize: "14px" }}>
          🚨 {filteredIncidents.length} Active Incidents Located
        </div>
      </div>

      {/* Controls Panel */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <input
          type="text"
          placeholder="Search by Station Name, Code, Ward, LGA, State, or narrative description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "10px 14px", width: "420px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none" }}
        />

        <div style={{ display: "flex", gap: "8px" }}>
          {["ALL", "Violence", "Result Manipulation", "Irregularity", "Equipment Failure"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedType(tab)}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: selectedType === tab ? "#0f172a" : "#f1f5f9",
                color: selectedType === tab ? "#fff" : "#334155",
                fontWeight: "500",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Interface */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontStyle: "italic" }}>Mapping multi-tier geographical verification tree...</div>
      ) : filteredIncidents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "8px", color: "#64748b", border: "1px dashed #cbd5e1" }}>
          🎉 Clean Slate: No active spatial exceptions matched your selection criteria.
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#fff", fontSize: "14px" }}>
                <th style={{ padding: "14px" }}>Classification</th>
                <th style={{ padding: "14px" }}>Resolved Polling Unit Name</th>
                <th style={{ padding: "14px" }}>Administrative Context Hierarchy</th>
                <th style={{ padding: "14px" }}>Timestamp</th>
                <th style={{ padding: "14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident, index) => {
                const resolvedLocation = pollingUnits[incident.pu_id];
                return (
                  <tr key={incident.id || index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px" }}>
                      <span style={{
                        fontWeight: "700", fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 8px", borderRadius: "4px",
                        background: incident.incident_type === "Violence" ? "rgba(220, 38, 38, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        color: incident.incident_type === "Violence" ? "#dc2626" : "#d97706"
                      }}>
                        {incident.incident_type || "Anomaly"}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>
                        {resolvedLocation ? `${resolvedLocation.name}` : "Resolving Location..."}
                      </div>
                      <small style={{ color: "#64748b", fontFamily: "monospace" }}>
                        {resolvedLocation?.code ? `Code: ${resolvedLocation.code}` : `ID: ${incident.pu_id}`}
                      </small>
                    </td>
                    <td style={{ padding: "16px", color: "#334155", fontSize: "14px" }}>
                      {resolvedLocation ? (
                        <div>
                          <span style={{ fontWeight: "500" }}>{resolvedLocation.state} State</span>
                          <span style={{ color: "#94a3b8", margin: "0 6px" }}>•</span>
                          <span>{resolvedLocation.lga} LGA</span>
                          <span style={{ color: "#94a3b8", margin: "0 6px" }}>•</span>
                          <span style={{ color: "#64748b" }}>Ward: {resolvedLocation.ward}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Loading tree structures...</span>
                      )}
                    </td>
                    <td style={{ padding: "16px", color: "#64748b", fontSize: "13px" }}>
                      {incident.time}
                    </td>
                    <td style={{ padding: "16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleInspectDetail(incident)}
                        style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                      >
                        Investigate Flag
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* DETAILED INVESTIGATION MODAL OVERLAY MAPPED VIA CACHE    */}
      {/* ======================================================== */}
      {isModalOpen && activeIncident && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: "#fff", width: "680px", maxHeight: "85vh", borderRadius: "12px", padding: "28px", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={(e) => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", background: "#ef4444", color: "#fff", padding: "3px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                  CRITICAL EXIGENCY FORENSICS
                </span>
                <h3 style={{ margin: "6px 0 0 0", fontSize: "20px", color: "#0f172a" }}>Incident Vector Analysis</h3>
                <small style={{ color: "#64748b" }}>Reference Transaction ID: {activeIncident.id}</small>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#94a3b8", marginTop: "-10px" }}>&times;</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "15px", color: "#334155" }}>

              {/* Upgraded Administrative Context Dashboard Grid Box */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ gridColumn: "1 / -1", borderBottom: "1px dashed #cbd5e1", paddingBottom: "8px" }}>
                  <strong style={{ display: "block", fontSize: "11px", color: "#ef4444", fontWeight: "700", letterSpacing: "0.5px" }}>POLITICAL BOUNDARY AXIS</strong>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                    {pollingUnits[activeIncident.pu_id]?.state} State &gt; {pollingUnits[activeIncident.pu_id]?.lga} LGA &gt; Ward: {pollingUnits[activeIncident.pu_id]?.ward}
                  </span>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "12px", color: "#64748b" }}>RESOLVED POLLING UNIT NAME</strong>
                  <span style={{ fontWeight: "500" }}>{pollingUnits[activeIncident.pu_id]?.name || "Resolving..."}</span>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "12px", color: "#64748b" }}>STATION CODE REFERENCE</strong>
                  <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{pollingUnits[activeIncident.pu_id]?.code || activeIncident.pu_id}</span>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "12px", color: "#64748b" }}>CLASSIFICATION VECTOR</strong>
                  <span style={{ color: "#b91c1c", fontWeight: "600" }}>{activeIncident.incident_type}</span>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "12px", color: "#64748b" }}>TIMESTAMP CAPTURE</strong>
                  <span>{activeIncident.time}</span>
                </div>
              </div>

              <div>
                <strong style={{ display: "block", color: "#0f172a", marginBottom: "6px" }}>Agent Field Statement Narrative:</strong>
                <div style={{ background: "#fff5f5", borderLeft: "4px solid #ef4444", padding: "12px", borderRadius: "0 6px 6px 0", fontStyle: "italic", lineHeight: "1.6", color: "#991b1b" }}>
                  "{activeIncident.description || "No supplemental comments provided."}"
                </div>
              </div>

              <div>
                <strong style={{ display: "block", color: "#0f172a", marginBottom: "6px" }}>Transmitted Field Evidence Asset Proof:</strong>
                {activeIncident.media_url ? (
                  activeIncident.media_url.toLowerCase().endsWith(".mp4") || activeIncident.media_url.toLowerCase().endsWith(".mov") ? (
                    <video src={`${BACKEND_BASE_URL}${activeIncident.media_url}`} controls style={{ width: "100%", borderRadius: "8px", border: "1px solid #cbd5e1", maxHeight: "350px", background: "#000" }} />
                  ) : (
                    <img
                      src={`${BACKEND_BASE_URL}${activeIncident.media_url}`}
                      alt="Forensic scan payload asset"
                      style={{ width: "100%", maxHeight: "350px", objectFit: "contain", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9" }}
                      onError={(e) => { e.target.src = "https://placehold.co/600x400?text=Asset+Not+Found+On+Server"; }}
                    />
                  )
                ) : (
                  <div style={{ textAlign: "center", padding: "30px", background: "#f1f5f9", borderRadius: "8px", color: "#94a3b8", fontStyle: "italic" }}>
                    ⚠️ No media asset transmissions compiled for this exception context.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "8px 16px", background: "#cbd5e1", border: "none", borderRadius: "6px", color: "#334155", fontWeight: "600", cursor: "pointer" }}>
                Dismiss View
              </button>
              <button onClick={() => { alert("Flag transmitted directly to field action command centers."); setIsModalOpen(false); }} style={{ padding: "8px 16px", background: "#0f172a", border: "none", borderRadius: "6px", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
                Escalate Node
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}