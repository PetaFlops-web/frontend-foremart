import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout, ProtectedRoute } from './components/Layout'
import Masuk from './pages/Masuk'
import Daftar from './pages/Daftar'
import Toko from './pages/Toko'
import HariIni from './pages/HariIni'
import Produk from './pages/Produk'
import Riwayat from './pages/Riwayat'
import Prakiraan from './pages/Prakiraan'
import Pelanggan from './pages/Pelanggan'
import Prediksi from './pages/Prediksi'
import Notifikasi from './pages/Notifikasi'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/masuk" element={<Masuk />} />
          <Route path="/daftar" element={<Daftar />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/toko" element={<Toko />} />
            <Route element={<Layout />}>
              <Route index element={<HariIni />} />
              <Route path="/catat" element={<Catat />} />
              <Route path="/produk" element={<Produk />} />
              <Route path="/riwayat" element={<Riwayat />} />
              <Route path="/prakiraan" element={<Prakiraan />} />
              <Route path="/pelanggan" element={<Pelanggan />} />
              <Route path="/prediksi" element={<Prediksi />} />
              <Route path="/notifikasi" element={<Notifikasi />} />
            </Route>
          </Route>

          <Route path="*" element={<Masuk />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
