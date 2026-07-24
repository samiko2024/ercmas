import { useState } from "react";
import API from "../services/api";


export default function ReportModal({ show, onClose }) {
  const [report, setReport] = useState("");

  if (!show) return null;

  const handleSubmit = async () => {
    if (!report) {
      alert("Enter report");
      return;
    }

    try {
      await API.post("/ward-report", { report });
      alert("Report submitted to LGA");
      onClose();
      setReport("");
    } catch {
      alert("Error submitting report");
    }
  };

  return (
    <div className="modal-overlay">

      <div className="modal">

        <h3>Ward Agent Report</h3>

        <textarea
          placeholder="Write your observations..."
          value={report}
          onChange={(e) => setReport(e.target.value)}
          className="modal-input"
        />

        <div className="modal-actions">

          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>

          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>

        </div>

      </div>

    </div>
  );
}