import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin } from "./auth";
import { motion } from "framer-motion";

function LoginPage() {
  const [SRN, setSRN] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiLogin(SRN, pwd);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card"
        style={{ width: "min(480px, 100%)" }}
      >
        <h2 style={{ margin: 0 }}>Sign in</h2>
        <p className="muted" style={{ marginTop: 6, marginBottom: 18 }}>
          Use your PESU Academy credentials
        </p>

        <form onSubmit={handleSubmit} className="stack">
          <label className="stack">
            <span className="text-sm semibold">SRN</span>
            <input
              className="input"
              type="text"
              value={SRN}
              onChange={(e) => setSRN(e.target.value)}
              placeholder="eg. PES1UG2XXXXXX"
              aria-label="SRN"
              required
            />
          </label>

          <label className="stack">
            <span className="text-sm semibold">Password</span>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Your password"
                aria-label="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="btn btn-ghost"
                style={{ position: "absolute", right: 6, top: 6 }}
                aria-label="Toggle password visibility"
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div className="cluster">
            <label
              className="muted text-sm"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <input type="checkbox" />
              Remember me
            </label>
          </div>

          {error ? <div className="badge danger">{error}</div> : null}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default LoginPage;
