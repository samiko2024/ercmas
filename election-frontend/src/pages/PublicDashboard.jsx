import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/PublicDashboard.css";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#f97316", "#ef4444", "#06b6d4"];

function Card({ title, value }) {
  return (
    <div className="metric-card">
      <small className="card-title">{title}</small>
      <h2 className="card-value">{value}</h2>
    </div>
  );
}

export default function PublicDashboard() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("National"); // Default to global country view

  // Drill-down lists fetched from your geographic metadata endpoints
  const [statesList, setStatesList] = useState([]);
  const [lgasList, setLgasList] = useState([]);
  const [wardsList, setWardsList] = useState([]);
  const [puList, setPuList] = useState([]);

  // Selected UUID values
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedPu, setSelectedPu] = useState("");

  // Polling Unit Specific Data & EC8A Form Modal
  const [ec8aUrl, setEc8aUrl] = useState(null);
  const [puStatus, setPuStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [summary, setSummary] = useState({
    total_votes: 0,
    total_accredited: 0,
    turnout: 0,
    rejected_votes: 0
  });

  // Load Initial Metadata (States) for the selectors


  // Main Data Fetcher Engine dependent on chosen scope and IDs
  useEffect(() => {
    const fetchScopedResults = async () => {
      setLoading(true);
      try {
        let endpoint = "/public/results"; // National fallback

        if (activeFilter === "States" && selectedState) {
          endpoint = `/public/results/state/${selectedState}`;
        } else if (activeFilter === "LGAs" && selectedLga) {
          endpoint = `/public/results/lga/${selectedLga}`;
        } else if (activeFilter === "Wards" && selectedWard) {
          endpoint = `/public/results/ward/${selectedWard}`;
        } else if (activeFilter === "Polling Units" && selectedPu) {
          endpoint = `/public/results/polling-unit/${selectedPu}`;
        }

        const res = await API.get(endpoint);
        const data = res.data || {};

        setParties(data.parties || []);
        setSummary({
          total_votes: data.summary?.total_votes ?? 0,
          total_accredited: data.summary?.total_accredited ?? 0,
          turnout: data.summary?.turnout ?? 0,
          rejected_votes: data.summary?.rejected_votes ?? 0
        });

        // Capture EC8A attachment if looking at a single Polling Unit
        if (activeFilter === "Polling Units" && selectedPu) {
          setEc8aUrl(data.ec8a_url);
          setPuStatus(data.status || "PENDING");
        } else {
          setEc8aUrl(null);
        }
      } catch (err) {
        console.error("Error aggregating results context:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScopedResults();
  }, [activeFilter, selectedState, selectedLga, selectedWard, selectedPu]);

  // Handle cascading dropdown dependency resets
 // 1. Update the Initial States Loader to use the "/locations" prefix
useEffect(() => {
  const loadGeoMetadata = async () => {
    try {
      const res = await API.get("/locations/states");
      setStatesList(res.data || []);
    } catch (err) {
      console.error("Error loading geographic metadata tree:", err);
    }
  };
  loadGeoMetadata();
}, []);

// 2. Update the Cascading Handlers to match your path parameters layout
  // 1. Update the Initial States Loader to use the "/locations" prefix
    useEffect(() => {
      const loadGeoMetadata = async () => {
        try {
          const res = await API.get("/locations/states");
          setStatesList(res.data || []);
        } catch (err) {
          console.error("Error loading geographic metadata tree:", err);
        }
      };
      loadGeoMetadata();
    }, []);

    // 2. Update the Cascading Handlers to match your path parameters layout
    const handleStateChange = async (stateId) => {
      setSelectedState(stateId);
      setSelectedLga("");
      setSelectedWard("");
      setSelectedPu("");
      setLgasList([]);
      setWardsList([]);
      setPuList([]);

      if (stateId) {
        try {
          // Hits: /locations/lgas/<state_id>
          const res = await API.get(`/locations/lgas/${stateId}`);
          setLgasList(res.data || []);
        } catch (err) {
          console.error("Error loading LGAs:", err);
        }
      }
    };

    const handleLgaChange = async (lgaId) => {
      setSelectedLga(lgaId);
      setSelectedWard("");
      setSelectedPu("");
      setWardsList([]);
      setPuList([]);

      if (lgaId) {
        try {
          // Hits: /locations/wards/<lga_id>
          const res = await API.get(`/locations/wards/${lgaId}`);
          setWardsList(res.data || []);
        } catch (err) {
          console.error("Error loading Wards:", err);
        }
      }
    };

    const handleWardChange = async (wardId) => {
      setSelectedWard(wardId);
      setSelectedPu("");
      setPuList([]);

      if (wardId) {
        try {
          // Hits: /locations/polling-units/<ward_id>
          const res = await API.get(`/locations/polling-units/${wardId}`);
          setPuList(res.data || []);
        } catch (err) {
          console.error("Error loading Polling Units:", err);
        }
      }
    };

  const sortedParties = [...parties].sort((a, b) => b.votes - a.votes);
  const maxVotes = sortedParties.length > 0 ? sortedParties[0].votes : 1;

  return (
    <div className="app-wrapper">

      {/* PREMIUM ACTIONS HEADER BAR */}
      <header className="premium-header">
        <div className="header-container">
          <div className="brand-wrapper">
            <div className="logo-circle">
                <img src="/ndc-logo.png" className="flag" />
            </div>
            <div className="brand-text">
              <h1 className="main-title">VOTEGUARD</h1>
              <span className="sub-title">Live Verification Analytics</span>
            </div>
          </div>

          <nav className="nav-wrapper">
            <ul className="nav-list">
              {["National", "States", "LGAs", "Wards", "Polling Units"].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => setActiveFilter(item)}
                    className={`nav-button ${activeFilter === item ? "active" : ""}`}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="status-wrapper">
            <span className="pulse-dot" />
            <span className="status-text">Live Network Feed</span>
          </div>
        </div>
      </header>

      <main className="main-container">

        {/* DRILL DOWN FILTERS SELECTION CONSOLE */}
        {activeFilter !== "National" && (
          <div className="chart-box" style={{ marginBottom: "30px", padding: "20px" }}>
            <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#94a3b8", textTransform: "uppercase" }}>
              Geographic Filter Hierarchy
            </h4>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>

              {/* State Dropdown */}
              <select value={selectedState} onChange={(e) => handleStateChange(e.target.value)} style={customSelectStyle}>
                <option value="">-- Select State --</option>
                {statesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {/* LGA Dropdown */}
              {(activeFilter === "LGAs" || activeFilter === "Wards" || activeFilter === "Polling Units") && (
                <select value={selectedLga} onChange={(e) => handleLgaChange(e.target.value)} disabled={!selectedState} style={customSelectStyle}>
                  <option value="">-- Select LGA --</option>
                  {lgasList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              )}

              {/* Ward Dropdown */}
              {(activeFilter === "Wards" || activeFilter === "Polling Units") && (
                <select value={selectedWard} onChange={(e) => handleWardChange(e.target.value)} disabled={!selectedLga} style={customSelectStyle}>
                  <option value="">-- Select Ward --</option>
                  {wardsList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              )}

              {/* Polling Unit Dropdown */}
              {activeFilter === "Polling Units" && (
                <select value={selectedPu} onChange={(e) => setSelectedPu(e.target.value)} disabled={!selectedWard} style={customSelectStyle}>
                  <option value="">-- Select Polling Unit --</option>
                  {puList.map(p => <option key={p.id} value={p.id}>{p.name || `PU Code: ${p.code}`}</option>)}
                </select>
              )}

            </div>
          </div>
        )}

        {/* METRICS ROW CARDS */}
        <div className="cards-grid">
          <Card title="Ballots Counted" value={summary.total_votes.toLocaleString()} />
          <Card title="Accredited Electors" value={summary.total_accredited.toLocaleString()} />
          <Card title="Voter Turnout Metric" value={`${summary.turnout}%`} />
        </div>

        {/* COMPREHENSIVE PERFORMANCE ROW CARD */}
        <div className="chart-box">
          <div className="chart-header-block">
            <div>
              <h3 className="chart-title">Validated Performance Breakdown</h3>
              <p className="chart-subtitle">Ranked alignment matching certified ingestion criteria.</p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* Show Document Action Button if EC8A image path is verified */}
              {ec8aUrl && (
                <button onClick={() => setIsModalOpen(true)} style={premiumActionBtnStyle}>
                  📄 View Form EC8A Document
                </button>
              )}
              <span className="filter-badge">Scope: {activeFilter}</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>Re-aggregating secure regional data stream...</div>
          ) : sortedParties.length === 0 ? (
            <p className="no-data">Select structural nodes above to read location performance charts.</p>
          ) : (
            <div className="bar-chart-container">
              {sortedParties.map((party, index) => {
                const percentageOfMax = ((party.votes / maxVotes) * 100) || 0;
                const overallPercentage = summary.total_votes > 0
                  ? ((party.votes / summary.total_votes) * 100).toFixed(1)
                  : 0;

                return (
                  <div key={party.acronym || index} className="bar-row">
                    <div className="bar-label">{party.acronym}</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.max(percentageOfMax, 2)}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <div className="bar-value">
                      <span className="vote-count-number">{party.votes.toLocaleString()}</span>
                      <span className="percentage-string">({overallPercentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ========================================== */}
      {/* COMPLIANT EC8A DOCUMENT VIEW OVERLAY       */}
      {/* ========================================== */}
        {isModalOpen && (
          <div style={modalOverlayStyle} onClick={() => setIsModalOpen(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Official Form EC8A Scanned Output</h3>
                  <span style={{ fontSize: "12px", color: puStatus === "VERIFIED" ? "#10b981" : "#f59e0b" }}>
                    Status: {puStatus}
                  </span>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={modalCloseBtnStyle}>&times;</button>
              </div>
              <div style={modalBodyStyle}>
                {ec8aUrl ? (
                  /* ✅ FIX: Prepend your Flask API base url to the relative path string */
                  <img
                    src={`http://127.0.0.1:5000${ec8aUrl}`}
                    alt="Official Polling Unit EC8A Document Scan"
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                    ⚠️ No digital image proof transmitted by field agent for this node.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

    </div>
  );
}

/* ========================================== */
/* COMPONENT-SPECIFIC INTERACTIVE INLINE STYLES */
/* ========================================== */
const customSelectStyle = {
  background: "#0f172a",
  color: "#cbd5e1",
  border: "1px solid rgba(51, 65, 85, 0.8)",
  padding: "10px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  outline: "none",
  minWidth: "180px",
  cursor: "pointer"
};

const premiumActionBtnStyle = {
  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  color: "#fff",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.2)"
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(8px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
  padding: "20px"
};

const modalContentStyle = {
  background: "#1e293b",
  border: "1px solid rgba(51, 65, 85, 0.8)",
  borderRadius: "16px",
  width: "100%",
  maxWidth: "650px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  overflow: "hidden"
};

const modalHeaderStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const modalCloseBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  fontSize: "24px",
  cursor: "pointer",
  outline: "none"
};

const modalBodyStyle = {
  padding: "20px",
  maxHeight: "70vh",
  overflowY: "auto"
};