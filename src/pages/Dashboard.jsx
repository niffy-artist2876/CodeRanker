import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'

export default function Dashboard() {
  const [top, setTop] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/users/leaderboard').then(r => setTop(r.data.users || []))
  }, [])

  return (
    <div className="container">
      <div style={{marginBottom: '1rem'}}>
        <button onClick={() => navigate('/progress')}>See My Progress</button>
      </div>
      <div className="card">
        <h2>Leaderboard (Top)</h2>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>CF</th><th>LC Solved</th></tr>
          </thead>
          <tbody>
            {top.map((u,i)=>(
              <tr key={u._id || i}>
                <td>{u.name}</td>
                <td>{u.codeforcesStats?.rating || '—'} {u.codeforcesStats?.rank ? `(${u.codeforcesStats.rank})` : ''}</td>
                <td>{u.leetcodeStats?.totalSolved ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
