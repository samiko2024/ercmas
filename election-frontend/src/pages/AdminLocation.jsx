import { useState } from "react";
import API from "../services/api";
import "../styles/admin.css";

export default function AdminLocation() {
  const [puForm, setPuForm] = useState({
      ward_id: "",
      pu_name: "",
      pu_code: ""
    });

    const handlePUChange = (e) => {
      setPuForm({ ...puForm, [e.target.name]: e.target.value });
    };

    const handleCreatePU = async () => {
      try {
        const res = await API.post("/admin/location/create-pu", puForm);
        alert("Polling Unit created");

        // refresh PU list
        const updated = await API.get(`/locations/polling-units/${puForm.ward_id}`);
        setPus(updated.data);

      } catch (err) {
        console.log(err);
        alert(err.response?.data?.error || "Error creating PU");
      }
  };
  const generateCode = () => {
      return `${form.state_id.slice(0,4)}-${Date.now()}`;
    };
  return (
    <div className="card">
      <h4>Create Polling Unit</h4>

        <input
          className="input"
          name="pu_name"
          placeholder="Polling Unit Name"
          onChange={handlePUChange}
        />

        <input
          className="input"
          name="pu_code"
          placeholder="Polling Unit Code"
          onChange={handlePUChange}
        />

        <button className="button" onClick={handleCreatePU}>
          Add Polling Unit
        </button>
    </div>
  );
}