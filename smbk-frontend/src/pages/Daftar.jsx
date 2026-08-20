import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Daftar() {
  const { signUp } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // Backend selalu mengembalikan token+user langsung dari /users (POST),
      // jadi tidak perlu login terpisah setelah daftar.
      await signUp(form)
      navigate('/toko')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <p className="eyebrow">Buat akun</p>
      <h1 className="auth__mark">
        Nota<span>.</span>
      </h1>
      <p className="page-lede">Satu akun untuk satu pemilik warung.</p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="u">Nama pengguna</label>
          <input id="u" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required maxLength={100} />
        </div>
        <div className="field">
          <label htmlFor="e">Email</label>
          <input id="e" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
        </div>
        <div className="field">
          <label htmlFor="p">Kata sandi</label>
          <input
            id="p"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            maxLength={100}
          />
          <p className="field__hint">Minimal 6 karakter.</p>
        </div>
        <button className="btn btn--brand btn--block" style={{ marginTop: 24 }} disabled={busy}>
          {busy ? 'Membuat akun…' : 'Buat akun'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 24, textAlign: 'center' }}>
        Sudah punya akun? <Link to="/masuk">Masuk</Link>
      </p>
    </div>
  )
}
