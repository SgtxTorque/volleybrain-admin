import { Navigate } from 'react-router-dom'

/**
 * RouteGuard -- wraps routes that should only be accessible to certain roles.
 * If the user's activeView doesn't match any of the allowed roles,
 * they get redirected to /dashboard.
 *
 * Usage:
 *   <RouteGuard allow={['admin']} activeView={activeView}>
 *     <SettingsPage />
 *   </RouteGuard>
 *
 *   <RouteGuard allow={['admin', 'coach']} activeView={activeView}>
 *     <GamePrepPage />
 *   </RouteGuard>
 */
export default function RouteGuard({ allow, activeView, children }) {
  if (!allow || allow.length === 0) return children
  if (allow.includes(activeView)) return children
  return <Navigate to="/dashboard" replace />
}
