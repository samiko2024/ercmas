import { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/createUser.css";

export default function CreateUserForm() {
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [pus, setPus] = useState([]);

  const [createNewPU, setCreateNewPU] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "POLLING_AGENT",
    state_id: "",
    lga_id: "",
    ward_id: "",
    polling_unit_id: "",
    pu_name: "",
    pu_code: ""
  });

  // Fetch States on Mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await API.get("/locations/states");
        setStates(res.data);
      } catch (err) {
        console.error("Failed to fetch states:", err);
      }
    };
    fetchStates();
  }, []);

  const generatePUCode = () => {
    return `PU-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStateChange = async (e) => {
    const state_id = e.target.value;
    setForm({
      ...form,
      state_id,
      lga_id: "",
      ward_id: "",
      polling_unit_id: ""
    });

    if (!state_id) {
      setLgas([]);
      setWards([]);
      setPus([]);
      return;
    }

    try {
      const res = await API.get(`/locations/lgas/${state_id}`);
      setLgas(res.data);
    } catch (err) {
      console.error(err);
    }
    setWards([]);
    setPus([]);
  };

  const handleLgaChange = async (e) => {
    const lga_id = e.target.value;
    setForm({
      ...form,
      lga_id,
      ward_id: "",
      polling_unit_id: ""
    });

    if (!lga_id) {
      setWards([]);
      setPus([]);
      return;
    }

    try {
      const res = await API.get(`/locations/wards/${lga_id}`);
      setWards(res.data);
    } catch (err) {
      console.error(err);
    }
    setPus([]);
  };

  const handleWardChange = async (e) => {
    const ward_id = e.target.value;
    setForm({
      ...form,
      ward_id,
      polling_unit_id: ""
    });

    if (!ward_id) {
      setPus([]);
      return;
    }

    try {
      const res = await API.get(`/locations/polling-units/${ward_id}`);
      setPus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePUChange = (e) => {
    setForm({ ...form, polling_unit_id: e.target.value });
  };

  const handleCreateNewPU = () => {
    if (!form.ward_id) {
      alert("Please select a Ward first to link the new Polling Unit.");
      return;
    }

    const nextCreateState = !createNewPU;
    setCreateNewPU(nextCreateState);

    if (nextCreateState) {
      setForm((prev) => ({
        ...prev,
        polling_unit_id: "",
        pu_code: generatePUCode()
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        pu_name: "",
        pu_code: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      alert("Please fill in all core credential fields.");
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/admin/create-user", form);
      alert("User profile provisioned successfully.");
      setForm({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "POLLING_AGENT",
        state_id: "",
        lga_id: "",
        ward_id: "",
        polling_unit_id: "",
        pu_name: "",
        pu_code: ""
      });
      setCreateNewPU(false);
    } catch (err) {
      console.error(err);
      alert("Error generating user on the system.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper values to resolve text strings dynamically for the interactive Preview Card
  const activeStateName = states.find(s => String(s.id) === String(form.state_id))?.name || "Unassigned State";
  const activeLgaName = lgas.find(l => String(l.id) === String(form.lga_id))?.name || "Unassigned LGA";
  const activeWardName = wards.find(w => String(w.id) === String(form.ward_id))?.name || "Unassigned Ward";
  const activePUName = createNewPU
    ? form.pu_name
    : (pus.find(p => String(p.id) === String(form.polling_unit_id))?.name || "Unassigned Station");

  return (
    <div className="premium-form-container">
      {/* Visual Workspace Split Layout */}
      <div className="premium-workspace-layout">

        {/* LEFT COLUMN: LIVE DIGITAL BADGE PREVIEW */}
        <div className="workspace-preview-sidebar">
          <div className="preview-sticky-wrap">
            <div className="preview-badge-card">
              <div className="badge-chip-bar">
                <span className="badge-system-logo">ERCMAS DIGITAL ID</span>
                <span className="badge-active-status">SECURE NODE</span>
              </div>

              <div className="badge-avatar-frame">
                <div className="avatar-placeholder">
                  {form.full_name ? form.full_name.charAt(0).toUpperCase() : "👤"}
                </div>
              </div>

              <div className="badge-meta-block">
                <h4 className="badge-user-name">{form.full_name || "Agent Full Name"}</h4>
                <p className="badge-user-role">
                  {form.role.replace("_", " ")}
                </p>
                <span className="badge-phone">{form.phone || "No Active Line"}</span>
              </div>

              <div className="badge-footer-jurisdiction">
                <div className="badge-jurisdiction-label">Jurisdiction Domain</div>
                <div className="badge-jurisdiction-value">
                  {activeStateName} • {activeLgaName}
                </div>
                <div className="badge-pu-details">
                  {activeWardName} / <strong>{activePUName}</strong>
                </div>
              </div>
            </div>

            <div className="preview-instructions">
              <h5>System Provisioning Tool</h5>
              <p>Verify that all system access parameters match the field agent's physical government documentation before committing changes to the central registry.</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE COMPREHENSIVE FORM */}
        <div className="workspace-form-body">
          <div className="form-header-zone">
            <h2>Provision User Profile</h2>
            <p className="subtitle">Configure secure profile credentials and administrative boundaries</p>
          </div>

          <form onSubmit={handleSubmit} className="premium-form-flow">

            {/* STEP 1: CREDENTIALS CARD */}
            <div className="form-card-section">
              <h3 className="section-subtitle">1. System Profile & Credentials</h3>

              <div className="form-group-stack">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="premium-input"
                    name="full_name"
                    placeholder="e.g. Chidi Okechukwu"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                  <small className="help-text">Matches official government issued credentials</small>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="premium-input"
                      name="phone"
                      placeholder="+234..."
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="premium-input"
                      name="email"
                      placeholder="name@ercmas.gov.ng"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Secure Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="premium-input password-field"
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <small className="help-text">Minimum of 8 characters containing letters and numbers</small>
                </div>

                <div className="form-group">
                  <label>Administrative Role Level</label>
                  <select className="premium-select" name="role" value={form.role} onChange={handleChange}>
                    <option value="POLLING_AGENT">Polling Agent (Field Node)</option>
                    <option value="WARD_AGENT">Ward Agent (Collation Supervisor)</option>
                    <option value="STATE_AGENT">State Agent (Strategic Monitor)</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 2: REGIONAL JURISDICTION CARD */}
            <div className="form-card-section">
              <h3 className="section-subtitle">2. Geopolitical Assignment</h3>

              <div className="form-group-stack">
                {/* FORCED EQUAL SIDE-BY-SIDE GRID */}
                <div className="form-group-row-equal">
                  <div className="form-group">
                    <label>State Domain</label>
                    <select className="premium-select" value={form.state_id} onChange={handleStateChange}>
                      <option value="">-- Choose State --</option>
                      {states.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Local Government Area </label>
                    <select className="premium-select" value={form.lga_id} onChange={handleLgaChange} disabled={!form.state_id}>
                      <option value="">-- Choose LGA --</option>
                      {lgas.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ward Boundary</label>
                  <select className="premium-select" value={form.ward_id} onChange={handleWardChange} disabled={!form.lga_id}>
                    <option value="">-- Choose Ward --</option>
                    {wards.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                {/* POLLING UNIT SELECTION / REGISTRATION MODULE */}
                {form.ward_id && (
                  <div className="pu-interactive-zone animate-fade">
                    <div className="pu-toggle-header">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={createNewPU}
                          onChange={handleCreateNewPU}
                        />
                        <span className="checkbox-label">Register and deploy a new Polling Unit</span>
                      </label>
                    </div>

                    {!createNewPU ? (
                      <div className="form-group animate-fade">
                        <label>Assigned Polling Unit (Existing)</label>
                        <select
                          className="premium-select"
                          value={form.polling_unit_id || ""}
                          onChange={handlePUChange}
                        >
                          <option value="">-- Choose Polling Unit --</option>
                          {pus.length === 0 ? (
                            <option disabled>No existing polling units found</option>
                          ) : (
                            pus.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.code})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    ) : (
                      <div className="form-group-row-equal animate-fade">
                        <div className="form-group">
                          <label>New Station Name</label>
                          <input
                            className="premium-input highlight"
                            name="pu_name"
                            placeholder="e.g. Town Hall Square"
                            value={form.pu_name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Auto-Generated Code</label>
                          <input
                            className="premium-input read-only"
                            name="pu_code"
                            value={form.pu_code}
                            readOnly
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ACTION ROW */}
            <div className="form-action-footer">
              <button type="submit" className="premium-submit-button" disabled={submitting}>
                {submitting ? "Provisioning Profile Asset..." : "Generate & Deploy User"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}