import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { storeApi } from '../lib/api'
import { useApp } from '../context/AppContext'

export default function Toko() {
  const { store, saveStore } = useApp()
  const navigate = useNavigate()
  const [nama, setNama] = useState(store?.store_name || '')
  const [idManual, setIdManual] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const buat = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = store ? await storeApi.update(store.id, { store_name: nama }) : await storeApi.create({ store_name: nama })
      saveStore(res.data)
      navigate('/')
    } catch (err) {
      // Backend menolak toko kedua untuk user yang sama (409) — biasanya
      // artinya user ini sudah punya toko dari sesi/perangkat lain.
      setError(
        err.status === 409
          ? 'Akun ini sudah punya toko. Tempel ID toko di bawah untuk menyambungkannya.'
          : err.message,
      )
    } finally {
      setBusy(false)
    }
  }

  const sambungkan = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await storeApi.get(idManual.trim())
      saveStore(res.data)
      navigate('/')
    } catch {
      setError('ID toko tidak ditemukan untuk akun ini.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <p className="eyebrow">Langkah terakhir</p>
      <h1 className="page-title">{store ? 'Ubah nama toko' : 'Beri nama warungmu'}</h1>
      <p className="page-lede">Nama ini muncul di setiap nota dan laporan harian.</p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={buat}>
        <div className="field">
          <label htmlFor="n">Nama toko</label>
          <input id="n" value={nama} onChange={(e) => setNama(e.target.value)} minLength={3} required placeholder="Warung Bu Ani" />
        </div>
        <button className="btn btn--brand btn--block" style={{ marginTop: 20 }} disabled={busy}>
          {store ? 'Simpan perubahan' : 'Simpan dan mulai'}
        </button>
      </form>

      {!store && (
        <form onSubmit={sambungkan} style={{ marginTop: 40 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Sudah punya toko di akun ini?</p>
          <div className="field">
            <label htmlFor="sid">ID toko</label>
            <input id="sid" value={idManual} onChange={(e) => setIdManual(e.target.value)} placeholder="uuid toko" />
          </div>
          <button className="btn btn--ghost btn--block" style={{ marginTop: 12 }} disabled={busy || !idManual}>
            Sambungkan toko
          </button>
        </form>
      )}
    </div>
  )
}
