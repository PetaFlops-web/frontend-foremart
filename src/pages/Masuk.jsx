import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Masuk() {
  const { signIn, user, booting } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!booting && user) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <p className="eyebrow">Catatan warung, tanpa buku tulis</p>
      <h1 className="auth__mark">
        Nota<span>.</span>
      </h1>
      <p className="page-lede">Masuk untuk mencatat penjualan hari ini.</p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="username">Nama pengguna</label>
          <input
            id="username"
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Kata sandi</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <button className="btn btn--brand btn--block" style={{ marginTop: 24 }} disabled={busy}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 24, textAlign: 'center' }}>
        Belum punya akun? <Link to="/daftar">Daftar di sini</Link>
      </p>
    </div>
  )
}
