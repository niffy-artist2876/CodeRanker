import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const { login } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      nav('/')
    } catch (e) {
      setError('Login failed')
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Login (PESU credentials)</h2>
        <form onSubmit={submit} className="flex" style={{flexDirection:'column', gap:12}}>
          <input placeholder="SRN / PRN" value={username} onChange={e=>setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit">Login</button>
          {error && <div style={{color:'#f66'}}>{error}</div>}
        </form>
      </div>
    </div>
  )
}
