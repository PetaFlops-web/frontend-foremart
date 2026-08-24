# Nota — Frontend

Frontend React (Vite) untuk aplikasi catatan warung. Dibangun langsung dari
kode backend (`backend-shop-smbk`, Go/Fiber) dan ML service
(`ML-shop-smbk`, FastAPI) yang di-upload — bukan dari asumsi/dokumentasi
saja — supaya kontrak API-nya benar-benar cocok.

## Cara jalanin

1. Jalankan backend Go di `http://127.0.0.1:8080` (lihat README backend:
   `docker compose up --build -d`). Backend inilah yang memanggil ML service,
   frontend ini tidak pernah bicara langsung ke ML.
2. Di folder ini:
   ```bash
   npm install
   npm run dev
   ```
3. Buka `http://localhost:5173`. Vite men-proxy `/api` ke `127.0.0.1:8080`
   (atur lewat env `VITE_BACKEND_URL` kalau backend-mu di alamat lain).

## Keputusan penting yang diambil berdasarkan kode backend

- **Tidak ada fitur catat-via-suara.** `POST /transactions/extract/voice`
  memang ada modelnya di kode, tapi route-nya di-comment di
  `internal/modules/transaction/route.go`. Fitur ini belum aktif, jadi
  halaman Catat di sini cuma menyediakan pencatatan manual (cari produk →
  atur qty/harga → simpan), supaya tidak ada tombol yang kelihatan jalan
  tapi sebenarnya selalu gagal.
- **Prakiraan restock lewat backend, bukan ML langsung.** Backend
  menyediakan `POST /restock-predictions/_generate` yang di baliknya
  mengambil histori transaksi lalu memanggil ML service sendiri, dan
  `GET /restock-predictions` untuk melihat hasil yang tersimpan. Frontend
  cukup panggil dua endpoint itu.
- **Store diakses lewat `/stores/:id`**, bukan `/stores` tanpa id (dokumen
  `docs/swagger.yaml` di repo backend sempat menuliskannya tanpa id, tapi
  kode controller & usecase-nya konsisten pakai `:id`, jadi frontend ini
  mengikuti kode, bukan dokumen). Karena tidak ada endpoint "daftar toko
  milik saya", id toko disimpan di `localStorage` setelah dibuat.
- **`context/AppContext.jsx`** (login/register/logout, load user & store
  saat refresh) ditulis dari nol — file ini tidak pernah ada di upload
  sebelumnya meski dipakai di mana-mana lewat `useApp()`.

## Struktur

```
src/
  main.jsx              entry point
  App.jsx                routing
  context/AppContext.jsx auth + store state
  components/Layout.jsx  shell + bottom tab bar + route guard
  lib/api.js              satu pintu ke backend
  lib/format.js           rupiah, tanggal, angka
  styles/                 design tokens + global css
  pages/
    Masuk.jsx, Daftar.jsx     auth
    Toko.jsx                  setup/hubungkan toko
    HariIni.jsx               laporan harian
    Catat.jsx                 catat transaksi (manual)
    Produk.jsx                CRUD produk
    Riwayat.jsx                riwayat transaksi
    Prakiraan.jsx               restock (via backend)
```
