// routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import "../styles/protectedRoute.css";

export default function ProtectedRoute({ allowedRoles, children }) {
  const currentRole = localStorage.getItem("role");

  // 1. If not logged in at all, kick them back to login page
  if (!currentRole) {
    return <Navigate to="/" replace />;
  }

  // 2. If their role isn't explicitly permitted for this route matrix
  if (!allowedRoles.includes(currentRole)) {
    return (
      <div className="permission-denied-container">
        <div className="denied-shield">
          <div className="shield-icon">🔒</div>
          <h1>Terminal Access Denied</h1>
          <p>
            Your current authorization tier <strong>({currentRole.replace("_", " ")})</strong>
            does not possess clear privileges to monitor or audit this node axis.
          </p>
          <div className="denied-meta">
            An incident report has been logged at the National Command Office.
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorization verified, proceed to display page
  return children;
}