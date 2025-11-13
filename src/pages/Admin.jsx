import { useState } from 'react'
import api from '../api.js'

export default function Admin() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')

  const createContest = async () => {
    await api.post('/api/contests', { title, date })
    alert('Contest created')
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Admin — Create Contest</h2>
        <div className="flex" style={{flexDirection:'column', gap:12}}>
          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} />
          <button onClick={createContest}>Create</button>
        </div>
      </div>
    </div>
  )
}
