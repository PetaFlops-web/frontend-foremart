import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reportApi } from '../lib/api'
import { useApp } from '../context/AppContext'
import { angka, rupiah, tanggalHariIni, tanggalPanjang } from '../lib/format'

export default function HariIni() {
  const { store } = useApp()
  const [tanggal, setTanggal] = useState(tanggalHariIni())
  const [laporan, setLaporan] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    reportApi
      .daily(store.id, tanggal)
      .then((res) => alive && setLaporan(res.data))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [store.id, tanggal])

  return (
    <>
      <h1 className="page-title">Laporan harian</h1>
      <p className="page-lede">{tanggalPanjang(tanggal)}</p>

      <div className="field" style={{ marginBottom: 20 }}>
        <label htmlFor="tgl">Pilih tanggal</label>
        <input id="tgl" type="date" value={tanggal} max={tanggalHariIni()} onChange={(e) => setTanggal(e.target.value)} />
      </div>

      {loading && (
        <div className="stack">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}

      {error && !loading && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      {laporan && !loading && (
        <div className="stack">
          <div className="card">
            <p className="eyebrow">Omzet</p>
            <p className="amount">{rupiah(laporan.total_omset)}</p>
            <div className="row" style={{ marginTop: 16 }}>
              <div>
                <p className="eyebrow">Untung</p>
                <p className="num" style={{ fontWeight: 700 }}>{rupiah(laporan.total_untung)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="eyebrow">Transaksi</p>
                <p className="num" style={{ fontWeight: 700 }}>{angka(laporan.jumlah_transaksi)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="eyebrow" style={{ marginBottom: 8 }}>Paling laku</p>
            {laporan.produk_terlaris?.length ? (
              laporan.produk_terlaris.map((p) => (
                <div key={p.product_id} className="nota__line">
                  <span>
                    {p.product_name}
                    <br />
                    <span className="muted">sisa {angka(p.current_stock)} {p.unit}</span>
                  </span>
                  <span className="num">{angka(p.qty_sold)} {p.unit}</span>
                </div>
              ))
            ) : (
              <p className="muted">Belum ada penjualan tercatat pada tanggal ini.</p>
            )}
          </div>

          <div className="card">
            <p className="eyebrow" style={{ marginBottom: 8 }}>Sisa stok</p>
            {laporan.sisa_stok?.length ? (
              laporan.sisa_stok.map((s) => (
                <div key={s.product_id} className="nota__line">
                  <span>{s.product_name}</span>
                  <span className="num">{angka(s.stock)} {s.unit}</span>
                </div>
              ))
            ) : (
              <p className="muted">Belum ada produk terdaftar.</p>
            )}
          </div>

          <Link to="/prakiraan" className="btn btn--ghost btn--block">
            Lihat prakiraan restock
          </Link>
        </div>
      )}
    </>
  )
}
