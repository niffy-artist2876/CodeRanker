import React, { useEffect, useState } from "react";

import "./Leaderboard.css";

import { motion } from "framer-motion";

function initials(name) {
  if (!name) return "";
  return name
    .split(/\s+/)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

function Medal({ rank }) {
  const medals = ["🥇", "🥈", "🥉"];
  return <span className="medal">{medals[rank - 1] || ""}</span>;
}

function displayName(entry) {
  return entry?.displayName || entry?.email || "—";
}

function lcSolved(entry) {
  if (entry?.components && typeof entry.components.lcSolved === "number")
    return entry.components.lcSolved;
  if (entry?.leetcode && typeof entry.leetcode.totalSolved === "number")
    return entry.leetcode.totalSolved;
  return 0;
}

function cfRating(entry) {
  if (entry?.components && typeof entry.components.cfRating === "number")
    return entry.components.cfRating;
  if (entry?.codeforces && typeof entry.codeforces.rating === "number")
    return entry.codeforces.rating;
  return 0;
}

function rankFor(entry, idx) {
  return typeof entry?.rank === "number" ? entry.rank : idx + 1;
}

function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/leaderboard?limit=100", {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load leaderboard");
        }
        const arr = Array.isArray(data?.leaderboard)
          ? data.leaderboard.slice()
          : [];
        // Ensure ordering by rank if provided, else score desc
        arr.sort((a, b) => {
          if (typeof a.rank === "number" && typeof b.rank === "number")
            return a.rank - b.rank;
          if ((b.score ?? 0) !== (a.score ?? 0))
            return (b.score ?? 0) - (a.score ?? 0);
          return (displayName(a) || "").localeCompare(displayName(b) || "");
        });
        if (!cancelled) setRows(arr);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const top3 = rows.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ textAlign: "center" }}
    >
      <div className="leaderboard-page">
        <div className="leaderboard-card">
          <div className="leaderboard-header">
            <h2>Leaderboard</h2>

            <p>Top users in CodeRanker</p>
          </div>

          {loading && (
            <div className="muted" style={{ margin: "1rem 0" }}>
              Loading leaderboard…
            </div>
          )}
          {error && (
            <div
              className="muted"
              style={{ margin: "1rem 0", color: "#ffb3b3" }}
            >
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="top-three">
                {top3.map((r, i) => {
                  const name = displayName(r);
                  return (
                    <div
                      key={(name || "user") + "_top_" + i}
                      className={`top-item rank-${i + 1}`}
                    >
                      <div className="avatar">{initials(name)}</div>
                      <div className="top-meta">
                        <div className="top-name">{name}</div>
                        <div className="top-score">{r.score ?? 0} pts</div>
                      </div>
                      <div className="top-badge">
                        <Medal rank={i + 1} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="leaderboard-table-wrap">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>LC Solved</th>
                      <th>CF Rating</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const name = displayName(r);
                      const rank = rankFor(r, i);
                      return (
                        <tr
                          key={(name || "user") + "_" + i}
                          className={i < 3 ? "highlight" : ""}
                        >
                          <td style={{ color: "white" }} className="col-rank">
                            {rank}
                          </td>
                          <td className="col-user">
                            <div className="row-user">
                              <div className="row-avatar">{initials(name)}</div>
                              <div className="row-name">{name}</div>
                            </div>
                          </td>
                          <td>{lcSolved(r)}</td>
                          <td>{cfRating(r)}</td>
                          <td className="col-score">{r.score ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Leaderboard;
