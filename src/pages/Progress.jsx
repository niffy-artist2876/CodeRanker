import { useAuth } from '../context/AuthContext.jsx'

export default function Progress() {
  const { user } = useAuth()

  if (!user) return (
    <div className="container progress-page">
      <div className="card progress-card">
        <h2 className="page-title">Progress</h2>
        <p className="hint">Please log in to view your progress.</p>
      </div>
    </div>
  )

  const cf = user.codeforcesStats || {}
  const lc = user.leetcodeStats || {}

  return (
    <div className="container progress-page">
      <div className="card progress-card">
        <h2 className="page-title">Your Progress</h2>

        <div className="progress-grid">
          <div className="platform-card cf">
            <div className="platform-header">
              <div className="platform-name">Codeforces</div>
              <div className="platform-handle">{user.codeforcesHandle || '—'}</div>
            </div>
            <div className="platform-stats">
              <div className="stat"><div className="label">Rating</div><div className="value">{cf.rating ?? '—'}</div></div>
              <div className="stat"><div className="label">Max Rating</div><div className="value">{cf.maxRating ?? '—'}</div></div>
              <div className="stat"><div className="label">Rank</div><div className="value">{cf.rank ?? '—'}</div></div>
            </div>
          </div>

          <div className="platform-card lc">
            <div className="platform-header">
              <div className="platform-name">LeetCode</div>
              <div className="platform-handle">{user.leetcodeHandle || '—'}</div>
            </div>
            <div className="platform-stats">
              <div className="stat"><div className="label">Total Solved</div><div className="value">{lc.totalSolved ?? '—'}</div></div>
              <div className="stat"><div className="label">Easy</div><div className="value">{lc.easySolved ?? '—'}</div></div>
              <div className="stat"><div className="label">Medium</div><div className="value">{lc.mediumSolved ?? '—'}</div></div>
              <div className="stat"><div className="label">Hard</div><div className="value">{lc.hardSolved ?? '—'}</div></div>
            </div>
          </div>
        </div>

        <div className="progress-actions">
          <a className="action-link" href={user.codeforcesHandle ? `https://codeforces.com/profile/${user.codeforcesHandle}` : '#'} target="_blank" rel="noreferrer">
            <button className="btn btn-primary" disabled={!user.codeforcesHandle}>Open CF Profile</button>
          </a>
          <a className="action-link" href={user.leetcodeHandle ? `https://leetcode.com/${user.leetcodeHandle}` : '#'} target="_blank" rel="noreferrer">
            <button className="btn btn-primary" disabled={!user.leetcodeHandle}>Open LeetCode Profile</button>
          </a>
        </div>

      </div>
    </div>
  )
}
