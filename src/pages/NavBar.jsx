import {Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function NavBar(){
    const {user, logout} = useAuth()
    const navigate = useNavigate()
    return (
        <header className="site-header glass">
        <div className="brand"><Link to = '/'>CodeRanker</Link></div>
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
    )
}