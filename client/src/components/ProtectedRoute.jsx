import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-card--compact">
          <p className="eyebrow">Restoring session</p>
          <h1>Checking your access</h1>
          <p className="auth-support-copy">
            Verifying your candidate session before loading the dashboard.
          </p>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return children
}

export default ProtectedRoute
