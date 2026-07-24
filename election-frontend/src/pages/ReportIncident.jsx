import { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/submit.css";

export default function ReportIncident() {
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState(null);
  const [type, setType] = useState("Irregularity");

  // Track profile and setup an explicit 'pu' state variable for your specific layout element
  const [userProfile, setUserProfile] = useState(null);
  const [pu, setPu] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
      const fetchUserAndLocation = async () => {
        try {
          setIsLoadingProfile(true);

          // 1️⃣ Get logged-in user
          const res = await API.get("/auth/me");
          const user = res.data;

          setUserProfile(user);

          // 2️⃣ Fetch polling unit details
          if (user?.polling_unit_id) {
            const puRes = await API.get(`/locations/polling-unit/${user.polling_unit_id}`);
            setPu(puRes.data);
          }

        } catch (err) {
          console.log("Profile/location error:", err);
        } finally {
          setIsLoadingProfile(false);
        }
      };

      fetchUserAndLocation();
  }, []);


  const handleSubmit = async () => {
    if (!description || !media) {
      alert("Please provide description and evidence");
      return;
    }

    const formData = new FormData();
    formData.append("description", description);
    formData.append("media", media);
    formData.append("type", type);

    if (userProfile?.polling_unit_id) formData.append("polling_unit_id", userProfile.polling_unit_id);
    if (userProfile?.ward_id) formData.append("ward_id", userProfile.ward_id);
    if (userProfile?.lga_id) formData.append("lga_id", userProfile.lga_id);
    if (userProfile?.state_id) formData.append("state_id", userProfile.state_id);

    try {
      await API.post("/results/report-incident", formData);
      alert("Incident reported successfully");
      setDescription("");
      setMedia(null);
    } catch (err) {
      console.log(err);
      alert("Error reporting incident");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Report Incident</h2>
        <p className="subtitle">
          Report any irregularities or suspicious activity at your assigned station.
        </p>

        {/* ========================================== */}
        {/* YOUR RECONFIGURED GEOGRAPHIC NODE ELEMENT  */}
        {/* ========================================== */}
        <div className="pu-box" style={{ marginBottom: "20px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981" }}>
            <small style={{ color: "#047857", fontWeight: "700" }}>ASSIGNED GEOGRAPHIC NODE</small>
            <p style={{ margin: "4px 0 0 0" }}>
              <strong>
                {pu ? `${pu.name} (${pu.code})` : "Resolving location authorization tree..."}
              </strong>
            </p>
        </div>

        {/* Type */}
        <div className="input-group">
          <label className="label">Incident Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>Irregularity</option>
            <option>Violence</option>
            <option>Result Manipulation</option>
            <option>Equipment Failure</option>
          </select>
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="label">Description</label>
          <textarea
            className="input"
            rows="4"
            placeholder="Describe what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Upload */}
        <div className="section">
          <div className="section-title">Upload Evidence (Image/Video)</div>
          <div className="upload-box">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMedia(e.target.files[0])}
            />
          </div>
        </div>

        {/* Submit */}
        <button className="button" onClick={handleSubmit} disabled={isLoadingProfile}>
          Submit Report
        </button>
      </div>
    </div>
  );
}