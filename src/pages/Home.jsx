import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="hero-wrap">
      <div className="bg-layers">
        <div className="bg-radial" />
        <div className="bg-grid" />
        <div className="bg-noise" />
      </div>

      <header className="site-header glass">
        <div className="brand">CodeRanker</div>
        <nav className="nav-items">
          <Link to="/leaderboard">Leaderboard</Link>
          <Link to="/contests">Weekly Contest</Link>
          {user && <Link to="/progress">Progress</Link>}
          {/*<Link to="/">Home</Link>*/}
          <Link to="/settings">Settings</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </nav>
        <div className="nav-cta">
          {!user ? (
            <Link className="btn btn-ghost" to="/login">Login</Link>
          ) : (
            <>
              <span className="pill"><Link to='/profile/:srn'>Hello, {user.name?.split(' ')[0] || 'Coder'}</Link></span>
              <button className="btn btn-ghost" onClick={() => { logout(); navigate('/'); }} style={{marginLeft: '0.5rem'}}>Logout</button>
            </>
          )}
        </div>
      </header>

      <main className="hero container">
        <h1 className="headline">
          <span className="accent">Code</span>Ranker
        </h1>
        <p className="subhead">Unite your coding performance across Codeforces &amp; LeetCode into a single, fair leaderboard. Host weekly college contests. Track growth.</p>

        <div className="cta-row">
          {!user && <Link to="/login" className="btn btn-primary">Login</Link>}
          {user && <Link to="/progress" className="btn btn-primary">My Progress</Link>}
          <Link to="/leaderboard" className="btn btn-ghost">View Leaderboard</Link>
        </div>

        <div className="feature-grid">
          <div className="feature glass">
            <div className="feature-icon">🏆</div>
            <div className="feature-title">Unified Rankings</div>
            <div className="feature-desc">Normalize ratings &amp; solves for a fair comparison across platforms.</div>
          </div>
          <div className="feature glass">
            <div className="feature-icon">🧩</div>
            <div className="feature-title">Weekly Contests</div>
            <div className="feature-desc">Run college-only contests with custom problems and scoring.</div>
          </div>
          <div className="feature glass">
            <div className="feature-icon">📈</div>
            <div className="feature-title">Growth Tracking</div>
            <div className="feature-desc">Charts for streaks, rating deltas, and season summaries.</div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-row">
          <div className="tiny">© {new Date().getFullYear()} CodeRanker</div>
          <a className="tiny link" href="https://example.com" target="_blank" rel="noreferrer">Source</a>
        </div>
      </footer>
    </div>
  )
}
