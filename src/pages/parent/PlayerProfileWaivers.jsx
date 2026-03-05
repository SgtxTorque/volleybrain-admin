// =============================================================================
// PlayerProfileWaivers — WaiversTab component
// Extracted from PlayerProfilePage.jsx — preserves ALL Supabase queries
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function WaiversTab({ player, organization, isDark, showToast, teamColor }) {
  const { profile } = useAuth()
  const [waiverTemplates, setWaiverTemplates] = useState([])
  const [signatures, setSignatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [signingWaiver, setSigningWaiver] = useState(null)
  const [signerName, setSignerName] = useState(profile?.full_name || '')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [viewingWaiver, setViewingWaiver] = useState(null)
  const [useLegacy, setUseLegacy] = useState(false)

  useEffect(() => { loadWaivers() }, [organization?.id, player?.id])

  async function loadWaivers() {
    setLoading(true)
    const { data: templates, error } = await supabase
      .from('waiver_templates').select('*')
      .eq('organization_id', organization.id).eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) { setUseLegacy(true); setLoading(false); return }
    setWaiverTemplates(templates || [])

    if (player?.id) {
      const { data: sigs } = await supabase
        .from('waiver_signatures').select('*')
        .eq('player_id', player.id).eq('organization_id', organization.id).eq('status', 'signed')
      setSignatures(sigs || [])
    }
    setLoading(false)
  }

  function getSignatureForWaiver(waiverId) {
    return signatures.find(s => s.waiver_template_id === waiverId)
  }

  async function handleSign() {
    if (!agreed || !signerName.trim() || !signingWaiver) return
    setSubmitting(true)
    const now = new Date().toISOString()
    const { error } = await supabase.from('waiver_signatures').insert({
      waiver_template_id: signingWaiver.id, player_id: player.id,
      organization_id: organization.id, season_id: player.season_id || null,
      signed_by_user_id: profile?.id, signed_by_name: signerName.trim(),
      signed_by_email: profile?.email || '', signed_by_relation: 'Parent/Guardian',
      signature_data: signerName.trim(), status: 'signed',
      waiver_version: signingWaiver.version || 1, signed_at: now,
    })
    if (error) {
      showToast('Error signing waiver: ' + error.message, 'error')
    } else {
      showToast(`${signingWaiver.name} signed successfully!`, 'success')
      try {
        await supabase.from('admin_notifications').insert({
          organization_id: organization.id, type: 'waiver_signed', title: 'Waiver Signed',
          message: `${signerName} signed "${signingWaiver.name}" for ${player.first_name} ${player.last_name}`,
          metadata: { player_id: player.id, waiver_id: signingWaiver.id },
        })
      } catch (e) { /* notification table may not exist */ }
    }
    setSigningWaiver(null); setAgreed(false); setSubmitting(false); loadWaivers()
  }

  const totalRequired = waiverTemplates.filter(w => w.is_required).length
  const signedRequired = waiverTemplates.filter(w => w.is_required && getSignatureForWaiver(w.id)).length
  const allRequiredSigned = totalRequired > 0 && signedRequired === totalRequired

  if (loading) return <div className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading waivers...</div>

  // Legacy fallback
  if (useLegacy) {
    return (
      <div className="space-y-6">
        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>Waiver Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Liability Waiver', signed: player.waiver_liability, icon: '🛡️' },
            { label: 'Photo Release', signed: player.waiver_photo, icon: '📸' },
            { label: 'Code of Conduct', signed: player.waiver_conduct, icon: '🤝' },
          ].map(waiver => (
            <div key={waiver.label} className={`${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'} rounded-xl p-5 text-center`}>
              <span className="text-4xl">{waiver.icon}</span>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mt-2`}>{waiver.label}</p>
              <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-lg font-bold ${
                waiver.signed
                  ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                  : (isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600')
              }`}>
                {waiver.signed ? 'Signed' : 'Not Signed'}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Modern waivers
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>Waivers</h3>
        {totalRequired > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${(signedRequired / totalRequired) * 100}%`,
                backgroundColor: allRequiredSigned ? '#10b981' : teamColor,
              }} />
            </div>
            <span className={`text-lg font-medium ${allRequiredSigned ? 'text-emerald-500' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
              {signedRequired}/{totalRequired} required
            </span>
          </div>
        )}
      </div>

      {allRequiredSigned && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
          <span className="text-3xl">✅</span>
          <div>
            <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>All required waivers signed</p>
            <p className={`text-base ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>You're all set!</p>
          </div>
        </div>
      )}

      {waiverTemplates.length === 0 ? (
        <div className={`${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'} rounded-xl p-8 text-center`}>
          <span className="text-5xl">📋</span>
          <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} mt-3 font-medium`}>No waivers available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waiverTemplates.map(waiver => {
            const sig = getSignatureForWaiver(waiver.id)
            const isSigned = !!sig
            return (
              <div key={waiver.id} className={`${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'} border rounded-[14px] overflow-hidden`}>
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    isSigned ? (isDark ? 'bg-emerald-500/15' : 'bg-emerald-50') : (isDark ? 'bg-amber-500/15' : 'bg-amber-50')
                  }`}>
                    {isSigned ? '✅' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{waiver.name}</p>
                      {waiver.is_required && (
                        <span className="text-sm font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/12 text-red-500">Required</span>
                      )}
                    </div>
                    {isSigned ? (
                      <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                        Signed by {sig.signed_by_name} on {new Date(sig.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    ) : (
                      <p className={`text-base ${isDark ? 'text-amber-400/70' : 'text-amber-600'} mt-0.5`}>Pending signature</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setViewingWaiver(waiver)}
                      className={`px-3 py-1.5 rounded-lg text-base font-medium border ${isDark ? 'border-white/[0.06] text-slate-300' : 'border-slate-200 text-slate-600'} hover:opacity-80 transition`}>
                      View
                    </button>
                    {isSigned ? (
                      <span className={`px-3 py-1.5 rounded-lg text-base font-bold ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        Signed
                      </span>
                    ) : (
                      <button onClick={() => { setSigningWaiver(waiver); setAgreed(false); setSignerName(profile?.full_name || '') }}
                        className="px-4 py-1.5 rounded-lg text-base font-bold text-white transition" style={{ backgroundColor: teamColor }}>
                        Sign Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Waiver Modal */}
      {viewingWaiver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setViewingWaiver(null)}>
          <div className={`${isDark ? 'bg-lynx-charcoal' : 'bg-white'} rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className={`px-5 py-3 flex items-center justify-between ${isDark ? 'bg-lynx-midnight' : 'bg-slate-100'} rounded-t-xl`}>
              <span className={`text-xl font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewingWaiver.name}</span>
              <button onClick={() => setViewingWaiver(null)} className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>×</button>
            </div>
            <div className="h-1.5" style={{ backgroundColor: teamColor }} />
            <div className="px-6 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: `2px solid ${teamColor}` }}>
              {organization?.logo_url && <img src={organization.logo_url} alt="" className="h-10 w-10 object-contain" />}
              <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Georgia, serif' }}>{organization?.name}</h2>
            </div>
            <div className="p-6">
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-center mb-4`} style={{ fontFamily: 'Georgia, serif' }}>{viewingWaiver.name}</h3>
              {viewingWaiver.pdf_url?.toLowerCase().endsWith('.pdf') && (
                <div className={`mb-4 rounded-lg overflow-hidden border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                  <iframe src={viewingWaiver.pdf_url} className="w-full" style={{ height: '450px' }} title="Waiver" />
                </div>
              )}
              {viewingWaiver.pdf_url && /\.(png|jpg|jpeg)$/i.test(viewingWaiver.pdf_url) && (
                <img src={viewingWaiver.pdf_url} alt="Waiver" className={`w-full rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} mb-4`} />
              )}
              {viewingWaiver.content && (
                <div className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed whitespace-pre-wrap text-lg`} style={{ fontFamily: 'Georgia, serif' }}>
                  {viewingWaiver.content}
                </div>
              )}
            </div>
            <div className="h-1.5" style={{ backgroundColor: teamColor }} />
          </div>
        </div>
      )}

      {/* Sign Waiver Modal */}
      {signingWaiver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSigningWaiver(null)}>
          <div className={`${isDark ? 'bg-lynx-charcoal' : 'bg-white'} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: teamColor }} />
            <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: `2px solid ${teamColor}` }}>
              <div className="flex items-center gap-3">
                {organization?.logo_url && <img src={organization.logo_url} alt="" className="h-10 w-10 object-contain" />}
                <div>
                  <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{signingWaiver.name}</h2>
                  <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{organization?.name} • v{signingWaiver.version || 1}</p>
                </div>
              </div>
              <button onClick={() => setSigningWaiver(null)} className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>×</button>
            </div>

            <div className="px-6 py-5 max-h-[40vh] overflow-y-auto" style={{ fontFamily: 'Georgia, serif' }}>
              {signingWaiver.pdf_url?.toLowerCase().endsWith('.pdf') && (
                <div className={`mb-4 rounded-lg overflow-hidden border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                  <iframe src={signingWaiver.pdf_url} className="w-full" style={{ height: '350px' }} title="Waiver" />
                </div>
              )}
              {signingWaiver.pdf_url && /\.(png|jpg|jpeg)$/i.test(signingWaiver.pdf_url) && (
                <img src={signingWaiver.pdf_url} alt="Waiver" className={`w-full rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} mb-4`} />
              )}
              {signingWaiver.content && (
                <div className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed whitespace-pre-wrap text-lg`}>
                  {signingWaiver.content}
                </div>
              )}
              {!signingWaiver.content && !signingWaiver.pdf_url && (
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} italic text-center`}>(No content)</p>
              )}
            </div>

            <div className={`px-6 py-5 ${isDark ? 'bg-lynx-midnight' : 'bg-slate-50'} border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
              <label className={`flex items-start gap-3 cursor-pointer mb-5 p-4 rounded-xl border ${isDark ? 'border-white/[0.06] bg-white/[0.04]' : 'border-slate-200 bg-white'}`}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded accent-current shrink-0" style={{ accentColor: teamColor }} />
                <p className={`text-base ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                  I, the undersigned parent/guardian of <strong>{player.first_name} {player.last_name}</strong>, have read and agree to the terms outlined above.
                  By checking this box, I am providing my electronic signature.
                </p>
              </label>

              <div className="mb-4">
                <label className={`block text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1.5`}>Full Legal Name</label>
                <input value={signerName} onChange={e => setSignerName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-lg ${isDark ? 'border-white/[0.06] bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-900'} focus:ring-2 focus:outline-none`}
                  placeholder="Enter your full name as your electronic signature" />
              </div>

              {agreed && signerName.trim() && (
                <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} border`}>
                  <p className={`text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    This will be recorded as: <strong>{signerName.trim()}</strong> electronically signed "{signingWaiver.name}" for {player.first_name} {player.last_name} on{' '}
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at{' '}
                    {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={() => setSigningWaiver(null)}
                  className={`px-5 py-2.5 rounded-xl border ${isDark ? 'border-white/[0.06] text-white' : 'border-slate-200 text-slate-900'} font-medium text-base`}>
                  Cancel
                </button>
                <button onClick={handleSign} disabled={!agreed || !signerName.trim() || submitting}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-base disabled:opacity-40 transition"
                  style={{ backgroundColor: teamColor }}>
                  {submitting ? 'Signing...' : 'Sign Waiver'}
                </button>
              </div>
            </div>
            <div className="h-1.5 rounded-b-xl" style={{ backgroundColor: teamColor }} />
          </div>
        </div>
      )}
    </div>
  )
}
