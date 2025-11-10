import React, { useEffect, useMemo, useState } from "react";

import "./Progress.css";

import "./ui.css";
import {
  apiGetLinkedAccounts,
  apiUpsertLinkedAccounts,
  apiVerifyLeetCodeUsername,
  apiVerifyCodeforcesHandle,
  apiGetProgressOverview,
} from "./integration";

function nonEmpty(s) {
  return typeof s === "string" && s.trim().length > 0;
}

function pct(part, total) {
  if (!total || total <= 0) return 0;
  const v = Math.max(0, Number(part || 0));
  return Math.min(100, Math.round((v / total) * 100));
}

function Loading({ label = "Loading..." }) {
  return (
    <div className="container center" style={{ minHeight: "100vh" }}>
      <div className="card" style={{ textAlign: "center" }}>
        <h2 className="mb-2">Fetching your progress</h2>

        <p className="muted">{label}</p>
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return <div className="badge danger mb-4">{message}</div>;
}

function SuccessBanner({ message }) {
  return <div className="badge success mb-4">{message}</div>;
}

function LinkForm({
  initialLeetCode = "",
  initialCodeforces = "",
  onSaved,
  onCancel,
}) {
  const [leetcodeUsername, setLeet] = useState(initialLeetCode || "");
  const [codeforcesHandle, setCF] = useState(initialCodeforces || "");

  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState({ lc: false, cf: false });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  async function doVerifyLeetCode() {
    const v = leetcodeUsername.trim();
    if (!v) {
      setErrors((e) => ({ ...e, lc: "" }));
      return;
    }
    setVerifying((s) => ({ ...s, lc: true }));
    setErrors((e) => ({ ...e, lc: "" }));
    try {
      const res = await apiVerifyLeetCodeUsername(v);
      if (!res?.exists) {
        setErrors((e) => ({
          ...e,
          lc: "LeetCode user not found. Please check the spelling.",
        }));
      } else {
        setSuccess("LeetCode username verified.");
      }
    } catch (err) {
      setErrors((e) => ({
        ...e,
        lc:
          err?.body?.message ||
          err?.message ||
          "Could not verify LeetCode username.",
      }));
    } finally {
      setVerifying((s) => ({ ...s, lc: false }));
    }
  }

  async function doVerifyCodeforces() {
    const v = codeforcesHandle.trim();
    if (!v) {
      setErrors((e) => ({ ...e, cf: "" }));
      return;
    }
    setVerifying((s) => ({ ...s, cf: true }));
    setErrors((e) => ({ ...e, cf: "" }));
    try {
      const res = await apiVerifyCodeforcesHandle(v);
      if (!res?.exists) {
        setErrors((e) => ({
          ...e,
          cf: "Codeforces user not found. Please check the spelling.",
        }));
      } else {
        setSuccess("Codeforces handle verified.");
      }
    } catch (err) {
      setErrors((e) => ({
        ...e,
        cf:
          err?.body?.message ||
          err?.message ||
          "Could not verify Codeforces handle.",
      }));
    } finally {
      setVerifying((s) => ({ ...s, cf: false }));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSuccess("");
    setErrors({});
    const lc = leetcodeUsername.trim();
    const cf = codeforcesHandle.trim();

    if (!lc && !cf) {
      setErrors({
        form: "Please enter at least one of LeetCode username or Codeforces handle.",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (lc) {
        const res = await apiVerifyLeetCodeUsername(lc);
        if (!res?.exists) {
          setSubmitting(false);
          setErrors({
            lc: "LeetCode user not found. Please check the spelling.",
          });
          return;
        }
      }
      if (cf) {
        const res = await apiVerifyCodeforcesHandle(cf);
        if (!res?.exists) {
          setSubmitting(false);
          setErrors({
            cf: "Codeforces user not found. Please check the spelling.",
          });
          return;
        }
      }

      const payload = {
        ...(lc !== undefined ? { leetcodeUsername: lc } : {}),
        ...(cf !== undefined ? { codeforcesHandle: cf } : {}),
      };
      await apiUpsertLinkedAccounts(payload);
      setSuccess("Accounts updated successfully.");
      onSaved?.({ leetcodeUsername: lc || null, codeforcesHandle: cf || null });
    } catch (err) {
      setErrors({
        form:
          err?.body?.message ||
          err?.message ||
          "Failed to update your linked accounts.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card stack">
      <h3 className="mb-2">Link your coding accounts</h3>

      <p className="muted">
        Provide your usernames so we can fetch your progress. You can add either
        one or both.
      </p>

      <ErrorBanner message={errors.form} />
      <SuccessBanner message={success} />

      <div style={styles.field}>
        <label htmlFor="leetcode" style={styles.label}>
          LeetCode Username
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            id="leetcode"
            type="text"
            value={leetcodeUsername}
            onChange={(e) => setLeet(e.target.value)}
            placeholder="eg. john_doe"
            style={styles.input}
          />
          <button
            type="button"
            onClick={doVerifyLeetCode}
            disabled={!nonEmpty(leetcodeUsername) || verifying.lc}
            style={styles.secondaryBtn}
          >
            {verifying.lc ? "Verifying…" : "Verify"}
          </button>
        </div>
        {errors.lc ? <div style={styles.helpError}>{errors.lc}</div> : null}
      </div>

      <div style={styles.field}>
        <label htmlFor="codeforces" style={styles.label}>
          Codeforces Handle
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            id="codeforces"
            type="text"
            value={codeforcesHandle}
            onChange={(e) => setCF(e.target.value)}
            placeholder="eg. johndoe_123"
            style={styles.input}
          />
          <button
            type="button"
            onClick={doVerifyCodeforces}
            disabled={!nonEmpty(codeforcesHandle) || verifying.cf}
            style={styles.secondaryBtn}
          >
            {verifying.cf ? "Verifying…" : "Verify"}
          </button>
        </div>
        {errors.cf ? <div style={styles.helpError}>{errors.cf}</div> : null}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button type="submit" disabled={submitting} style={styles.primaryBtn}>
          {submitting ? "Saving…" : "Save"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} style={styles.cancelBtn}>
            Cancel
          </button>
        ) : null}
      </div>

      <div style={styles.note}>
        Tip: If you want to unlink later, clear the corresponding field and
        click Save.
      </div>
    </form>
  );
}

function LeetCodeCard({ data }) {
  const total = Number(data?.totalSolved || 0);
  const easy = Number(data?.easy || 0);
  const medium = Number(data?.medium || 0);
  const hard = Number(data?.hard || 0);

  if (!data?.connected) {
    return (
      <div className="platform-card leetcode">
        <div className="platform-header">
          <h3>LeetCode</h3>
          <span className="solved-count">Not linked</span>
        </div>
        <div style={styles.disconnectedText}>
          Link your LeetCode username to see solved counts by difficulty.
        </div>
      </div>
    );
  }

  if (data?.exists === false) {
    return (
      <div className="platform-card leetcode">
        <div className="platform-header">
          <h3>LeetCode</h3>
          <span className="solved-count">User not found</span>
        </div>
        <div style={styles.disconnectedText}>
          The username “{String(data.username || "")}” was not found.
        </div>
      </div>
    );
  }

  return (
    <div className="platform-card leetcode">
      <div className="platform-header">
        <h3>LeetCode</h3>
        <span className="solved-count">{total} solved</span>
      </div>

      <div className="difficulty-bars">
        <DiffBar label="Easy" className="easy" count={easy} total={total} />
        <DiffBar
          label="Medium"
          className="medium"
          count={medium}
          total={total}
        />
        <DiffBar label="Hard" className="hard" count={hard} total={total} />
      </div>
    </div>
  );
}

function CodeforcesCard({ data }) {
  if (!data?.connected) {
    return (
      <div className="platform-card codeforces">
        <div className="platform-header">
          <h3>Codeforces</h3>
          <span className="solved-count">Not linked</span>
        </div>
        <div style={styles.disconnectedText}>
          Link your Codeforces handle to see your rating and rank.
        </div>
      </div>
    );
  }

  if (data?.exists === false) {
    return (
      <div className="platform-card codeforces">
        <div className="platform-header">
          <h3>Codeforces</h3>
          <span className="solved-count">User not found</span>
        </div>
        <div style={styles.disconnectedText}>
          The handle “{String(data.handle || "")}” was not found.
        </div>
      </div>
    );
  }

  const rating = data?.rating ?? null;
  const rank = data?.rank ?? null;
  const maxRating = data?.maxRating ?? null;
  const maxRank = data?.maxRank ?? null;

  return (
    <div className="platform-card codeforces">
      <div className="platform-header">
        <h3>Codeforces</h3>
        <span className="solved-count">
          {typeof rating === "number" ? `Rating ${rating}` : "—"}
        </span>
      </div>

      <div className="platform-rating">
        Current:{" "}
        <span className="rating">
          {typeof rating === "number" ? rating : "—"}
        </span>{" "}
        {rank ? `(${rank})` : ""}
        <br />
        Best:{" "}
        <span className="rating">
          {typeof maxRating === "number" ? maxRating : "—"}
        </span>{" "}
        {maxRank ? `(${maxRank})` : ""}
      </div>
    </div>
  );
}

function DiffBar({ label, className, count, total }) {
  const width = useMemo(() => pct(count, total), [count, total]);
  return (
    <div className="difficulty-bar">
      <div className="diff-label">
        <span>{label}</span>
        <span className="diff-count">{Number(count || 0)}</span>
      </div>
      <div className="bar-wrap">
        <div className={`bar ${className}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Progress() {
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState({
    leetcodeUsername: null,
    codeforcesHandle: null,
    leetcodeConnected: false,
    codeforcesConnected: false,
  });

  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [overview, setOverview] = useState(null);

  async function init() {
    setLoading(true);
    setError("");
    try {
      const acct = await apiGetLinkedAccounts();
      setLinked({
        leetcodeUsername: acct?.leetcodeUsername || null,
        codeforcesHandle: acct?.codeforcesHandle || null,
        leetcodeConnected: !!acct?.leetcodeConnected,
        codeforcesConnected: !!acct?.codeforcesConnected,
      });

      if (!acct?.leetcodeConnected && !acct?.codeforcesConnected) {
        setShowEditor(true);
        setOverview(null);
      } else {
        const data = await apiGetProgressOverview();
        setOverview(data);
        setShowEditor(false);
      }
    } catch (err) {
      setError(
        err?.body?.message ||
          err?.message ||
          "Failed to load integration data.",
      );
      setShowEditor(false);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function refreshOverview() {
    try {
      const data = await apiGetProgressOverview();
      setOverview(data);
    } catch (err) {
      setError(
        err?.body?.message ||
          err?.message ||
          "Failed to fetch the latest progress.",
      );
    }
  }

  async function handleSavedHandles({ leetcodeUsername, codeforcesHandle }) {
    setSaving(true);
    setError("");
    try {
      const updated = {
        leetcodeUsername: leetcodeUsername || null,
        codeforcesHandle: codeforcesHandle || null,
        leetcodeConnected: !!leetcodeUsername,
        codeforcesConnected: !!codeforcesHandle,
      };
      setLinked(updated);

      await refreshOverview();
      setShowEditor(false);
    } catch (err) {
      setError(
        err?.body?.message || err?.message || "Failed to refresh progress.",
      );
    } finally {
      setSaving(false);
    }
  }

  function onEditClick() {
    setShowEditor(true);
  }

  function onCancelEdit() {
    if (!linked.leetcodeConnected && !linked.codeforcesConnected) return;
    setShowEditor(false);
  }

  if (loading) return <Loading />;

  return (
    <div
      className="container"
      style={{ minHeight: "100vh", paddingTop: "40px", paddingBottom: "40px" }}
    >
      <div className="card">
        <header className="stack mb-4">
          <h2 className="mb-2">Your Coding Progress</h2>

          <p className="muted">
            Track your growth across LeetCode and Codeforces
          </p>
        </header>

        {error ? <ErrorBanner message={error} /> : null}

        {showEditor ? (
          <LinkForm
            initialLeetCode={linked.leetcodeUsername || ""}
            initialCodeforces={linked.codeforcesHandle || ""}
            onSaved={handleSavedHandles}
            onCancel={onCancelEdit}
          />
        ) : null}

        {!showEditor ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 12,
              }}
            >
              <button onClick={onEditClick} style={styles.secondaryBtn}>
                Edit linked accounts
              </button>
            </div>

            <div className="grid grid-cols-2">
              <LeetCodeCard data={overview?.leetcode} />
              <CodeforcesCard data={overview?.codeforces} />
            </div>

            <div className="progress-charts">
              <div className="chart-card">
                <h3>Overview</h3>
                <div style={styles.overviewLine}>
                  Connected platforms:{" "}
                  <strong>
                    {[
                      overview?.leetcode?.connected ? "LeetCode" : null,
                      overview?.codeforces?.connected ? "Codeforces" : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "None"}
                  </strong>
                </div>
                <div style={styles.overviewLine}>
                  Total solved (LeetCode):{" "}
                  <strong>
                    {overview?.leetcode?.exists === true
                      ? Number(overview?.leetcode?.totalSolved || 0)
                      : "—"}
                  </strong>
                </div>
                <div style={styles.overviewLine}>
                  Current rating (Codeforces):{" "}
                  <strong>
                    {typeof overview?.codeforces?.rating === "number"
                      ? overview.codeforces.rating
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {saving ? (
          <div style={{ marginTop: 10, opacity: 0.85 }}>Updating…</div>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  formCard: {
    backdropFilter: "blur(8px)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.96))",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "1.2rem",
    color: "#133153",
    marginBottom: 18,
  },
  formTitle: {
    margin: 0,
    fontFamily: "Rubik, sans-serif",
  },
  formSub: {
    margin: "6px 0 14px",
    color: "#4b6b8a",
    fontSize: 14,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    color: "#133153",
    fontWeight: 600,
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(19,49,83,0.18)",
    background: "white",
    color: "#133153",
    outline: "none",
    width: "100%",
  },
  primaryBtn: {
    background: "linear-gradient(90deg,#60a5fa,#7c3aed)",
    border: "none",
    color: "#06243a",
    padding: "0.7rem 1rem",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "linear-gradient(90deg,#60a5fa,#3b82f6)",
    border: "none",
    color: "#06243a",
    padding: "0.6rem 0.9rem",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(59,130,246,0.12)",
  },
  cancelBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "white",
    padding: "0.6rem 0.9rem",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  helpError: {
    marginTop: 6,
    color: "#b83a3a",
    fontSize: 13,
  },
  note: {
    marginTop: 10,
    color: "#4b6b8a",
    fontSize: 13,
  },
  disconnectedText: {
    color: "#4b6b8a",
  },
  overviewLine: {
    marginBottom: 6,
  },
};

export default Progress;
