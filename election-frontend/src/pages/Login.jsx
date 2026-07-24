import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/login.css";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // Captures email or phone interchangeably
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Visibility control
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage("Please complete all required security credentials.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      // Sending payload tracking parameter mapped to identifier key node
      const res = await API.post("/auth/login", { identifier, password });
      const userRole = res.data.user.role.toUpperCase();

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", userRole);

      switch (userRole) {
        case "ADMIN":
          navigate("/dashboard");
          break;
        case "WARD_AGENT":
          navigate("/ward");
          break;
        case "POLLING_AGENT":
          navigate("/submit");
          break;
        default:
          setErrorMessage("System authorization mismatch. Contact your system admin.");
          break;
      }
    } catch (err) {
      console.error("Login authorization fault:", err);
      setErrorMessage(
        err?.response?.data?.error || err?.response?.data?.message || "Authentication failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="ambient-glow glow-primary"></div>
      <div className="ambient-glow glow-secondary"></div>

      <div className="login-card-container">
        <div className="login-brand-panel">
          <div className="brand-logo-wrapper">
            <img src="/ndc-logo2.png" alt="System Crest Logo" className="brand-crest" />
          </div>
          <h1>Election Results Collation Monitoring & Audit System</h1>
          <div className="divider-line"></div>
          <p className="system-tagline">Secure Infrastructure Network</p>
        </div>

        <form onSubmit={handleLogin} className="login-form-panel">
          <div className="form-header">
            <h2>Portal Authentication</h2>
            <p>Access restricted to vetted field deployment and command staff</p>
          </div>

          {errorMessage && (
            <div className="security-alert-banner">
              <span className="alert-icon">⚠️</span>
              <p className="alert-text">{errorMessage}</p>
            </div>
          )}

          <div className="premium-input-wrapper">
            <label htmlFor="identifier">Security Identifier</label>
            <div className="input-field-container">
              <span className="field-icon">🔑</span>
              <input
                id="identifier"
                type="text"
                placeholder="Email Address or Phone Number"
                value={identifier}
                disabled={isLoading}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="premium-input-wrapper">
            <label htmlFor="password">Access Passphrase</label>
            <div className="input-field-container">
              <span className="field-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Tweakable state toggle element triggers display manipulation */}
              <button
                type="button"
                className="password-toggle-trigger"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`premium-submit-btn ${isLoading ? "btn-processing" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner-assembly">
                <span className="spinner-ring"></span>
                <span>Authorizing...</span>
              </div>
            ) : (
              <span className="btn-label-text">Initialize Secure Session</span>
            )}
          </button>

          <div className="form-footer-notice">
            <p>Protected by multi-layered infrastructure tokenization routines. All connection sequences are logged and audited.</p>
          </div>
        </form>
      </div>
    </div>
  );
}