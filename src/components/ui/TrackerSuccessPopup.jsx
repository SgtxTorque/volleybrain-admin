// =============================================================================
// TrackerSuccessPopup — "Back to Season Setup" popup after entity creation
// Only shows when from=tracker URL param is present. Invisible otherwise.
// =============================================================================

import { useSearchParams, useNavigate } from 'react-router-dom'

export default function TrackerSuccessPopup({
  show = false,
  onDismiss,
  emoji = '🏐',
  title = 'Done!',
  subtitle = '',
  stayLabel = 'Stay Here',
}) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const fromTracker = searchParams.get('from') === 'tracker'
  const returnTo = searchParams.get('returnTo')

  if (!show || !fromTracker) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-[14px] p-6 max-w-sm mx-4 shadow-2xl text-center">
        <div className="text-4xl mb-3">{emoji}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mb-5">{subtitle}</p>}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => returnTo ? navigate(returnTo) : navigate(-1)}
            className="w-full px-4 py-3 bg-[#4BB9EC] text-white font-semibold rounded-[14px] hover:bg-[#3aa8db] transition-colors"
          >
            &larr; Back to Season Setup
          </button>
          <button
            onClick={onDismiss}
            className="w-full px-4 py-3 bg-gray-100 text-gray-600 font-semibold rounded-[14px] hover:bg-gray-200 transition-colors"
          >
            {stayLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
