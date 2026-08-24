# Nota — Frontend

Frontend React (Vite) untuk aplikasi catatan warung. Dibangun langsung dari
kode backend (`backend-shop-smbk`, Go/Fiber) dan ML service
(`ML-shop-smbk`, FastAPI) yang di-upload — bukan dari asumsi/dokumentasi
saja — supaya kontrak API-nya benar-benar cocok.

## Prasyarat

- **Node.js** versi 18 atau lebih baru
- **npm** versi 9 atau lebih baru
- Backend Go sudah berjalan di `http://127.0.0.1:8080`

## Cara Menjalankan

### 1. Pastikan Backend Berjalan

Jalankan backend Go terlebih dahulu (lihat README backend):
```bash
docker compose up --build -d
```

Backend inilah yang memanggil ML service, frontend ini **tidak pernah** 
bicara langsung ke ML service.

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment (Opsional)

Buat file `.env` di root folder jika backend-mu berjalan di alamat selain default:

```env
VITE_BACKEND_URL=http://127.0.0.1:8080
```

Jika tidak dibuat, Vite akan menggunakan default `http://127.0.0.1:8080`.

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka `http://localhost:5173` di browser.

Vite akan otomatis mem-proxy semua request `/api/*` ke backend 
(`VITE_BACKEND_URL` atau `127.0.0.1:8080`).

### 5. Build untuk Production

```bash
npm run build
```

Hasil build akan ada di folder `dist/`. Untuk preview:

```bash
npm run preview
```

## Keputusan Penting yang Diambil Berdasarkan Kode Backend

### Tidak Ada Fitur Catat-via-Suara
`POST /transactions/extract/voice` memang ada modelnya di kode, tapi 
route-nya di-comment di `internal/modules/transaction/route.go`. Fitur 
ini belum aktif, jadi halaman Catat di sini cuma menyediakan pencatatan 
manual (cari produk → atur qty/harga → simpan), supaya tidak ada tombol 
yang kelihatan jalan tapi sebenarnya selalu gagal.

### Prakiraan Restock Lewat Backend, Bukan ML Langsung
Backend menyediakan `POST /restock-predictions/_generate` yang di baliknya 
mengambil histori transaksi lalu memanggil ML service sendiri, dan 
`GET /restock-predictions` untuk melihat hasil yang tersimpan. Frontend 
cukup panggil dua endpoint itu.

### Store Diakses Lewat `/stores/:id`
Bukan `/stores` tanpa id (dokumen `docs/swagger.yaml` di repo backend 
sempat menuliskannya tanpa id, tapi kode controller & usecase-nya konsisten 
pakai `:id`, jadi frontend ini mengikuti kode, bukan dokumen). Karena tidak 
ada endpoint "daftar toko milik saya", id toko disimpan di `localStorage` 
setelah dibuat.

### `context/AppContext.jsx` Ditulis dari Nol
File ini (login/register/logout, load user & store saat refresh) ditulis 
dari nol — tidak pernah ada di upload sebelumnya meski dipakai di mana-mana 
lewat `useApp()`.

## Struktur Proyek

```
src/
├── main.jsx                  Entry point aplikasi
├── App.jsx                   Routing utama
├── context/
│   └── AppContext.jsx        Auth + store state management
├── components/
│   └── Layout.jsx            Shell + bottom tab bar + route guard
├── lib/
│   ├── api.js                Satu pintu ke backend (axios instance)
│   └── format.js             Helper: rupiah, tanggal, angka
├── styles/
│   ├── tokens.css            Design tokens (warna, spacing, dll)
│   └── global.css            Global styles
└── pages/
    ├── Masuk.jsx             Login
    ├── Daftar.jsx            Register
    ├── Toko.jsx              Setup/hubungkan toko
    ├── HariIni.jsx           Laporan harian
    ├── Catat.jsx             Catat transaksi (manual)
    ├── Produk.jsx            CRUD produk
    ├── Riwayat.jsx           Riwayat transaksi
    └── Prakiraan.jsx         Restock predictions (via backend)
```

## Troubleshooting

### Backend tidak reachable
- Pastikan backend Go sudah berjalan: `docker ps` harus menunjukkan container backend
- Cek `VITE_BACKEND_URL` di file `.env` jika menggunakan alamat custom
- Pastikan port 8080 tidak diblokir firewall

### CORS error di browser
- Ini tidak seharusnya terjadi karena Vite proxy semua request `/api/*`
- Jika tetap muncul, pastikan kamu mengakses via `localhost:5173`, bukan langsung ke backend

### Port 5173 sudah dipakai
Vite akan otomatis mencari port lain (5174, 5175, dst). Perhatikan output terminal untuk tahu port yang dipakai.

## Scripts yang Tersedia

```bash
npm run dev      # Jalankan development server (hot reload)
npm run build    # Build untuk production
npm run preview  # Preview hasil build production
npm run lint     # Jalankan ESLint (jika dikonfigurasi)
```
