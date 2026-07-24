import { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/submit.css";

export default function SubmitResult() {
  const [accredited, setAccredited] = useState("");
  const [votes, setVotes] = useState("");

  const [parties, setParties] = useState([]);
  const [partyVotes, setPartyVotes] = useState({});
  const [ec8aFile, setEc8aFile] = useState(null);
  const [filePreview, setFilePreview] = useState(""); // Captures visual audit metadata

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [pu, setPu] = useState(null);

  // 1. FETCH PARTIES
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await API.get("/api/parties");
        setParties(res.data || []);

        const initialVotes = {};
        res.data.forEach((p) => {
          initialVotes[p.id] = "";
        });
        setPartyVotes(initialVotes);
      } catch (err) {
        console.log("Party fetch error:", err);
      }
    };
    fetchParties();
  }, []);

  // 2. FETCH AUTH USER META
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setCurrentUser(res.data);
      } catch (err) {
        console.log("User fetch error:", err);
      }
    };
    fetchUser();
  }, []);

  // 3. FETCH POLLING UNIT META
  useEffect(() => {
    if (!currentUser?.polling_unit_id) return;

    const fetchPU = async () => {
      try {
        const res = await API.get(
          `/locations/polling-unit/${currentUser.polling_unit_id}`
        );
        setPu(res.data);
      } catch (err) {
        console.log("PU fetch error:", err);
      }
    };
    fetchPU();
  }, [currentUser]);

  // Handles safe extraction and rendering of file metadata properties
  const handleFileExtraction = (file) => {
    if (!file) return;
    setEc8aFile(file);

    // If file is an image component node, formulate local URI memory preview path string
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(""); // Fallback for PDFs
    }
  };

  const handlePartyChange = (party_id, value) => {
    setPartyVotes((prev) => ({
      ...prev,
      [party_id]: value,
    }));
  };

  const totalPartyVotes = Object.values(partyVotes).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );

  const rejectedVotes = Number(votes || 0) - Number(totalPartyVotes || 0);

  // 4. MULTIPART SUBMISSION LOGIC
  const handleSubmit = async () => {
    if (!accredited || !votes) {
      return alert("Please fill all required polling metadata metrics fields.");
    }
    if (!pu?.id) {
      return alert("Critical Fault: Valid associated field Polling Unit node context tracking context not resolved.");
    }
    if (Number(votes) > Number(accredited)) {
      return alert("❌ Over-voting detected: Total votes cast cannot exceed accredited voters.");
    }
    if (totalPartyVotes > Number(votes)) {
      return alert("❌ Over-voting detected: Combined individual party votes exceed actual total ballots cast.");
    }
    if (!ec8aFile) {
      return alert("❌ Verification Failure: Official signed Form EC8A sheet snapshot upload required.");
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("polling_unit_id", pu.id);
      formData.append("total_accredited_voters", Number(accredited));
      formData.append("total_votes_cast", Number(votes));
      formData.append("rejected_votes", rejectedVotes < 0 ? 0 : rejectedVotes);
      formData.append("ec8a_file", ec8aFile);

      Object.entries(partyVotes).forEach(([party_id, count_value]) => {
        formData.append(`party_votes[${party_id}]`, Number(count_value) || 0);
      });

      await API.post("/results/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ Verified Form EC8A election result processed successfully.");
      setSubmitted(true);
    } catch (err) {
      console.error("Submission processing crash error:", err);
      alert(`❌ Ingestion failed: ${err.response?.data?.message || "Internal transmission network fault"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-result-container">
      <div className="card">
        <div className="card-header">
          <h2 className="title">Submit Polling Unit Result</h2>
          <p className="subtitle">Enter verified physical polling data into secure ledger transmission.</p>
        </div>

        {/* PU INFO BANNER */}
        <div className="pu-box">
          <small className="pu-badge">ASSIGNED GEOGRAPHIC NODE</small>
          <p className="pu-name">
            {pu ? `${pu.name} (${pu.code})` : "Resolving location authorization tree..."}
          </p>
        </div>

        {/* CORE METRICS GROUP */}
        <div className="metrics-row">
          <div className="input-group">
            <label className="label">Accredited Voters</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="0"
              value={accredited}
              onChange={(e) => setAccredited(e.target.value)}
              disabled={submitted}
            />
          </div>

          <div className="input-group">
            <label className="label">Total Votes Cast</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="0"
              value={votes}
              onChange={(e) => setVotes(e.target.value)}
              disabled={submitted}
            />
          </div>
        </div>

        {/* PARTY VOTES GRID */}
        <section className="section">
          <div className="section-title">Vote Count Matrix</div>
          <div className="party-grid">
            {parties.length === 0 ? (
              <p className="loading-text">Loading platform party lists metadata arrays...</p>
            ) : (
              parties.map((party) => (
                <div className="party-card" key={party.id}>
                  <div className="party-circle">
                    <span>{party.acronym}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="party-input"
                    value={partyVotes[party.id] || ""}
                    onChange={(e) => handlePartyChange(party.id, e.target.value)}
                    disabled={submitted}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* REALTIME BALANCING RUNTIME STATS */}
        <section className="section stats-section">
          <div className="section-title">Form Balance Summary</div>
          <div className="info-grid">
            <div className="info-stat">
              <span className="stat-label">Total Party Votes Tally</span>
              <span className="stat-value">{totalPartyVotes}</span>
            </div>
            <div className="info-stat">
              <span className="stat-label">Residual Rejected Votes</span>
              <span className={`stat-value ${rejectedVotes < 0 ? "text-error" : ""}`}>
                {rejectedVotes < 0 ? "Negative Error" : rejectedVotes}
              </span>
            </div>
          </div>
        </section>

        {/* TWO-OPTION PREMIUM DUAL FILE INTEGRATION CAPTURE SECTOR */}
        <section className="section">
          <div className="section-title">Official Form EC8A Sheet Attachment</div>
          <div className="premium-upload-framework">

            {/* Visual Preview Node Window Box Area */}
            {filePreview ? (
              <div className="premium-file-preview-box">
                <img src={filePreview} alt="EC8A Audited Ledger Preview" />
                <button
                  type="button"
                  className="clear-preview-overlay-btn"
                  onClick={() => { setEc8aFile(null); setFilePreview(""); }}
                  disabled={submitted}
                >
                  ✕ Remove Image
                </button>
              </div>
            ) : ec8aFile ? (
              <div className="premium-file-preview-box document-fallback">
                <span className="doc-icon">📄</span>
                <p className="doc-meta-text">{ec8aFile.name}</p>
                <button
                  type="button"
                  className="clear-preview-overlay-btn"
                  onClick={() => setEc8aFile(null)}
                  disabled={submitted}
                >
                  ✕ Remove File
                </button>
              </div>
            ) : (
              <div className="upload-placeholder-graphic">
                <div className="upload-icon">📷</div>
                <p className="upload-text">No proof file attached yet. Capture or load down an image.</p>
              </div>
            )}

            {/* Twin Interactive Action Trigger Grid Buttons */}
            <div className="upload-dual-action-grid">

              {/* Option A: Direct Hardware Camera Loop */}
              <div className="upload-btn-cell">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment" /* Forces camera application initiation */
                  disabled={submitted}
                  onChange={(e) => handleFileExtraction(e.target.files[0])}
                  className="file-input-hidden"
                  id="camera-direct-capture"
                />
                <label htmlFor="camera-direct-capture" className={`action-trigger-card-btn camera-theme ${submitted ? "disabled-btn" : ""}`}>
                  <span className="btn-icon">📸</span>
                  <div className="btn-meta-block">
                    <strong>Capture Form</strong>
                    <small>Direct hardware lens trigger</small>
                  </div>
                </label>
              </div>

              {/* Option B: Local OS Directory Picker Loop */}
              <div className="upload-btn-cell">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={submitted}
                  onChange={(e) => handleFileExtraction(e.target.files[0])}
                  className="file-input-hidden"
                  id="directory-file-select"
                />
                <label htmlFor="directory-file-select" className={`action-trigger-card-btn file-theme ${submitted ? "disabled-btn" : ""}`}>
                  <span className="btn-icon">📁</span>
                  <div className="btn-meta-block">
                    <strong>Select File</strong>
                    <small>Browse memory nodes</small>
                  </div>
                </label>
              </div>

            </div>
          </div>
        </section>

        <footer className="card-footer-meta">
          <div>📍 Location Context: <span className="text-highlight">{pu?.code || "Pending Authorization"}</span></div>
          <div>⏱ Timestamp: <span className="text-highlight">System Generated Secure Ledger</span></div>
        </footer>

        {/* SUBMIT BUTTON */}
        <button
          className="button"
          onClick={handleSubmit}
          disabled={loading || submitted}
          style={{
            background: submitted
              ? "#475569"
              : "linear-gradient(135deg, #0b2f24 0%, #174b3b 100%)",
            cursor: (loading || submitted) ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Transmitting Cloud Secure Data Payload..." : submitted ? "Submission Logged & Locked" : "Submit Result Proof"}
        </button>

        <div className="incident-box">
          <a href="/report-incident" className="report-link">
            ⚠️ Report Incident / Flag Result Anomalies
          </a>
        </div>
      </div>
    </div>
  );
}