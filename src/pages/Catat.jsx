import { useEffect, useMemo, useState } from 'react'
import { productApi, transactionApi, customerApi } from '../lib/api'
import { useApp } from '../context/AppContext'
import { rupiah } from '../lib/format'

/**
 * Catatan: backend punya rancangan untuk pencatatan lewat suara
 * (POST /transactions/extract/voice), tapi route-nya sengaja di-nonaktifkan
 * di transaction/route.go ("Voice extraction (Preview)" — di-comment).
 * Jadi halaman ini cuma menyediakan pencatatan manual, supaya tidak ada
 * tombol yang keliatan berfungsi tapi sebenarnya cuma akan gagal terus.
 */
export default function Catat() {
  const { store } = useApp()
  const [produk, setProduk] = useState([])
  const [pelanggan, setPelanggan] = useState([])
  const [cariProduk, setCariProduk] = useState('')
  const [customerId, setCustomerId] = useState('') // Default empty = no customer
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [saved, setSaved] = useState(null)
  const [loadingProduk, setLoadingProduk] = useState(true)

  useEffect(() => {
    let alive = true
    
    // Load products
    productApi
      .list({ store_id: store.id, size: 100 })
      .then((res) => {
        if (!alive) return
        setProduk(res.data || [])
      })
      .catch((err) => alive && setError(err.message))
    
    // Load customers (optional - user can choose 'no customer')
    customerApi
      .list({ store_id: store.id, page: 1, size: 100 })
      .then((res) => {
        if (!alive) return
        setPelanggan(res.data || [])
      })
      .catch((err) => alive && console.warn('Failed to load customers:', err))
      .finally(() => alive && setLoadingProducts(false))
    
    return () => {
      alive = false
    }
  }, [store.id])

  const hasilCari = useMemo(() => {
    const q = cariProduk.trim().toLowerCase()
    const belumDipakai = produk.filter((p) => !items.some((it) => it.product_id === p.id))
    if (!q) return belumDipakai.slice(0, 8)
    return belumDipakai.filter((p) => p.product_name.toLowerCase().includes(q)).slice(0, 8)
  }, [produk, cariProduk, items])

  const tambahItem = (p) => {
    setSaved(null)
    setItems((prev) => [...prev, { key: p.id, product_id: p.id, nama: p.product_name, qty: 1, harga: p.selling_price, stok: p.stock, unit: p.unit }])
    setCariProduk('')
  }

  const ubahItem = (key, patch) => setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  const hapusItem = (key) => setItems((prev) => prev.filter((it) => it.key !== key))

  const siap = items.filter((it) => it.product_id && it.qty > 0)
  const total = siap.reduce((sum, it) => sum + it.qty * it.harga, 0)
  const adaMelebihiStok = items.some((it) => typeof it.stok === 'number' && it.qty > it.stok)

  const simpan = async () => {
    setError('')
    setStatus('Menyimpan transaksi…')
    try {
      // customer_id is optional - send null/empty if not selected
      const request = {
        store_id: store.id,
        source: 'manual',
        customer_id: customerId ? Number(customerId) : null, // Send null if no customer selected
        items: siap.map((it) => ({ 
          product_id: it.product_id, 
          qty: Number(it.qty), 
          selling_price_final: Number(it.harga) 
        })),
      }
      
      const res = await transactionApi.create(request)
      setSaved(res.data)
      setItems([])
      setStatus('')
      // Refresh stok lokal biar angka di pencarian produk berikutnya akurat.
      productApi.list({ store_id: store.id, size: 100 }).then((r) => setProduk(r.data || []))
    } catch (err) {
      setStatus('')
      setError(err.message)
    }
  }

  return (
    <>
      <h1 className="page-title">Catat penjualan</h1>
      <p className="page-lede">Cari produk yang terjual, atur jumlahnya, lalu simpan.</p>

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
      {saved && (
        <div className="alert alert--info" role="status" style={{ marginBottom: 16 }}>
          Transaksi tersimpan. Nomor nota <span className="num">{saved.id.slice(0, 8)}</span>, stok sudah dikurangi.
        </div>
      )}

      {!loadingProduk && !produk.length && (
        <div className="empty">Belum ada produk. Tambahkan produk dulu di tab Produk sebelum mencatat penjualan.</div>
      )}

      {(produk.length > 0 || loadingProduk) && (
        <>
          {/* Customer Selection */}
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pelanggan-catat">Pelanggan (opsional)</label>
            <select 
              id="pelanggan-catat" 
              value={customerId} 
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={loadingProduk}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-line)' }}
            >
              <option value="">— Tidak ada pelanggan —</option>
              {pelanggan.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || 'Tanpa nama'} ({p.phone})
                </option>
              ))}
            </select>
            <p className="field__hint" style={{ marginTop: 4, marginBottom: 12 }}>
              Pilih pelanggan dari daftar, atau biarkan kosong jika transaksi untuk pembeli umum.
            </p>
          </div>

          <div className="field">
            <label htmlFor="cari-produk">Cari produk</label>
            <input
              id="cari-produk"
              value={cariProduk}
              onChange={(e) => setCariProduk(e.target.value)}
              placeholder="beras, minyak, gula…"
              disabled={loadingProduk}
            />
          </div>

          {cariProduk && hasilCari.length > 0 && (
            <div className="card" style={{ marginTop: 8, padding: 8 }}>
              {hasilCari.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="btn btn--ghost btn--block"
                  style={{ justifyContent: 'space-between', marginBottom: 4 }}
                  onClick={() => tambahItem(p)}
                >
                  <span>{p.product_name}</span>
                  <span className="num muted">{rupiah(p.selling_price)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {items.length > 0 && (
        <>
          <div className="nota" style={{ marginTop: 20 }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Periksa dulu sebelum disimpan</p>
            {items.map((it) => (
              <div key={it.key} style={{ padding: '12px 0', borderBottom: '1px dashed var(--color-line)' }}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <strong>{it.nama}</strong>
                  <button className="btn btn--sm btn--danger" onClick={() => hapusItem(it.key)}>
                    Hapus
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
                  <div>
                    <label htmlFor={`q-${it.key}`}>Jumlah ({it.unit})</label>
                    <input
                      id={`q-${it.key}`}
                      type="number"
                      min="1"
                      value={it.qty}
                      onChange={(e) => ubahItem(it.key, { qty: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label htmlFor={`h-${it.key}`}>Harga satuan</label>
                    <input
                      id={`h-${it.key}`}
                      type="number"
                      min="0"
                      value={it.harga}
                      onChange={(e) => ubahItem(it.key, { harga: Number(e.target.value) })}
                    />
                  </div>
                </div>
                {typeof it.stok === 'number' && it.qty > it.stok && (
                  <p className="field__hint" style={{ color: 'var(--color-danger)' }}>
                    Jumlah melebihi stok ({it.stok} {it.unit}).
                  </p>
                )}
              </div>
            ))}

            <div className="nota__total">
              <span className="eyebrow">Total</span>
              <span className="amount">{rupiah(total)}</span>
            </div>
          </div>
          <div className="nota__tear" aria-hidden="true" />

          <button
            className="btn btn--brand btn--block"
            style={{ marginTop: 20 }}
            onClick={simpan}
            disabled={!siap.length || Boolean(status) || adaMelebihiStok}
          >
            Simpan transaksi
          </button>
          {adaMelebihiStok && (
            <p className="field__hint" style={{ textAlign: 'center', color: 'var(--color-danger)' }}>
              Kurangi jumlah dulu — ada barang yang melebihi stok.
            </p>
          )}
        </>
      )}

      {!items.length && !status && produk.length > 0 && (
        <div className="empty" style={{ marginTop: 16 }}>
          Belum ada barang. Cari produk di atas untuk mulai mencatat.
        </div>
      )}
    </>
  )
}
