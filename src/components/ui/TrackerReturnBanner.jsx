// =============================================================================
// TrackerReturnBanner — "Back to Setup" breadcrumb banner
// Shows when navigated from the Lifecycle Tracker (from=tracker query param).
// Additive only — invisible when not from tracker.
// =============================================================================

import { useSearchParams, useNavigate } from 'react-router-dom'

export default function TrackerReturnBanner() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const fromTracker = searchParams.get('from') === 'tracker'
  const returnTo = searchParams.get('returnTo')
  const seasonName = searchParams.get('season')
  const stepNum = searchParams.get('step')
  const totalSteps = searchParams.get('total')

  if (!fromTracker) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#e8f6fd] border-b border-[#b8e2f8] mb-4 rounded-xl">
      <span className="text-lg">🐾</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[#10284C]">
          Setting up {seasonName || 'your season'}
          {stepNum && totalSteps ? ` — Step ${stepNum} of ${totalSteps}` : ''}
        </span>
      </div>
      <button
        onClick={() => returnTo ? navigate(returnTo) : navigate(-1)}
        className="text-sm font-semibold text-[#4BB9EC] hover:text-[#2a9dd4] transition-colors whitespace-nowrap"
      >
        &larr; Back to Setup
      </button>
    </div>
  )
}
