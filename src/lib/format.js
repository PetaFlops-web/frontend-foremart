export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0)

export const angka = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0)

export const tanggalHariIni = () => {
  const d = new Date()
  const p = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const tanggalBesok = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const p = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const tanggalPanjang = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export const waktuSingkat = (unixSeconds) => {
  if (!unixSeconds) return ''
  const ms = unixSeconds > 1e12 ? unixSeconds : unixSeconds * 1000
  return new Date(ms).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Backend restock butuh forecast_date sebagai *time.Time Go (JSON RFC3339),
// bukan cuma "YYYY-MM-DD" — jadi input <input type="date"> harus dikonversi
// sebelum dikirim, kalau tidak Go gagal parse dan balas 400.
export const keRFC3339 = (isoDate) => (isoDate ? `${isoDate}T00:00:00Z` : undefined)

export const persen = (v) => `${Math.round((Number(v) || 0) * 100)}%`
