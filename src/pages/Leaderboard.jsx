import { useEffect, useState } from 'react'
import api from '../api.js'

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  useEffect(()=>{ api.get('/api/users/leaderboard').then(r=> setUsers(r.data.users || [])) },[])

  const medal = (i) => i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : ''

  return (
    <div className="container page">
      <div className="heading-row">
        <h2 className="page-title">College Leaderboard</h2>
        <div className="hint">Sorted by Codeforces rating, then LeetCode solves</div>
      </div>

      <div className="card glass overflow">
        <table className="table modern">
          <thead>
            <tr><th>#</th><th>Name</th><th>CF Rating</th><th>CF Rank</th><th>LC Solved</th></tr>
          </thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u._id || i} className={i<3 ? 'toprow' : ''}>
                <td>{medal(i)} {i+1}</td>
                <td>{u.name}</td>
                <td>{u.codeforcesStats?.rating ?? '—'}</td>
                <td>{u.codeforcesStats?.rank ?? '—'}</td>
                <td>{u.leetcodeStats?.totalSolved ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
