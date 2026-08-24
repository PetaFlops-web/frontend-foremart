import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const TABS = [
  { to: '/', label: 'Hari ini', icon: '▤', end: true },
  { to: '/catat', label: 'Catat', icon: '⏺' },
  { to: '/produk', label: 'Produk', icon: '☰' },
  { to: '/riwayat', label: 'Riwayat', icon: '↺' },
  { to: '/pelanggan', label: 'Pelanggan', icon: '☎' },
  { to: '/prediksi', label: 'Prediksi', icon: '↗' },
]

export function ProtectedRoute() {
  const { user, booting, store } = useApp()
  const location = useLocation()

  if (booting) {
    return (
      <div className="shell">
        <div className="topbar" />
        <div className="stack">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/masuk" replace state={{ from: location.pathname }} />
  if (!store && location.pathname !== '/toko') return <Navigate to="/toko" replace />

  return <Outlet />
}

export function Layout() {
  const { store, user, signOut } = useApp()

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="topbar__meta">Warung</div>
          <div className="topbar__store">{store?.store_name || 'Belum ada toko'}</div>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={signOut}>
          Keluar{user?.username ? ` · ${user.username}` : ''}
        </button>
      </header>

      <main>
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Navigasi utama">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
            <span className="tabbar__icon" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
