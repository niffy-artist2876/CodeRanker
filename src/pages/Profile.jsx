import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api.js'
import NavBar from './NavBar.jsx'

export default function Profile() {
  const { srn } = useParams()
  const [me, setMe] = useState(null)
  useEffect(()=>{
    // For simplicity: if viewing own profile, back-end still returns /me.
    api.get('/api/users/me').then(r=> setMe(r.data.user))
  },[])

  if (!me) return <div className="container"><div className="card">Loading...</div></div>
  return (
    <div className="container">
      <NavBar></NavBar>
      <div className="card">
        <h2>{me.name}</h2>
        <p>SRN: {me.srn}</p>
        <p>Codeforces: {me.codeforcesHandle} — {me.codeforcesStats?.rating ?? '—'} {me.codeforcesStats?.rank ? `(${me.codeforcesStats.rank})` : ''}</p>
        <p>LeetCode: {me.leetcodeHandle} — Solved {me.leetcodeStats?.totalSolved ?? '—'}</p>
      </div>
    </div>
  )
}
