import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend Go (Fiber) selalu di /api. Frontend TIDAK PERNAH memanggil ML
// service secara langsung — semua prediksi restock lewat backend
// (POST /api/restock-predictions/_generate), backend yang bicara ke ML.
// Lihat README.md di project ini untuk detail kenapa.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
