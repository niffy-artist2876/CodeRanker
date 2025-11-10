import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import "./Contests.css";

const MOCK_PROBLEMS = Array.from({ length: 26 }).map((_, i) => {
  const diffs = ["easy", "medium", "hard"]; const tags = ["array", "dp", "graph", "greedy", "string"];
  const d = diffs[i % 3];
  return {
    id: 1000 + i,
    title: `Problem ${i + 1}`,
    difficulty: d,
    acceptance: (45 + (i * 7) % 40) + "%",
    tags: [tags[i % 5], tags[(i + 2) % 5]],
    status: i % 4 === 0 ? "solved" : "todo",
  };
});

function Contests() {
  const [query, setQuery] = useState("");
  const [diff, setDiff] = useState("all");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const filtered = useMemo(() => {
    let rows = MOCK_PROBLEMS.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
    if (diff !== "all") rows = rows.filter(p => p.difficulty === diff);
    return rows;
  }, [query, diff]);

  const start = (page - 1) * pageSize;
  const current = filtered.slice(start, start + pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="contests-page">
      <motion.div className="contests-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="contests-header">
          <h2>Weekly Contests</h2>
          <div className="contests-sub">Practice problems and upcoming rounds</div>
        </div>

        <div className="contests-body">
          <aside className="filters">
            <h4 className="filter-title">Filters</h4>
            <div className="filter-group">
              <div style={{ marginBottom: 6, opacity: 0.9 }}>Difficulty</div>
              {[
                { key: "all", label: "All" },
                { key: "easy", label: "Easy" },
                { key: "medium", label: "Medium" },
                { key: "hard", label: "Hard" },
              ].map(opt => (
                <button key={opt.key} className={`chip ${diff === opt.key ? "active" : ""}`} onClick={() => { setPage(1); setDiff(opt.key); }}>{opt.label}</button>
              ))}
            </div>
            <div className="filter-group">
              <div style={{ marginBottom: 6, opacity: 0.9 }}>Status</div>
              <button className="chip">All</button>
              <button className="chip">Solved</button>
              <button className="chip">Todo</button>
            </div>
            <div className="filter-group">
              <div style={{ marginBottom: 6, opacity: 0.9 }}>Tags</div>
              {["array", "dp", "graph", "greedy", "string"].map(t => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          </aside>

          <section>
            <div className="search-row">
              <input className="search-input" placeholder="Search problems" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} />
              <button className="new-contest-btn">NEW CONTEST</button>
            </div>

            <table className="problems-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Title</th>
                  <th style={{ width: 120 }}>Difficulty</th>
                  <th style={{ width: 120 }}>Acceptance</th>
                  <th style={{ width: 140 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {current.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontWeight: 700 }}>{p.title}</div>
                        <div>
                          {p.tags.map(t => (<span key={t} className="tag">{t}</span>))}
                        </div>
                      </div>
                    </td>
                    <td><span className={`difficulty ${p.difficulty}`}>{p.difficulty.toUpperCase()}</span></td>
                    <td>{p.acceptance}</td>
                    <td><span className={`status ${p.status === "solved" ? "solved" : ""}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button className="pager" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <div style={{ alignSelf: "center", opacity: 0.9 }}>{page} / {pages}</div>
              <button className="pager" disabled={page === pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

export default Contests;


