import { useCallback, useEffect, useState } from 'react'
import { transactionApi } from '../lib/api'
import { useApp } from '../context/AppContext'
import { rupiah, waktuSingkat } from '../lib/format'

export default function Riwayat() {
  const { store } = useApp()
  const [data, setData] = useState([])
  const [paging, setPaging] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const muat = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transactionApi.list({ store_id: store.id, page, size: 10 })
      setData(res.data || [])
      setPaging(res.paging || null)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [store.id, page])

  useEffect(() => {
    muat()
  }, [muat])

  const hapus = async (id) => {
    if (!window.confirm('Hapus transaksi ini? Stok produk akan dikembalikan.')) return
    try {
      await transactionApi.remove(id, store.id)
      muat()
    } catch (err) {
      setError(err.message)
    }
  }

  const totalNota = (t) => (t.items || []).reduce((s, i) => s + i.qty * i.selling_price_snapshot, 0)

  return (
    <>
      <h1 className="page-title">Riwayat</h1>
      <p className="page-lede">Semua nota yang pernah tersimpan di toko ini.</p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && <div className="skeleton" />}
      {!loading && !data.length && <div className="empty">Belum ada transaksi tercatat.</div>}

      <div className="stack">
        {data.map((t) => (
          <div key={t.id}>
            <div className="nota">
              <div className="row" style={{ marginBottom: 8 }}>
                <span className="eyebrow">{t.transaction_date}</span>
                <span className="muted num">{waktuSingkat(t.created_at)}</span>
              </div>
              {(t.items || []).map((i) => (
                <div key={i.id} className="nota__line">
                  <span>
                    {i.product_name_snapshot}
                    <br />
                    <span className="muted num">
                      {i.qty} × {rupiah(i.selling_price_snapshot)}
                    </span>
                  </span>
                  <span className="num">{rupiah(i.qty * i.selling_price_snapshot)}</span>
                </div>
              ))}
              <div className="nota__total">
                <span className="eyebrow">Total</span>
                <span className="num" style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                  {rupiah(totalNota(t))}
                </span>
              </div>
              <button className="btn btn--sm btn--danger" style={{ marginTop: 12 }} onClick={() => hapus(t.id)}>
                Hapus nota
              </button>
            </div>
            <div className="nota__tear" aria-hidden="true" />
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
