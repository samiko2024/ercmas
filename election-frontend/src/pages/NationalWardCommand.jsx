import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import "../styles/nationalCommand.css";

export default function NationalWardCommand() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedState, setSelectedState] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Zoom / Pan / Rotate Interactive State Variables
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);
  const BACKEND_BASE_URL = "http://127.0.0.1:5000";

  const fetchCommandData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/ward/national-reports");
      setReports(res.data);
      setFilteredReports(res.data);
    } catch (err) {
      console.error("Failed to load national data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandData();
  }, []);

  // Filter evaluation loop
  useEffect(() => {
    let result = reports;
    if (selectedState !== "ALL") {
      result = result.filter(r => r.state_name.toLowerCase() === selectedState.toLowerCase());
    }
    if (statusFilter !== "ALL") {
      const targetFlag = statusFilter === "FLAGGED";
      result = result.filter(r => r.has_anomalies === targetFlag);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        r => r.ward_name.toLowerCase().includes(q) ||
             r.lga_name.toLowerCase().includes(q) ||
             r.submitted_by_name.toLowerCase().includes(q)
      );
    }
    setFilteredReports(result);
  }, [selectedState, statusFilter, searchQuery, reports]);

  const uniqueStates = ["ALL", ...new Set(reports.map(r => r.state_name))];

  const metrics = {
    totalReports: reports.length,
    totalVotesCounted: reports.reduce((acc, curr) => acc + curr.total_votes, 0),
    flaggedIncidents: reports.filter(r => r.has_anomalies).length,
  };

  // Reset image view transforms on close or new selection
  const resetImageTransform = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setRotationAngle(0);
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotateRight = () => setRotationAngle(prev => (prev + 90) % 360);

  // Dragging Implementation (Pan)
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse Scroll Wheel Zoom Integration
  const handleWheelZoom = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    if (e.deltaY < 0) {
      setZoomScale(prev => Math.min(prev + zoomIntensity, 4));
    } else {
      setZoomScale(prev => Math.max(prev - zoomIntensity, 0.5));
    }
  };

  return (
    <div className="national-command-container">
      <div className="command-hero-header">
        <div className="live-indicator-tag">
          <span className="pulse-dot"></span> SECURE OPERATIONS DATA INGESTION ACTIVE
        </div>
        <h1>National Ward Command Center</h1>
        <p className="command-sub">Central Audit Console for incoming EC8B Ward Collation Sheets and Field Discrepancy Declarations.</p>
      </div>

      {/* Realtime KPI Panel */}
      <div className="command-stats-grid">
        <div className="metric-panel-card total">
          <div className="panel-inner">
            <span className="panel-number">{metrics.totalReports}</span>
            <span className="panel-label">Wards Reported Live</span>
          </div>
        </div>
        <div className="metric-panel-card votes">
          <div className="panel-inner">
            <span className="panel-number">{metrics.totalVotesCounted.toLocaleString()}</span>
            <span className="panel-label">Aggregated Ward Votes Ledgered</span>
          </div>
        </div>
        <div className={`metric-panel-card alerts ${metrics.flaggedIncidents > 0 ? "danger-alert-active" : ""}`}>
          <div className="panel-inner">
            <span className="panel-number">{metrics.flaggedIncidents}</span>
            <span className="panel-label">Flagged Anomalies Pending Review</span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="control-filter-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search Ward, LGA, or Supervisor Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-search"
          />
        </div>
        <div className="selectors-wrapper">
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="filter-select">
            {uniqueStates.map(state => (
              <option key={state} value={state}>{state === "ALL" ? "All States" : state}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Audit Statuses</option>
            <option value="FLAGGED">⚠️ Flagged / Anomalies Only</option>
            <option value="CLEAR">✅ Verified / Clear Only</option>
          </select>

          <button className="refresh-btn-icon" onClick={fetchCommandData} title="Force Sync Data Ledger">
            🔄 Sync
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="ledger-table-wrapper">
        <table className="command-table">
          <thead>
            <tr>
              <th>Ward Node Location</th>
              <th>State & LGA Axis</th>
              <th>Aggregate Votes</th>
              <th>Audit Clearance Status</th>
              <th>Assigned Field Agent</th>
              <th>Transmission Timestamp</th>
              <th>Verifications</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="table-status-message">Connecting live datastream feed layers...</td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-status-message">No matching ward sheets processed in this query tree.</td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id} className={report.has_anomalies ? "row-danger-context" : ""}>
                  <td><strong>{report.ward_name} Ward</strong></td>
                  <td><span className="state-lga-indicator">{report.state_name} State, <small>{report.lga_name} LGA</small></span></td>
                  <td><strong className="vote-figure">{report.total_votes.toLocaleString()}</strong></td>
                  <td>
                    <span className={`status-pill ${report.has_anomalies ? "status-danger-flag" : "status-approved"}`}>
                      {report.has_anomalies ? "⚠️ ANOMALIES" : "✅ CLEAR"}
                    </span>
                  </td>
                  <td>
                    <div className="agent-identity-box">
                      <strong>{report.submitted_by_name}</strong>
                      <small>{report.submitted_by_phone}</small>
                    </div>
                  </td>
                  <td className="time-col">{report.created_at}</td>
                  <td>
                    <button className="inspect-command-btn" onClick={() => { setSelectedReport(report); setIsModalOpen(true); resetImageTransform(); }}>
                      Inspect EC8B
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Inspector with Interactive Zoom Interface */}
      {isModalOpen && selectedReport && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-window wide-mode" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>EC8B Audit & Document Inspector</h2>
                <small>Ward ID: {selectedReport.id}</small>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>

            <div className="modal-body command-modal-split">
              {/* Left Column Info */}
              <div className="command-modal-left">
                <div className="modal-location-banner">
                  <strong>JURISDICTION NODE PATHWAY</strong>
                  <span className="banner-hierarchy">{selectedReport.state_name} State &gt; {selectedReport.lga_name} LGA &gt; {selectedReport.ward_name} Ward</span>
                </div>

                <div className="info-audit-grid">
                  <div className="info-box">
                    <span className="info-lbl">AGGREGATED SUM TOTAL VOTES</span>
                    <strong className="info-val highlight">{selectedReport.total_votes.toLocaleString()}</strong>
                  </div>
                  <div className="info-box">
                    <span className="info-lbl">AUDIT STATUS</span>
                    <strong className={`info-val ${selectedReport.has_anomalies ? "danger-text" : "safe-text"}`}>
                      {selectedReport.has_anomalies ? "⚠️ Structural Flag Detected" : "✅ No Incident Reported"}
                    </strong>
                  </div>
                </div>

                {selectedReport.has_anomalies && (
                  <div className="incident-alert-narrative-container">
                    <strong>SUPERVISOR REPORTED ANOMALIES NARRATIVE:</strong>
                    <p className="narrative-p">"{selectedReport.anomalies_reported}"</p>
                  </div>
                )}

                <div className="agent-signature-box">
                  <strong>ACCOUNTABILITY CHAIN</strong>
                  <p><strong>Filer Name:</strong> {selectedReport.submitted_by_name}</p>
                  <p><strong>Hotline Contact:</strong> {selectedReport.submitted_by_phone}</p>
                  <p><strong>Ingestion Time:</strong> {selectedReport.created_at}</p>
                </div>
              </div>

              {/* Right Column: Dynamic Interactive Document Viewer */}
              <div className="command-modal-right">
                <div className="viewer-header-controls">
                  <strong className="canvas-header-title">EC8B SCAN SOURCE EVIDENCE</strong>
                  <div className="zoom-toolbar">
                    <button onClick={handleZoomOut} title="Zoom Out" className="tool-btn">➖</button>
                    <span className="zoom-percentage">{Math.round(zoomScale * 100)}%</span>
                    <button onClick={handleZoomIn} title="Zoom In" className="tool-btn">➕</button>
                    <button onClick={handleRotateRight} title="Rotate 90° Right" className="tool-btn">🔄</button>
                    <button onClick={resetImageTransform} title="Reset View" className="tool-btn">Reset</button>
                  </div>
                </div>

                <div
                  className="document-frame-wrapper interactive-canvas"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheelZoom}
                >
                  <img
                    ref={imageRef}
                    src={`${BACKEND_BASE_URL}${selectedReport.collation_sheet_url}`}
                    alt="Physical EC8B Collation Sheet File Proof"
                    className="scanned-sheet-image zoomable"
                    onMouseDown={handleMouseDown}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale}) rotate(${rotationAngle}deg)`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                    }}
                    onError={(e) => { e.target.src = "/static/uploads/placeholder-error.jpg"; }}
                  />
                </div>
                <div className="view-instructions">
                  💡 *Use the toolbar buttons, scroll your mouse wheel to zoom, and drag to pan across the sheet.*
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}