import { getSportById } from './WaiversPage'

// =============================================
// BRANDED WAIVER PREVIEW MODAL (Letterhead)
// =============================================
export function WaiverPreviewModal({ tc, isDark, template, organization, onClose }) {
  const sport = getSportById(template.sport_id)
  const showLogo = template.org_logo_on_waiver !== false
  const isPdf = template.pdf_url?.toLowerCase().endsWith('.pdf')
  const isImage = template.pdf_url && /\.(png|jpg|jpeg|gif|webp)$/i.test(template.pdf_url)
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4BB9EC'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-[14px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Preview Admin Bar */}
        <div className={`px-5 py-2.5 flex items-center justify-between ${tc.cardBg} rounded-t-[14px]`}>
          <span className="text-xs font-medium text-slate-300">Preview -- How parents will see this waiver</span>
          <button onClick={onClose} className="text-lg text-slate-400 hover:text-white">x</button>
        </div>

        {/* Letterhead Top Bar */}
        <div style={{ background: accent }} className="h-2" />

        {/* Letterhead Header */}
        <div className="px-8 pt-6 pb-5" style={{ borderBottom: `3px solid ${accent}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showLogo && organization?.logo_url && (
                <img src={organization.logo_url} alt="" className="h-14 w-14 object-contain" />
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                  {organization?.name || 'Organization'}
                </h1>
                {sport && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: accent }}>
                    {sport.icon} {sport.name} Program
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Official Document</p>
              <p className="text-xs text-slate-500 mt-0.5">v{template.version || 1} - {dateStr}</p>
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="px-8 py-6" style={{ fontFamily: 'Georgia, serif' }}>
          <h2 className="text-lg font-bold text-center text-slate-800 mb-1">{template.name}</h2>
          {template.is_required && (
            <p className="text-center text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: accent }}>
              -- Required --
            </p>
          )}
          {!template.is_required && <div className="mb-6" />}

          {/* Embedded Document */}
          {template.pdf_url && isPdf && (
            <div className="mb-6 rounded-lg overflow-hidden" style={{ border: `1px solid ${accent}30` }}>
              <iframe src={template.pdf_url} className="w-full" style={{ height: '500px' }} title="Waiver Document" />
            </div>
          )}
          {template.pdf_url && isImage && (
            <div className="mb-6 rounded-lg overflow-hidden" style={{ border: `1px solid ${accent}30` }}>
              <img src={template.pdf_url} alt="Waiver Document" className="w-full object-contain" />
            </div>
          )}
          {template.pdf_url && !isPdf && !isImage && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">
                📎 Attached document: <a href={template.pdf_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: accent }}>Download</a>
              </p>
            </div>
          )}

          {/* Waiver Text Content */}
          {template.content && (
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm mb-8">{template.content}</div>
          )}
          {!template.content && !template.pdf_url && (
            <div className="text-slate-400 italic text-center text-sm mb-8">(No content yet)</div>
          )}

          {/* Electronic Signature Section */}
          {template.requires_signature !== false && (
            <div className="mt-8">
              <div className="h-px bg-slate-200 mb-6" />

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3 mb-5 p-4 rounded-lg"
                style={{ backgroundColor: `${accent}08`, border: `1px solid ${accent}20` }}>
                <div className="w-5 h-5 mt-0.5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: accent }}>
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  I, the undersigned parent/guardian, have read and agree to the terms outlined above.
                  By checking this box, I am providing my electronic signature, which is legally equivalent to a handwritten signature.
                </p>
              </div>

              {/* Signature Fields */}
              <div className="grid grid-cols-3 gap-5">
                {[
                  { label: 'Parent / Guardian', value: <span className="text-sm text-slate-400 italic">Jane Smith</span> },
                  { label: 'Signature', value: <span className="text-sm italic text-slate-400" style={{ fontFamily: 'cursive' }}>Jane Smith</span> },
                  { label: 'Date', value: <span className="text-sm text-slate-400">{dateStr}</span> },
                ].map(field => (
                  <div key={field.label}>
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: accent }}>{field.label}</p>
                    <div className="pb-2 h-8 flex items-end" style={{ borderBottom: `2px solid ${accent}40` }}>
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Electronic Fingerprint */}
              <div className="mt-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-[10px] text-emerald-700 font-medium" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  Electronically signed by Jane Smith on {dateStr} at {timeStr} - IP: 192.168.x.x - {organization?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Letterhead Footer */}
        <div className="px-8 py-3 flex items-center justify-between" style={{ borderTop: `3px solid ${accent}`, backgroundColor: '#fafafa' }}>
          <p className="text-[10px] text-slate-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {organization?.name} - {template.is_required ? 'Required Document' : 'Optional Document'}
          </p>
          <p className="text-[10px] text-slate-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
            v{template.version || 1} - Powered by Lynx
          </p>
        </div>
        <div style={{ background: accent }} className="h-2 rounded-b-[14px]" />
      </div>
    </div>
  )
}
