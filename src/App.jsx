import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Admin from './pages/Admin.jsx'
import Contest from './pages/Contest.jsx'
import Home from './pages/Home.jsx'
import Progress from './pages/Progress.jsx'

function Private({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/contests" element={<Contest />} />
      <Route path="/profile/:srn" element={<Profile />} />
      <Route path="/settings" element={<Private><Settings /></Private>} />
      <Route path="/admin" element={<Private><Admin /></Private>} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/progress" element={<Private><Progress /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
