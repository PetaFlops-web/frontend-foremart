import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi, storeApi, storeIdStore, tokenStore } from '../lib/api'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp harus dipakai di dalam <AppProvider>')
  return ctx
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [store, setStore] = useState(null)
  const [booting, setBooting] = useState(true)

  // Coba muat store yang tersimpan di localStorage. Kalau gagal (id basi,
  // atau store itu bukan/tidak lagi milik user ini), diam-diam anggap belum
  // ada store — ProtectedRoute akan mengarahkan ke /toko.
  const loadStore = useCallback(async () => {
    const storedId = storeIdStore.get()
    if (!storedId) {
      setStore(null)
      return
    }
    try {
      const res = await storeApi.get(storedId)
      setStore(res.data)
    } catch {
      storeIdStore.clear()
      setStore(null)
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function boot() {
      const token = tokenStore.get()
      if (!token) {
        if (alive) setBooting(false)
        return
      }
      try {
        const res = await authApi.current()
        if (!alive) return
        setUser(res.data)
        await loadStore()
      } catch {
        tokenStore.clear()
        storeIdStore.clear()
        if (alive) {
          setUser(null)
          setStore(null)
        }
      } finally {
        if (alive) setBooting(false)
      }
    }
    boot()
    return () => {
      alive = false
    }
  }, [loadStore])

  // Kalau ada request lain yang kena 401 di tengah sesi (token kedaluwarsa,
  // 72 jam per JWT backend), lib/api.js menembak event ini — kita ikut
  // membersihkan state di sini.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
      setStore(null)
    }
    window.addEventListener('smbk:unauthorized', onUnauthorized)
    return () => window.removeEventListener('smbk:unauthorized', onUnauthorized)
  }, [])

  const signIn = useCallback(
    async ({ username, password }) => {
      const res = await authApi.login({ username, password })
      tokenStore.set(res.data.token)
      setUser(res.data.user)
      await loadStore()
      return res.data
    },
    [loadStore],
  )

  const signUp = useCallback(async ({ username, email, password }) => {
    const res = await authApi.register({ username, email, password })
    tokenStore.set(res.data.token)
    setUser(res.data.user)
    setStore(null)
    return res.data
  }, [])

  const signOut = useCallback(() => {
    tokenStore.clear()
    storeIdStore.clear()
    setUser(null)
    setStore(null)
  }, [])

  const saveStore = useCallback((storeData) => {
    storeIdStore.set(storeData.id)
    setStore(storeData)
  }, [])

  const value = { user, store, booting, signIn, signUp, signOut, saveStore }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
