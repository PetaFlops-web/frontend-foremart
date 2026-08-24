/**
 * Satu pintu untuk semua panggilan ke backend Go (Fiber), base path /api.
 *
 * Backend selalu membalas amplop yang sama:
 *   { data, message, success, paging? }
 * dan saat error (lewat NewErrorHandler):
 *   { message, statusCode }
 * KECUALI saat token hilang/invalid — itu ditangani oleh AuthMiddleware
 * sebelum sampai ke error handler, dan bentuknya beda: { errors: "Unauthorized" }.
 * Fungsi request() di bawah menangani kedua bentuk itu.
 *
 * CATATAN PENTING soal cakupan API:
 * - Frontend TIDAK PERNAH memanggil ML service langsung. Prediksi restock
 *   selalu lewat backend (POST /restock-predictions/_generate) yang di
 *   baliknya mengambil histori transaksi lalu memanggil ML service sendiri.
 * - Endpoint pencatatan transaksi via suara (POST /transactions/extract/voice)
 *   ADA di kode tapi route-nya di-comment di transaction/route.go — artinya
 *   fitur ini belum aktif di backend. Frontend ini sengaja tidak menyediakan
 *   UI untuk itu supaya tidak menjanjikan sesuatu yang akan gagal terus.
 */

const BASE = import.meta.env.VITE_API_BASE || '/api'
const TOKEN_KEY = 'smbk.token'
const STORE_KEY = 'smbk.store_id'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const storeIdStore = {
  get: () => localStorage.getItem(STORE_KEY),
  set: (id) => localStorage.setItem(STORE_KEY, id),
  clear: () => localStorage.removeItem(STORE_KEY),
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function qs(params) {
  if (!params) return ''
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return clean.length ? `?${new URLSearchParams(clean)}` : ''
}

async function request(path, { method = 'GET', body, params } = {}) {
  const headers = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${BASE}${path}${qs(params)}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Tidak bisa menghubungi server. Pastikan backend jalan di port 8080.', 0)
  }

  const text = await res.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (res.status === 401) {
    tokenStore.clear()
    storeIdStore.clear()
    window.dispatchEvent(new CustomEvent('smbk:unauthorized'))
    throw new ApiError('Sesi habis. Masuk lagi untuk melanjutkan.', 401)
  }

  if (!res.ok) {
    const msg = payload?.message || (typeof payload?.errors === 'string' ? payload.errors : null) || `Permintaan gagal (${res.status})`
    throw new ApiError(msg, res.status)
  }

  return payload
}

/* ---------------- Auth ---------------- */
// Register & login SELALU mengembalikan { token, user } sekaligus — tidak
// perlu login terpisah setelah daftar.
export const authApi = {
  register: (body) => request('/users', { method: 'POST', body }),
  login: (body) => request('/users/_login', { method: 'POST', body }),
  current: () => request('/users/_current'),
}

/* ---------------- Store ---------------- */
// Satu user cuma boleh punya satu store (backend menolak store kedua dengan
// 409). Tidak ada endpoint "list store milik saya", jadi store_id yang
// didapat dari Create() disimpan di localStorage lalu dipakai untuk GET/PUT
// /stores/:id (backend memverifikasi id itu memang milik user yang login).
export const storeApi = {
  create: (body) => request('/stores', { method: 'POST', body }),
  get: (id) => request(`/stores/${id}`),
  update: (id, body) => request(`/stores/${id}`, { method: 'PUT', body }),
}

/* ---------------- Product ---------------- */
export const productApi = {
  list: (params) => request('/products', { params }),
  get: (id, storeId) => request(`/products/${id}`, { params: { store_id: storeId } }),
  create: (body) => request('/products', { method: 'POST', body }),
  update: (id, body) => request(`/products/${id}`, { method: 'PUT', body }),
  remove: (id, storeId) => request(`/products/${id}`, { method: 'DELETE', params: { store_id: storeId } }),
}

/* ---------------- Transaction ---------------- */
// source dikirim tetap 'manual' — lihat catatan soal voice di atas.
export const transactionApi = {
  list: (params) => request('/transactions', { params }),
  get: (id, storeId) => request(`/transactions/${id}`, { params: { store_id: storeId } }),
  create: (body) => request('/transactions', { method: 'POST', body: { ...body, source: 'manual' } }),
  remove: (id, storeId) => request(`/transactions/${id}`, { method: 'DELETE', params: { store_id: storeId } }),
}

/* ---------------- Report ---------------- */
export const reportApi = {
  daily: (storeId, date) => request('/reports/daily', { params: { store_id: storeId, date } }),
}

/* ---------------- Restock prediction (backend -> ML, bukan FE -> ML) ---------------- */
export const restockApi = {
  list: (storeId) => request('/restock-predictions', { params: { store_id: storeId } }),
  generate: (body) => request('/restock-predictions/_generate', { method: 'POST', body }),
}

/* ---------------- Customer (pelanggan) ---------------- */
// Pencarian pakai query string: store_id & page & size wajib, search opsional.
// Phone wajib (E.164, awalan 62 tanpa +/0). Name boleh kosong.
export const customerApi = {
  list: (params) => request('/customers', { params }),
  get: (id) => request(`/customers/${id}`),
  create: (body) => request('/customers', { method: 'POST', body }),
}

/* ---------------- Survival prediction (pembelian ulang) ---------------- */
// Backend menghitung fitur survival dari riwayat pembelian customer terhadap
// satu produk lalu memanggil ML (/predict-survival). FE hanya kirim ketiga id.
// Jika customer belum pernah beli produk itu, backend balas 404.
export const survivalApi = {
  predict: (body) => request('/predict-survival', { method: 'POST', body }),
}

/* ---------------- Notifikasi pembelian ulang (WhatsApp via Fonnte) ---------------- */
// _send memicu pengiriman manual (alur sama persis dengan cron harian backend).
// list mengambil log notifikasi tersimpan untuk toko ini.
export const notificationApi = {
  list: (storeId) => request('/notifications', { params: { store_id: storeId } }),
  send: () => request('/notifications/_send', { method: 'POST' }),
}
