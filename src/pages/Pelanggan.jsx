import { useEffect, useState } from 'react'
import { customerApi } from '../lib/api'
import { useApp } from '../context/AppContext'
import { waktuSingkat } from '../lib/format'

const KOSONG = { name: '', phone: '' }

export default function Pelanggan() {
  const { store } = useApp()
  const [daftar, setDaftar] = useState([])
  const [paging, setPaging] = useState(null)
  const [cari, setCari] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(null) // null = form tertutup
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const t = setTimeout(() => {
      customerApi
        .list({ store_id: store.id, search: cari, page, size: 10 })
        .then((res) => {
          if (!alive) return
          setDaftar(res.data || [])
          setPaging(res.paging || null)
          setError('')
        })
        .catch((err) => alive && setError(err.message))
        .finally(() => alive && setLoading(false))
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [store.id, cari, page, reloadKey])

  const muatUlang = () => setReloadKey((k) => k + 1)

  const simpan = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await customerApi.create({ store_id: store.id, name: form.name, phone: form.phone })
      setForm(null)
      muatUlang()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h1 className="page-title">Pelanggan</h1>
      <p className="page-lede">Nomor telepon di sini dipakai untuk kirim pengingat pembelian ulang lewat WhatsApp.</p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="cari">Cari pelanggan</label>
        <input id="cari" value={cari} onChange={(e) => { setCari(e.target.value); setPage(1) }} placeholder="nama atau nomor…" />
      </div>

      <button className="btn btn--brand btn--block" style={{ margin: '16px 0' }} onClick={() => setForm({ ...KOSONG })}>
        Tambah pelanggan
      </button>

      {form && (
        <form className="card" onSubmit={simpan} style={{ marginBottom: 16 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Pelanggan baru</p>
          <div className="field">
            <label htmlFor="nm">Nama</label>
            <input id="nm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Budi (opsional)" maxLength={100} />
          </div>
          <div className="field">
            <label htmlFor="hp">Nomor WhatsApp</label>
            <input
              id="hp"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="6281234567890"
              required
              minLength={8}
              maxLength={20}
            />
            <p className="field__hint">Format E.164: awalan 62, tanpa + dan tanpa 0 di depan.</p>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setForm(null)}>
              Batal
            </button>
            <button className="btn btn--brand">Simpan</button>
          </div>
        </form>
      )}

      {loading && <div className="skeleton" />}
      {!loading && !daftar.length && <div className="empty">Belum ada pelanggan. Tambahkan pelanggan pertamamu.</div>}

      <div className="stack">
        {daftar.map((c) => (
          <div key={c.id} className="card">
            <div className="row">
              <div>
                <strong>{c.name || 'Tanpa nama'}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  <span className="num">{c.phone}</span>
                </p>
              </div>
              <span className="muted num">{waktuSingkat(c.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {paging && paging.total_page > 1 && (
        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Sebelumnya
          </button>
          <span className="muted num">
            {paging.page} / {paging.total_page}
          </span>
          <button className="btn btn--ghost btn--sm" disabled={page >= paging.total_page} onClick={() => setPage((p) => p + 1)}>
            Berikutnya
          </button>
        </div>
      )}
    </>
  )
}
