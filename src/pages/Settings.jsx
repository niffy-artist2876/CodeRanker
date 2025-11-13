import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'

export default function Settings() {
  const { user } = useAuth()
  const [cf, setCf] = useState(user?.codeforcesHandle || '')
  const [lc, setLc] = useState(user?.leetcodeHandle || '')
  const [msg, setMsg] = useState('')

  const save = async () => {
    setMsg('Saving...')
    await api.put('/api/users/me/handles', { codeforcesHandle: cf, leetcodeHandle: lc })
    setMsg('Saved! Stats refreshing…')
  }

  return (
    <div className="container page">
      <div className="card glass">
        <h2>Connect Platforms</h2>
        <p className="hint">Add your Codeforces and LeetCode handles. We’ll fetch ratings and solve counts.</p>
        <div className="flex-col">
          <label>Codeforces Handle
            <input value={cf} onChange={e=>setCf(e.target.value)} placeholder="e.g. tourist" />
          </label>
          <label>LeetCode Username
            <input value={lc} onChange={e=>setLc(e.target.value)} placeholder="e.g. jane_doe" />
          </label>
          <button className="btn btn-primary" onClick={save}>Save</button>
          <div className="hint">{msg}</div>
        </div>
      </div>
    </div>
  )
}
