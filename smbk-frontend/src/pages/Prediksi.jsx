import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { customerApi, productApi, survivalApi } from '../lib/api'
import { useApp } from '../context/AppContext'
import { angka, persen, tanggalPanjang } from '../lib/format'

export default function Prediksi() {
  const { store } = useApp()
  const [pelanggan, setPelanggan] = useState([])
  const [produk, setProduk] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [hasil, setHasil] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      customerApi.list({ store_id: store.id, page: 1, size: 100 }),
      productApi.list({ store_id: store.id, size: 100 }),
    ])
      .then(([c, p]) => {
        setPelanggan(c.data || [])
        setProduk(p.data || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [store.id])

  const buat = async (e) => {
    e.preventDefault()
    setError('')
    setHasil(null)
    setBusy(true)
    try {
      const res = await survivalApi.predict({
        store_id: store.id,
        customer_id: Number(customerId),
        product_id: productId,
      })
      setHasil(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Prediksi pembelian ulang</h1>
      <p className="page-lede">
        Perkirakan kapan pelanggan akan membeli kembali sebuah produk, berdasarkan riwayat pembeliannya.
      </p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={buat}>
        <div className="field">
          <label htmlFor="cust">Pelanggan</label>
          <select id="cust" value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={loading} required>
            <option value="">Pilih pelanggan</option>
            {pelanggan.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ? `${c.name} · ` : ''}{c.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="prod">Produk</label>
          <select id="prod" value={productId} onChange={(e) => setProductId(e.target.value)} disabled={loading} required>
            <option value="">Pilih produk</option>
            {produk.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn--brand btn--block" style={{ marginTop: 16 }} disabled={busy || loading}>
          {busy ? 'Menghitung…' : 'Prediksi pembelian ulang'}
        </button>
      </form>

      {loading && <div className="skeleton" style={{ marginTop: 16 }} />}

      {!loading && !pelanggan.length && (
        <div className="empty">Belum ada pelanggan. Tambahkan dulu di tab Pelanggan.</div>
      )}

      {!loading && pelanggan.length > 0 && !produk.length && (
        <div className="empty">Belum ada produk. Tambahkan dulu di tab Produk.</div>
      )}

      {hasil && (
        <div className="card" style={{ marginTop: 20 }}>
          <p className="eyebrow">Hasil prediksi</p>
          <div className="row" style={{ marginTop: 8 }}>
            <strong>{hasil.stock_code}</strong>
            <span className="chip chip--ok">{tanggalPanjang(hasil.predicted_restock_date)}</span>
          </div>

          <div className="nota" style={{ marginTop: 16 }}>
            <div className="nota__line">
              <span>Perkiraan beli ulang</span>
              <span className="num">{tanggalPanjang(hasil.predicted_restock_date)}</span>
            </div>
            <div className="nota__line">
              <span>Sisa hari menuju prediksi</span>
              <span className="num">{angka(hasil.pred_days_left)} hari</span>
            </div>
            <div className="nota__line">
              <span>Hari sejak beli terakhir</span>
              <span className="num">{angka(hasil.days_since_last_buy)} hari</span>
            </div>
            <div className="nota__line">
              <span>Median jarak antar pembelian</span>
              <span className="num">{angka(hasil.pred_median_survival_days)} hari</span>
            </div>
          </div>

          <p className="eyebrow" style={{ marginTop: 16, marginBottom: 8 }}>Probabilitas membeli ulang</p>
          <div className="nota__line">
            <span>Dalam 7 hari</span>
            <span className="num">{persen(hasil.prob_buy_within_7d)}</span>
          </div>
          <div className="nota__line">
            <span>Dalam 14 hari</span>
            <span className="num">{persen(hasil.prob_buy_within_14d)}</span>
          </div>
          <div className="nota__line">
            <span>Dalam 30 hari</span>
            <span className="num">{persen(hasil.prob_buy_within_30d)}</span>
          </div>

          {typeof hasil.partial_hazard === 'number' && (
            <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
              Partial hazard: <span className="num">{hasil.partial_hazard}</span>
            </p>
          )}
        </div>
      )}

      <Link to="/notifikasi" className="btn btn--ghost btn--block" style={{ marginTop: 20 }}>
        Kirim notifikasi WhatsApp
      </Link>
    </>
  )
}
