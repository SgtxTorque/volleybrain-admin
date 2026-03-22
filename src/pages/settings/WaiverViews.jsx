import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// =============================================
// SIGNATURES VIEW
// =============================================
export function SignaturesView({ tc, isDark, organization, selectedSeason }) {
  const [signatures, setSignatures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSigs()
  }, [organization?.id, selectedSeason?.id])

  async function loadSigs() {
    setLoading(true)
    let q = supabase
      .from('waiver_signatures')
      .select(
        '*, waiver_templates(name, type), players(first_name, last_name, parent_name)'
      )
      .eq('organization_id', organization.id)
      .order('signed_at', { ascending: false })
      .limit(100)
    if (selectedSeason?.id && selectedSeason.id !== 'all') q = q.eq('season_id', selectedSeason.id)
    const { data } = await q
    setSignatures(data || [])
    setLoading(false)
  }

  return (
    <div
      className={`${tc.cardBg} border border-slate-200 rounded-[14px] overflow-hidden`}
    >
      <div className={`p-5 border-b ${tc.border}`}>
        <h3 className={`font-bold ${tc.text}`}>Signed Waivers</h3>
        <p className={`text-sm ${tc.textMuted}`}>{signatures.length} signatures</p>
      </div>
      {loading ? (
        <div className={`p-10 text-center ${tc.textMuted}`}>Loading...</div>
      ) : signatures.length === 0 ? (
        <div className={`p-10 text-center ${tc.textMuted}`}>
          <p className="text-3xl mb-2">✍️</p>
          <p>No signatures yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                {['Player', 'Waiver', 'Signed By', 'Date', 'Status'].map(h => (
                  <th
                    key={h}
                    className={`text-left px-4 py-3 font-semibold ${tc.textMuted} text-xs uppercase`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signatures.map(sig => (
                <tr
                  key={sig.id}
                  className={`border-t ${tc.border} ${
                    isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className={`px-4 py-3 ${tc.text} font-medium`}>
                    {sig.players?.first_name} {sig.players?.last_name}
                  </td>
                  <td className={`px-4 py-3 ${tc.textSecondary}`}>
                    {sig.waiver_templates?.name || '--'}
                  </td>
                  <td className={`px-4 py-3 ${tc.textSecondary}`}>
                    {sig.signed_by_name}
                    {sig.signed_by_relation && (
                      <span className={`text-xs ${tc.textMuted} ml-1`}>
                        ({sig.signed_by_relation})
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${tc.textMuted} text-xs`}>
                    {sig.signed_at
                      ? new Date(sig.signed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        sig.status === 'signed'
                          ? 'bg-emerald-500/20 text-emerald-600'
                          : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {sig.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// =============================================
// SEND HISTORY VIEW
// =============================================
export function SendHistoryView({ tc, isDark, organization }) {
  const [sends, setSends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [organization?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('waiver_sends')
      .select('*, waiver_templates(name), players(first_name, last_name)')
      .eq('organization_id', organization.id)
      .order('sent_at', { ascending: false })
      .limit(50)
    setSends(data || [])
    setLoading(false)
  }

  return (
    <div
      className={`${tc.cardBg} border border-slate-200 rounded-[14px] overflow-hidden`}
    >
      <div className={`p-5 border-b ${tc.border}`}>
        <h3 className={`font-bold ${tc.text}`}>📨 Send History</h3>
      </div>
      {loading ? (
        <div className={`p-10 text-center ${tc.textMuted}`}>Loading...</div>
      ) : sends.length === 0 ? (
        <div className={`p-10 text-center ${tc.textMuted}`}>
          <p className="text-3xl mb-2">📨</p>
          <p>No ad-hoc waivers sent yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                {['Waiver', 'Sent To', 'Sent', 'Status'].map(h => (
                  <th
                    key={h}
                    className={`text-left px-4 py-3 font-semibold ${tc.textMuted} text-xs uppercase`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sends.map(s => (
                <tr key={s.id} className={`border-t ${tc.border}`}>
                  <td className={`px-4 py-3 ${tc.text}`}>
                    {s.waiver_templates?.name || '--'}
                  </td>
                  <td className={`px-4 py-3 ${tc.textSecondary}`}>
                    {s.players
                      ? `${s.players.first_name} ${s.players.last_name}`
                      : s.sent_to_name}
                  </td>
                  <td className={`px-4 py-3 ${tc.textMuted} text-xs`}>
                    {s.sent_at
                      ? new Date(s.sent_at).toLocaleDateString()
                      : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        s.status === 'signed'
                          ? 'bg-emerald-500/20 text-emerald-600'
                          : s.status === 'opened'
                          ? 'bg-blue-500/20 text-blue-600'
                          : 'bg-amber-500/20 text-amber-600'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
