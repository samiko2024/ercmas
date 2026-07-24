import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

export default function PUDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/pu/${id}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [id]);

  // ✅ Loading state
  if (loading) {
    return (
        <div style={{ padding: "20px" }}>Loading...</div>
    );
  }

  // ✅ Prevent crash if no data
  if (!data) {
    return (
        <div style={{ padding: "20px" }}>
          <h2>No data found for this Polling Unit</h2>
        </div>
    );
  }

  return (
      <div style={{ padding: "20px" }}>

        <h1>{data.pu || "Polling Unit Detail"}</h1>

        <p><strong>Total Votes:</strong> {data.total_votes ?? 0}</p>

        <h3>Party Results</h3>

        {data.parties && data.parties.length > 0 ? (
          data.parties.map((p, i) => (
            <p key={i}>
              {p.name}: {p.votes}
            </p>
          ))
        ) : (
          <p>No party data available</p>
        )}

        <h3>Evidence</h3>

        {data.image ? (
          <img src={data.image} alt="evidence" width="300" />
        ) : (
          <p>No image uploaded</p>
        )}

        <h3>Status</h3>
        <p>{data.flagged ? "⚠ Flagged" : "Normal"}</p>

      </div>
  );
}