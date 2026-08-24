import { useEffect, useState } from 'react'
import { notificationApi } from '../lib/api'
import { useApp } from '../context/AppContext'
import { tanggalPanjang, waktuSingkat } from '../lib/format'

const RULE = {
  REPEAT_3X: 'Promo belanja ulang',
  REMINDER: 'Pengingat biasa',
}

export default function Notifikasi() {
  const { store } = useApp()
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const muat = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await notificationApi.list(store.id)
      setLogs(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    muat()
  }, [store.id])

  const kirim = async () => {
    setError('')
    setStatus('')
    setBusy(true)
    try {
      const res = await notificationApi.send()
      setStatus(`Notifikasi terkirim: ${res.data}`)
      await muat()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Notifikasi</h1>
      <p className="page-lede">
        Kirim pengingat WhatsApp ke pelanggan yang diprediksi akan membeli ulang dalam waktu dekat.
      </p>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {status && (
        <div className="alert alert--info" role="status" style={{ marginBottom: 16 }}>
          {status}
        </div>
      )}

      <button className="btn btn--brand btn--block" style={{ margin: '16px 0' }} onClick={kirim} disabled={busy}>
        {busy ? 'Mengirim…' : 'Kirim notifikasi sekarang'}
      </button>
      <p className="field__hint">
        Backend juga mengirim notifikasi ini otomatis tiap hari. Tombol di atas memicu alur yang sama untuk uji coba.
      </p>

      {loading && <div className="skeleton" />}
      {!loading && !logs.length && <div className="empty">Belum ada notifikasi terkirim.</div>}

      <div className="stack">
        {logs.map((n) => (
          <div key={n.id} className="card">
            <div className="row">
              <span className={`chip ${n.status === 'sent' ? 'chip--ok' : 'chip--danger'}`}>
                {n.status === 'sent' ? 'Terkirim' : 'Gagal'}
              </span>
              <span className="muted num">{waktuSingkat(n.created_at)}</span>
            </div>
            <p className="muted" style={{ margin: '12px 0 0' }}>
              {n.message}
            </p>
            <div className="nota__line" style={{ marginTop: 12 }}>
              <span className="muted">{RULE[n.rule_triggered] || n.rule_triggered}</span>
              <span className="num">{tanggalPanjang(n.predicted_restock_date)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
