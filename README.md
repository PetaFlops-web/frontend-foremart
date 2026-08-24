# Nota — Frontend

Aplikasi web React (Vite) untuk mencatat penjualan, mengelola stok, dan
melihat prakiraan restock warung. Frontend ini berkomunikasi dengan backend
Go/Fiber melalui path `/api` dan **tidak pernah** memanggil ML service
secara langsung.

## Fitur

- **Autentikasi** — Login dan registrasi akun warung
- **Manajemen Toko** — Buat dan hubungkan toko ke akun
- **Laporan Harian** — Ringkasan penjualan hari ini
- **Catat Transaksi** — Pencatatan penjualan manual (cari produk → atur qty/harga → simpan)
- **Manajemen Produk** — Tambah, edit, hapus produk
- **Riwayat Transaksi** — Lihat semua transaksi yang pernah dicatat
- **Prakiraan Restock** — Prediksi produk yang perlu distok ulang (dihasilkan backend via ML)
- **Manajemen Pelanggan** — Kelola data pelanggan
- **Notifikasi** — Pemberitahuan dan alert

## Prasyarat

- **Node.js** versi 18+
- **npm** versi 9+
- Backend Go sudah berjalan di `http://127.0.0.1:8080`

## Cara Menjalankan

### Development (Vite Dev Server)

1. **Pastikan backend sudah berjalan** (lihat README backend):
   ```bash
   docker compose up --build -d   # dari folder backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Konfigurasi environment (opsional):**

   Buat file `.env` jika backend berjalan di alamat selain default:
   ```env
   VITE_BACKEND_URL=http://127.0.0.1:8080
   ```

4. **Jalankan dev server:**
   ```bash
   npm run dev
   ```

   Buka `http://localhost:5173`. Vite otomatis mem-proxy semua request
   `/api/*` ke backend.

### Production (Docker Compose)

1. **Build dan jalankan container:**
   ```bash
   docker compose up --build -d
   ```

   Container akan build React app (multi-stage: Node → Nginx), lalu serve
   di port `3080`.

2. **Akses aplikasi:**
   ```
   http://localhost:3080
   ```

3. **Konfigurasi backend URL** — edit `BACKEND_URL` di `docker-compose.yml`:
   ```yaml
   environment:
     BACKEND_URL: "http://host.docker.internal:8080"
   ```

4. **Matikan container:**
   ```bash
   docker compose down
   ```

### Build Manual (tanpa Docker)

```bash
npm run build      # hasil build di folder dist/
npm run preview    # preview hasil build di browser
```

## Struktur Proyek

```
src/
├── main.jsx                  Entry point (mount React ke DOM)
├── App.jsx                   Routing & layout utama
├── context/
│   └── AppContext.jsx        Global state: auth, user, toko (via useApp())
├── components/
│   └── Layout.jsx            Shell app: bottom tab bar + route guard
├── lib/
│   ├── api.js                HTTP client ke backend (fetch /api/*)
│   └── format.js             Helper: format rupiah, tanggal, angka
├── styles/
│   ├── tokens.css            Design tokens (warna, spacing, typography)
│   └── app.css               Global styles
└── pages/
    ├── Masuk.jsx             Halaman login
    ├── Daftar.jsx            Halaman registrasi
    ├── Toko.jsx              Setup & hubungkan toko
    ├── HariIni.jsx           Dashboard laporan harian
    ├── Catat.jsx             Catat transaksi penjualan
    ├── Produk.jsx            CRUD produk
    ├── Riwayat.jsx           Riwayat transaksi
    ├── Prakiraan.jsx         Prediksi restock
    ├── Pelanggan.jsx         Manajemen pelanggan
    ├── Prediksi.jsx          Halaman prediksi
    └── Notifikasi.jsx        Halaman notifikasi
```

## Scripts

| Script           | Fungsi                              |
|------------------|-------------------------------------|
| `npm run dev`    | Dev server dengan hot reload        |
| `npm run build`  | Build production ke folder `dist/`  |
| `npm run preview`| Preview hasil build production      |

## Teknologi

- **React 18** — UI library
- **React Router 6** — Client-side routing
- **Vite 5** — Build tool & dev server
- **Nginx** (Docker) — Static file server + reverse proxy untuk production

## Troubleshooting

**Backend tidak reachable**
Pastikan backend Go sudah berjalan (`docker ps`) dan port 8080 tidak diblokir.
Cek `VITE_BACKEND_URL` di `.env` jika menggunakan alamat custom.

**CORS error di browser**
Pastikan mengakses via `localhost:5173` (dev) atau `localhost:3080` (Docker),
bukan langsung ke alamat backend. Proxy menangani CORS secara transparan.

**Port 5173 sudah dipakai**
Vite otomatis mencari port berikutnya (5174, 5175, dst). Perhatikan output
terminal untuk tahu port yang dipakai.

**Container nginx gagal start (Docker)**
Pastikan port 3080 belum dipakai proses lain. Cek logs dengan
`docker compose logs frontend`.
