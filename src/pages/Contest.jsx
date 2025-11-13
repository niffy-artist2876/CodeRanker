import { useEffect, useState } from 'react'
import api from '../api.js'

export default function Contest() {
  const [contests, setContests] = useState([])
  useEffect(()=>{ api.get('/api/contests').then(r=> setContests(r.data.contests || [])) },[])
  return (
    <div className="container page">
      <div className="card glass">
        <h2>Contests</h2>
           <ul className="list contests-list">
             {contests.map((c) => (
               <li key={c._id} className="contest-item">
                 <div className="contest-date">{new Date(c.date).toLocaleString()}</div>
                 <div className="contest-title">{c.title}</div>
               </li>
             ))}
           </ul>
      </div>
    </div>
  )
}
