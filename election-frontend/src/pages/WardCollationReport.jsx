import { useState } from "react";
import API from "../services/api";
import "../styles/wardReport.css"; // Ensure to build standard CSS file layout for variables

export default function WardCollationReportView() {
  const [totalVotes, setTotalVotes] = useState("");
  const [hasAnomalies, setHasAnomalies] = useState(false);
  const [anomaliesReported, setAnomaliesReported] = useState("");
  const [collationSheet, setCollationSheet] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setCollationSheet(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ type: "", text: "" });

    // Validation checks prior to streaming multipart body data payloads
    if (!totalVotes || parseInt(totalVotes, 10) < 0) {
      setStatusMessage({ type: "error", text: "Please declare a valid total votes calculation aggregate." });
      setIsSubmitting(false);
      return;
    }

    if (!collationSheet) {
      setStatusMessage({ type: "error", text: "Upload structural proof: Collation file scan layer missing." });
      setIsSubmitting(false);
      return;
    }

    // Assemble Multi-Part Request boundary formatting structures
    const formData = new FormData();
    formData.append("total_votes", totalVotes);
    formData.append("has_anomalies", hasAnomalies);
    formData.append("anomalies_reported", hasAnomalies ? anomaliesReported : "");
    formData.append("collation_sheet", collationSheet);

    try {
      const response = await API.post("/ward/submit-report", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setStatusMessage({
        type: "success",
        text: response.data.message || "Ward verification audit payload logged successfully."
      });

      // Clean states on successful upload executions
      setTotalVotes("");
      setHasAnomalies(false);
      setAnomaliesReported("");
      setCollationSheet(null);
      e.target.reset();

    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || "Network error submitting collation parameters.";
      setStatusMessage({ type: "error", text: backendError });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ward-report-container">
      <div className="report-card-header">
        <h2>Ward-Level Collation Terminal</h2>
        <p className="subtitle-desc">Official Supervisor Registry for Consolidated Telemetry & Threat Assessments</p>
      </div>

      <form onSubmit={handleSubmit} className="ward-report-form">

        {/* Metric Payload Data Block */}
        <div className="form-group">
          <label className="field-label">Aggregated Ward Votes Count (Summation)</label>
          <input
            type="number"
            className="form-control-input"
            placeholder="Sum total of all verified polling unit votes inside Ward"
            value={totalVotes}
            onChange={(e) => setTotalVotes(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Anomaly Checklist Guard */}
        <div className="form-group checkbox-group-wrapper">
          <label className="checkbox-container-label">
            <input
              type="checkbox"
              checked={hasAnomalies}
              onChange={(e) => setHasAnomalies(e.target.checked)}
              disabled={isSubmitting}
            />
            <span className="checkbox-custom-indicator"></span>
            <strong className="text-warning-highlight">Flag Structural Anomalies or Critical Discrepancies</strong>
          </label>
        </div>

        {/* Narrative Box Condition Rendering Block */}
        {hasAnomalies && (
          <div className="form-group animated-fade-in">
            <label className="field-label">Forensic Classification Narrative & Notes</label>
            <textarea
              className="form-control-textarea"
              rows="4"
              placeholder="Provide a breakdown of the incidents, specific polling units affected, or counting metrics mathematical imbalances..."
              value={anomaliesReported}
              onChange={(e) => setAnomaliesReported(e.target.value)}
              disabled={isSubmitting}
              required={hasAnomalies}
            />
          </div>
        )}

        {/* Document Physical Layer Proof Attachment */}
        <div className="form-group file-upload-boundary">
          <label className="field-label">Upload Certified Physical Ward Collation Sheet (Scanned Proof)</label>
          <div className="upload-dropzone">
            <input
              type="file"
              accept=".png, .jpg, .jpeg, .pdf"
              id="file-element-input"
              onChange={handleFileChange}
              disabled={isSubmitting}
              required
            />
            <label htmlFor="file-element-input" className="file-selector-btn">
              {collationSheet ? "🔄 Change File Document" : "📁 Choose File Scan"}
            </label>
            <span className="file-name-display-text">
              {collationSheet ? collationSheet.name : "No file attached yet (Supports PNG, JPG, JPEG, PDF)"}
            </span>
          </div>
        </div>

        {/* Feedback Alert Banners */}
        {statusMessage.text && (
          <div className={`status-alert-box alert-${statusMessage.type}`}>
            {statusMessage.type === "success" ? "✅" : "❌"} {statusMessage.text}
          </div>
        )}

        {/* Form Submission Button */}
        <div className="form-action-footer">
          <button
            type="submit"
            className={`submit-action-btn ${isSubmitting ? "loading-processing" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Transmitting Audit Payload Layer..." : "Commit Ward Collation Ledger Data"}
          </button>
        </div>
      </form>
    </div>
  );
}