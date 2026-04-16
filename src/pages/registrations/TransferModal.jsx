import { useEffect, useState, useMemo } from 'react'
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { transferRegistration } from '../../lib/registration-transfer'
import { useTheme } from '../../contexts/ThemeContext'

export default function TransferModal({
  isOpen,
  onClose,
  player,
  registration,
  organizationId,
  onTransferComplete,
  showToast,
}) {
  const { isDark } = useTheme()
  const [seasons, setSeasons] = useState([])
  const [seasonsLoading, setSeasonsLoading] = useState(false)
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [keepCustomFees, setKeepCustomFees] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !organizationId || !registration?.season_id) return
    let cancelled = false
    async function load() {
      setSeasonsLoading(true)
      const { data } = await supabase
        .from('seasons')
        .select('id, name, program_id, start_date, end_date, status, programs(name)')
        .eq('organization_id', organizationId)
        .neq('id', registration.season_id)
        .in('status', ['active', 'upcoming'])
        .order('start_date', { ascending: false })
      if (!cancelled) {
        setSeasons(data || [])
        setSeasonsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isOpen, organizationId, registration?.season_id])

  // Reset state when modal closes/reopens
  useEffect(() => {
    if (isOpen) {
      setSelectedSeasonId('')
      setKeepCustomFees(true)
      setError(null)
    }
  }, [isOpen])

  const groupedSeasons = useMemo(() => {
    const groups = {}
    for (const s of seasons) {
      const groupName = s.programs?.name || 'Other'
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(s)
    }
    return groups
  }, [seasons])

  async function handleTransfer() {
    if (!selectedSeasonId) return
    setLoading(true)
    setError(null)
    const result = await transferRegistration({
      registrationId: registration.id,
      playerId: player.id,
      oldSeasonId: registration.season_id,
      newSeasonId: selectedSeasonId,
      organizationId,
      keepCustomFees,
    })
    if (result.success) {
      showToast?.(`Transferred to ${result.details.newSeasonName}`, 'success')
      onTransferComplete?.()
      onClose()
    } else {
      setError(result.error || 'Transfer failed')
    }
    setLoading(false)
  }

  function formatDateRange(start, end) {
    const opts = { month: 'short', day: 'numeric' }
    const s = start ? new Date(start + 'T00:00:00').toLocaleDateString('en-US', opts) : ''
    const e = end ? new Date(end + 'T00:00:00').toLocaleDateString('en-US', opts) : ''
    if (s && e) return `${s} – ${e}`
    return s || e || ''
  }

  if (!isOpen) return null

  const currentSeasonName = registration?.seasons?.name || registration?.season?.name || 'current season'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-[14px] border shadow-xl ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}
        style={{ fontFamily: 'var(--v2-font)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className={`w-4 h-4 ${isDark ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'}`} />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Transfer registration</h3>
          </div>
          <button onClick={onClose} className={`p-1 rounded-[14px] ${isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-[#10284C]'}`}>
            <span className="font-semibold">{player?.first_name} {player?.last_name}</span>
            <span className={`ml-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>(current: {currentSeasonName})</span>
          </div>

          <div>
            <label className={`block text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Move to
            </label>
            <select
              value={selectedSeasonId}
              onChange={e => setSelectedSeasonId(e.target.value)}
              disabled={seasonsLoading}
              className={`w-full px-3 py-2 rounded-[14px] text-sm border focus:outline-none ${
                isDark
                  ? 'bg-white/[0.06] border-white/[0.06] text-white focus:border-[#4BB9EC]/30'
                  : 'bg-white border-[#E8ECF2] text-[#10284C] focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'
              }`}
            >
              <option value="">{seasonsLoading ? 'Loading seasons…' : 'Select a season…'}</option>
              {Object.entries(groupedSeasons).map(([groupName, list]) => (
                <optgroup key={groupName} label={groupName}>
                  {list.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {formatDateRange(s.start_date, s.end_date) ? ` (${formatDateRange(s.start_date, s.end_date)})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {!seasonsLoading && seasons.length === 0 && (
              <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No other active or upcoming seasons available.
              </p>
            )}
          </div>

          {/* Warning section */}
          <div className="rounded-[14px] bg-amber-50 border border-amber-200 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-bold">What will happen:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Player removed from current team</li>
                  <li>Auto-generated fees recalculated</li>
                  <li>Custom fees {keepCustomFees ? 'moved to new season' : 'deleted'}</li>
                  <li>RSVPs for current season cleared</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Keep custom fees checkbox */}
          <label className={`flex items-center gap-2 text-xs cursor-pointer ${isDark ? 'text-slate-300' : 'text-[#10284C]'}`}>
            <input
              type="checkbox"
              checked={keepCustomFees}
              onChange={e => setKeepCustomFees(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Also move custom fees to new season
          </label>

          {error && (
            <div className="rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex justify-end gap-2 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 rounded-[14px] text-xs font-bold border transition ${
              isDark
                ? 'border-white/[0.1] text-white/70 hover:bg-white/[0.04]'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={!selectedSeasonId || loading}
            className={`px-4 py-2 rounded-[14px] text-xs font-bold text-white flex items-center gap-1.5 transition ${
              !selectedSeasonId || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#4BB9EC] hover:brightness-110'
            }`}
          >
            {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Transferring…' : 'Transfer'}
          </button>
        </div>
      </div>
    </div>
  )
}
