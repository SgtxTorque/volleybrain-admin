import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ShieldAlert } from 'lucide-react'

/**
 * RouteGuard -- wraps routes that should only be accessible to certain roles.
 * If the user's activeView doesn't match any of the allowed roles,
 * they see an "Access Restricted" page with a button to go to Dashboard.
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
  return <AccessRestricted />
}

function AccessRestricted() {
  const { isDark } = useTheme()
  const navigate = useNavigate()

  return (
    <div className={`flex items-center justify-center ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`} style={{ minHeight: '60vh' }}>
      <div className="text-center px-6 max-w-md">
        <div className={`w-20 h-20 rounded-xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
          <ShieldAlert className={`w-10 h-10 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Access Restricted</h2>
        <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          You don't have permission to view this page. This page is only available to administrators.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-xl text-sm font-bold bg-lynx-sky text-white hover:brightness-110 transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
