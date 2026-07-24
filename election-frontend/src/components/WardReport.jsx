import { useState } from "react";
import API from "../services/api";

export default function WardReport() {

  const [report, setReport] = useState("");

  const submitReport = async () => {
    if (!report) return alert("Enter report");

    try {
      await API.post("/ward-report", { report });
      alert("Report submitted to LGA");
    } catch {
      alert("Error submitting report");
    }
  };

  return (
    <div className="ward-report">

      <h2>Ward Agent Observation</h2>

      <textarea
        placeholder="Write your observations, irregularities, summary..."
        value={report}
        onChange={(e) => setReport(e.target.value)}
      />

      <button onClick={submitReport}>
        Submit to LGA
      </button>

    </div>
  );
}