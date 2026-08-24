import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productApi, restockApi } from '../lib/api'
import { useApp } from '../context/AppContext'
import { angka, keRFC3339, tanggalBesok } from '../lib/format'

const ALASAN_SKIP = {
  riwayat_tidak_cukup: 'Belum ada riwayat penjualan yang cukup untuk produk ini.',
  kesalahan_ml: 'Model prediksi gagal memproses produk ini, coba lagi nanti.',
  restock_tidak_diperlukan: 'Stok masih mencukupi, belum perlu restock.',
}

export default function Prakiraan() {
  const { store } = useApp()
  const [produk, setProduk] = useState([])
  const [produkId, setProdukId] = useState('')
  const [tanggal, setTanggal] = useState(tanggalBesok())
  const [tersimpan, setTersimpan] = useState([])
  const [hasil, setHasil] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([productApi.list({ store_id: store.id, size: 100 }), restockApi.list(store.id)])
      .then(([p, r]) => {
        setProduk(p.data || [])
        setTersimpan(r.data || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [store.id])

  const buat = async () => {
    setError('')
    setBusy(true)
    setHasil(null)
    try {
      const res = await restockApi.generate({
        store_id: store.id,
        product_id: produkId || undefined,
        forecast_date: keRFC3339(tanggal),
        history_days: 30,
      })
      setHasil(res.data)
      // Sinkronkan daftar tersimpan dengan hasil generate terbaru.
      const res2 = await restockApi.list(store.id)
      setTersimpan(res2.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Prakiraan restock</h1>
      <p className="page-lede">
        Model memperkirakan penjualan harian dari pola 30 hari terakhir, lalu menghitung berapa banyak yang sebaiknya dikulak sebelum
        tanggal target.
      </p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="pilih">Produk</label>
        <select id="pilih" value={produkId} onChange={(e) => setProdukId(e.target.value)} disabled={loading}>
          <option value="">Semua produk</option>
          {produk.map((p) => (
            <option key={p.id} value={p.id}>
              {p.product_name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tgl-target">Perkirakan untuk tanggal</label>
        <input id="tgl-target" type="date" min={tanggalBesok()} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        <p className="field__hint">Minimal besok — model butuh setidaknya satu hari untuk kamu berbelanja stok.</p>
      </div>

      <button className="btn btn--brand btn--block" style={{ marginTop: 16 }} onClick={buat} disabled={busy || loading}>
        {busy ? 'Menghitung…' : 'Buat prediksi'}
      </button>

      {hasil && (
        <div className="card" style={{ marginTop: 20 }}>
          <p className="eyebrow">Hasil terbaru</p>
          <p className="muted" style={{ marginTop: 4 }}>
            {hasil.generated_count} produk dapat rekomendasi restock
            {hasil.skipped_count > 0 ? `, ${hasil.skipped_count} dilewati` : ''}.
          </p>

          {hasil.skipped?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {hasil.skipped.map((s) => (
                <div key={s.product_id} className="nota__line">
                  <span>
                    {s.product_name}
                    <br />
                    <span className="muted">{ALASAN_SKIP[s.reason] || s.reason}</span>
                  </span>
                  <span className="chip chip--warn">Dilewati</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="eyebrow" style={{ marginTop: 24, marginBottom: 8 }}>Rekomendasi tersimpan</p>

      {loading && <div className="skeleton" />}

      {!loading && !tersimpan.length && (
        <div className="empty">Belum ada prediksi restock. Buat yang pertama lewat tombol di atas.</div>
      )}

      <div className="stack">
        {tersimpan.map((r) => (
          <div key={r.id} className="card">
            <div className="row">
              <div>
                <strong>{r.product_name}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  target {r.forecast_date} · stok sekarang <span className="num">{angka(r.current_stock)}</span> {r.unit}
                </p>
              </div>
              <span className="chip chip--ok">
                +{angka(r.recommended_restock_qty)} {r.unit}
              </span>
            </div>
            <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
              perkiraan terjual <span className="num">{angka(r.daily_sales)}</span> {r.unit}/hari
            </p>
          </div>
        ))}
      </div>

      <Link to="/" className="btn btn--ghost btn--block" style={{ marginTop: 20 }}>
        Kembali ke laporan
      </Link>
    </>
  )
}
