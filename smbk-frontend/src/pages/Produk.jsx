import { useEffect, useState } from 'react'
import { productApi } from '../lib/api'
import { useApp } from '../context/AppContext'
import { angka, rupiah } from '../lib/format'

const KOSONG = { product_name: '', cost_price: 0, selling_price: 0, stock: 0, unit: 'pcs' }

export default function Produk() {
  const { store } = useApp()
  const [daftar, setDaftar] = useState([])
  const [cari, setCari] = useState('')
  const [form, setForm] = useState(null) // null = form tertutup
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  // Debounce pencarian + jaga supaya respons yang telat (karena user ketik
  // cepat) tidak menimpa hasil pencarian yang lebih baru.
  useEffect(() => {
    let alive = true
    setLoading(true)
    const t = setTimeout(() => {
      productApi
        .list({ store_id: store.id, name: cari, size: 100 })
        .then((res) => {
          if (!alive) return
          setDaftar(res.data || [])
          setError('')
        })
        .catch((err) => alive && setError(err.message))
        .finally(() => alive && setLoading(false))
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [store.id, cari, reloadKey])

  const muatUlang = () => setReloadKey((k) => k + 1)

  const simpan = async (e) => {
    e.preventDefault()
    setError('')
    const body = {
      store_id: store.id,
      product_name: form.product_name,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      stock: Number(form.stock),
      unit: form.unit,
    }
    try {
      if (form.id) await productApi.update(form.id, body)
      else await productApi.create(body)
      setForm(null)
      muatUlang()
    } catch (err) {
      setError(err.message)
    }
  }

  const hapus = async (id) => {
    if (!window.confirm('Hapus produk ini dari daftar?')) return
    try {
      await productApi.remove(id, store.id)
      muatUlang()
    } catch (err) {
      setError(err.message)
    }
  }

  const hargaLebihMurahDariModal = form && Number(form.selling_price) > 0 && Number(form.selling_price) < Number(form.cost_price)

  return (
    <>
      <h1 className="page-title">Produk</h1>
      <p className="page-lede">Harga dan stok di sini yang dipakai saat mencatat penjualan.</p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="cari">Cari produk</label>
        <input id="cari" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="beras, minyak, gula…" />
      </div>

      <button className="btn btn--brand btn--block" style={{ margin: '16px 0' }} onClick={() => setForm({ ...KOSONG })}>
        Tambah produk
      </button>

      {form && (
        <form className="card" onSubmit={simpan} style={{ marginBottom: 16 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>{form.id ? 'Ubah produk' : 'Produk baru'}</p>
          <div className="field">
            <label htmlFor="nm">Nama</label>
            <input id="nm" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label htmlFor="hm">Harga modal</label>
              <input id="hm" type="number" min="0" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </div>
            <div>
              <label htmlFor="hj">Harga jual</label>
              <input id="hj" type="number" min="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="st">Stok</label>
              <input id="st" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <label htmlFor="un">Satuan</label>
              <input id="un" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required placeholder="kg, liter, pcs" />
            </div>
          </div>
          {hargaLebihMurahDariModal && (
            <p className="field__hint" style={{ color: 'var(--color-danger)', marginTop: 8 }}>
              Harga jual lebih rendah dari harga modal — nanti tercatat rugi.
            </p>
          )}
          <div className="row" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setForm(null)}>
              Batal
            </button>
            <button className="btn btn--brand">Simpan</button>
          </div>
        </form>
      )}

      {loading && <div className="skeleton" />}

      {!loading && !daftar.length && <div className="empty">Belum ada produk yang cocok. Tambahkan produk pertamamu.</div>}

      <div className="stack">
        {daftar.map((p) => (
          <div key={p.id} className="card">
            <div className="row">
              <div>
                <strong>{p.product_name}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  <span className="num">{rupiah(p.selling_price)}</span> · modal <span className="num">{rupiah(p.cost_price)}</span>
                </p>
              </div>
              <span className={`chip ${p.stock > 0 ? 'chip--ok' : 'chip--warn'}`}>
                {angka(p.stock)} {p.unit}
              </span>
            </div>
            <div className="row" style={{ marginTop: 12, justifyContent: 'flex-start', gap: 8 }}>
              <button className="btn btn--sm btn--ghost" onClick={() => setForm({ ...p })}>
                Ubah
              </button>
              <button className="btn btn--sm btn--danger" onClick={() => hapus(p.id)}>
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
