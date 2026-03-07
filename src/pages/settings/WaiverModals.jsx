import { useState, useRef, useEffect } from 'react'
import { useThemeClasses, useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// =============================================
// CREATE WAIVER MODAL (with file upload)
// =============================================
export function CreateWaiverModal({ tc, isDark, onClose, onCreate, enabledSports }) {
  const { organization } = useAuth()
  const [form, setForm] = useState({
    name: '', type: 'standard', is_required: true,
    requires_signature: true, content: '', sport_id: null, pdf_url: null,
  })
  const [uploading, setUploading] = useState(false)
  const [contentMode, setContentMode] = useState('text')
  const createFileRef = useRef(null)

  const presets = [
    { name: 'Liability Waiver', content: 'I understand that participation in sports activities involves inherent risks including but not limited to injury, illness, or property damage. I voluntarily assume all risks associated with participation and release the organization, its officers, coaches, and volunteers from any and all claims arising from participation.\n\nI acknowledge that my child is physically fit to participate and has no medical conditions that would prevent safe participation unless otherwise disclosed.\n\nBy signing below, I agree to these terms and conditions.' },
    { name: 'Photo/Media Release', content: 'I grant permission for the organization to photograph, video record, and use the likeness of my child in connection with team activities, events, marketing materials, social media, and website content.\n\nI understand that these images may be used for promotional purposes and I waive any right to inspect or approve the use of these materials.' },
    { name: 'Code of Conduct', content: 'Players and parents/guardians agree to:\n\n- Treat all players, coaches, officials, and spectators with respect\n- Follow all rules and guidelines set by coaches and league administrators\n- Demonstrate good sportsmanship at all times\n- Refrain from using abusive or inappropriate language\n- Support and encourage all team members\n- Respect facility rules and property\n\nViolation of this code may result in suspension or removal from the program.' },
    { name: 'Medical Authorization', content: 'In the event of a medical emergency, I authorize the coaches and staff to seek and obtain emergency medical treatment for my child.\n\nI understand that every effort will be made to contact me before treatment, but in the event that I cannot be reached, I give consent for necessary medical procedures.\n\nI agree to be financially responsible for any medical treatment provided.' },
    { name: 'Concussion Protocol', content: 'I have been provided information about the signs and symptoms of concussions and head injuries.\n\nI understand that if my child shows any signs of a concussion during practice or competition, they will be immediately removed from play and will not be allowed to return until cleared by a licensed healthcare provider.' },
  ]

  async function handleCreateUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword', 'image/png', 'image/jpeg']
    if (!allowed.includes(file.type)) return
    if (file.size > 10 * 1024 * 1024) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${organization.id}/new-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('waivers').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('waivers').getPublicUrl(fileName)
      setForm({ ...form, pdf_url: urlData.publicUrl })
    }
    setUploading(false)
  }

  const inputCls = `w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-[14px] px-4 py-2.5 text-sm`
  const labelCls = `block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border border-slate-200 rounded-[14px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className={`p-5 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${tc.text}`}>Create Waiver Template</h2>
          <button onClick={onClose} className={`${tc.textMuted} text-xl`}>x</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Presets */}
          <div>
            <label className={`${labelCls} mb-2`}>Quick Start Templates</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button key={p.name} onClick={() => { setForm({ ...form, name: p.name, content: p.content }); setContentMode('text') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${tc.border} ${tc.text} hover:bg-lynx-sky/10 transition`}>{p.name}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}>Waiver Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Liability Waiver" />
          </div>

          {/* Type + Sport + Required */}
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[140px]">
              <label className={labelCls}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, sport_id: e.target.value !== 'sport_specific' ? null : form.sport_id })} className={inputCls}>
                <option value="standard">📋 Standard</option>
                <option value="sport_specific">🏆 Sport-Specific</option>
                <option value="adhoc">📨 Ad-Hoc</option>
              </select>
            </div>
            {form.type === 'sport_specific' && (
              <div className="flex-1 min-w-[140px]">
                <label className={labelCls}>Sport</label>
                <select value={form.sport_id || ''} onChange={e => setForm({ ...form, sport_id: e.target.value || null })} className={inputCls}>
                  <option value="">Select sport...</option>
                  {enabledSports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer pb-1">
              <input type="checkbox" checked={form.is_required} onChange={e => setForm({ ...form, is_required: e.target.checked })} className="w-4 h-4 accent-lynx-sky" />
              <span className={`text-sm ${tc.text}`}>Required</span>
            </label>
          </div>

          {/* Content Mode Toggle */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              {['text', 'upload'].map(mode => (
                <button key={mode} onClick={() => setContentMode(mode)}
                  className={`text-sm font-medium pb-1 border-b-2 transition ${contentMode === mode ? 'border-lynx-sky text-lynx-sky' : `border-transparent ${tc.textMuted}`}`}>
                  {mode === 'text' ? '✏️ Type Content' : '📤 Upload File'}
                </button>
              ))}
            </div>

            {contentMode === 'text' ? (
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                className={`w-full min-h-[200px] ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-[14px] px-4 py-3 text-sm resize-y`}
                placeholder="Enter waiver text..." />
            ) : (
              <div>
                {form.pdf_url ? (
                  <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-50'} rounded-[14px] p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📎</span>
                      <div>
                        <p className={`font-medium text-sm ${tc.text}`}>File Uploaded</p>
                        <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-lynx-sky hover:underline">View →</a>
                      </div>
                    </div>
                    <button onClick={() => setForm({ ...form, pdf_url: null })} className="text-xs text-red-500">Remove</button>
                  </div>
                ) : (
                  <div onClick={() => createFileRef.current?.click()}
                    className={`border-2 border-dashed ${tc.border} rounded-[14px] p-8 text-center cursor-pointer hover:border-lynx-sky/30 transition`}>
                    {uploading ? <p className={`text-sm ${tc.textMuted}`}>Uploading...</p> : (
                      <>
                        <p className="text-3xl mb-2">📤</p>
                        <p className={`text-sm font-medium ${tc.textSecondary}`}>Click to upload</p>
                        <p className={`text-xs ${tc.textMuted} mt-1`}>PDF, DOCX, DOC, PNG, JPG - Max 10MB</p>
                      </>
                    )}
                  </div>
                )}
                <input ref={createFileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" onChange={handleCreateUpload} className="hidden" />
              </div>
            )}
          </div>
        </div>
        <div className={`p-5 border-t ${tc.border} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-5 py-2 rounded-[14px] border ${tc.border} ${tc.text} font-medium text-sm`}>Cancel</button>
          <button onClick={() => onCreate(form)} disabled={!form.name}
            className="px-5 py-2 rounded-[14px] bg-lynx-navy text-white font-semibold text-sm disabled:opacity-50">Create Waiver</button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// SEND AD-HOC MODAL
// =============================================
export function SendAdhocModal({ tc, isDark, organization, templates, showToast, onClose }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [players, setPlayers] = useState([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.from('players').select('id, first_name, last_name, parent_email, parent_name')
      .eq('organization_id', organization.id).order('last_name')
      .then(({ data }) => setPlayers(data || []))
  }, [])

  async function handleSend() {
    if (!selectedTemplateId || selectedPlayerIds.length === 0) return
    setSending(true)
    const sends = selectedPlayerIds.map(pid => {
      const p = players.find(x => x.id === pid)
      return { waiver_template_id: selectedTemplateId, organization_id: organization.id, player_id: pid,
        sent_to_email: p?.parent_email, sent_to_name: p?.parent_name, status: 'sent' }
    })
    const { error } = await supabase.from('waiver_sends').insert(sends)
    if (error) showToast('Error: ' + error.message, 'error')
    else { showToast(`Sent to ${selectedPlayerIds.length} player(s)!`, 'success'); onClose() }
    setSending(false)
  }

  const filtered = players.filter(p =>
    `${p.first_name} ${p.last_name} ${p.parent_name || ''}`.toLowerCase().includes(search.toLowerCase()))
  const inputCls = `w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-[14px] px-4 py-2.5 text-sm`

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border border-slate-200 rounded-[14px] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className={`p-5 border-b ${tc.border}`}>
          <h2 className={`text-lg font-bold ${tc.text}`}>📨 Send Ad-Hoc Waiver</h2>
          <p className={`text-sm ${tc.textMuted} mt-1`}>Send a waiver to specific players for signature</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Select Waiver</label>
            <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className={inputCls}>
              <option value="">Choose...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Players ({selectedPlayerIds.length})</label>
            <input value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} mb-2`} placeholder="Search..." />
            <div className={`max-h-[250px] overflow-y-auto border ${tc.border} rounded-[14px]`}>
              {filtered.map(p => (
                <label key={p.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b last:border-b-0 ${tc.border} ${
                  selectedPlayerIds.includes(p.id) ? (isDark ? 'bg-slate-800' : 'bg-blue-50') : ''} hover:bg-lynx-sky/5`}>
                  <input type="checkbox" checked={selectedPlayerIds.includes(p.id)}
                    onChange={() => setSelectedPlayerIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className="w-4 h-4 accent-lynx-sky" />
                  <div>
                    <p className={`text-sm font-medium ${tc.text}`}>{p.first_name} {p.last_name}</p>
                    <p className={`text-xs ${tc.textMuted}`}>{p.parent_name || p.parent_email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className={`p-5 border-t ${tc.border} flex justify-between items-center`}>
          <button onClick={() => setSelectedPlayerIds(filtered.map(p => p.id))} className={`text-xs ${tc.textMuted} hover:text-lynx-sky`}>Select All</button>
          <div className="flex gap-3">
            <button onClick={onClose} className={`px-5 py-2 rounded-[14px] border ${tc.border} ${tc.text} font-medium text-sm`}>Cancel</button>
            <button onClick={handleSend} disabled={!selectedTemplateId || selectedPlayerIds.length === 0 || sending}
              className="px-5 py-2 rounded-[14px] bg-lynx-navy text-white font-semibold text-sm disabled:opacity-50">
              {sending ? 'Sending...' : `Send to ${selectedPlayerIds.length}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
