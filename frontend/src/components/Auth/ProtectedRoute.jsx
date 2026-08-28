import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation()
  const { session, profile, isLoading, error, signOut, refreshProfile } = useAuth()

  if (isLoading) {
    return <div className="route-state"><span className="route-state__loader" />Memeriksa sesi...</div>
  }
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (error || !profile) {
    return (
      <div className="route-state">
        <h1>Profil tidak dapat dimuat</h1>
        <p>{error || 'Profil akun belum tersedia di sistem sekolah.'}</p>
        <div className="route-state__actions">
          <button type="button" onClick={() => refreshProfile().catch(() => undefined)}>Coba lagi</button>
          <button type="button" onClick={signOut}>Keluar</button>
        </div>
      </div>
    )
  }
  if (allowedRoles && !allowedRoles.includes(profile.role)) return <Navigate to="/" replace />
  return children
}
