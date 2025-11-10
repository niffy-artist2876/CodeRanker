import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { apiMe, apiLogout } from "./auth";

import { motion } from "framer-motion";

import "./ui.css";

function Dashboard() {
  const [me, setMe] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const resp = await apiMe();

      setMe(resp);
    })();
  }, []);

  const profile = me?.user?.profile || {};

  // minimal UI — using utility classes from ui.css

  async function onLogout() {
    await apiLogout();
    navigate("/login", { replace: true });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container"
      style={{ minHeight: "100vh", paddingTop: "40px", paddingBottom: "40px" }}
    >
      <div className="card stack">
        <div className="stack">
          <h2 className="mb-0">
            Welcome back{profile?.name ? `, ${profile.name}` : ""}
          </h2>
          <p className="muted">
            Jump into contests, track your progress, and check your rank in
            college.
          </p>
        </div>

        <div className="cluster">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/leaderboard")}
          >
            Leaderboard
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/weeklycontest")}
          >
            Contests
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/progress")}
          >
            Progress
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>
          <button className="btn btn-ghost" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className="grid grid-cols-3 mt-4">
          <StatCard icon="🏆" label="College Rank" value="#—" />

          <StatCard icon="⏱️" label="Next Contest" value="Fri · 6 PM" />

          <StatCard icon="🔥" label="Streak" value="0 days" />
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card">
      <div className="cluster">
        <div className="text-lg">{icon}</div>
        <div className="muted">{label}</div>
        <div style={{ marginLeft: "auto", fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

export default Dashboard;
