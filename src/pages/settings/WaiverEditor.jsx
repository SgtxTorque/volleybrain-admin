import { useRef, useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { fullDate } from './WaiversPage'

// =============================================
// WAIVER EDITOR (right panel)
// =============================================
export function WaiverEditor({
  selectedTemplate,
  setSelectedTemplate,
  signatureStats,
  editHistory,
  saving,
  onSave,
  onDelete,
  onDuplicate,
  onPreview,
  showToast,
}) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { organization } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // -- File Upload --
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
      'image/jpeg',
    ]
    if (!allowed.includes(file.type)) {
      showToast('Supported formats: PDF, DOCX, DOC, PNG, JPG', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Max 10MB', 'error')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${organization.id}/${selectedTemplate?.id || 'new'}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('waivers')
      .upload(fileName, file, { upsert: true })
    if (error) {
      showToast('Upload failed: ' + error.message, 'error')
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('waivers').getPublicUrl(fileName)

    if (selectedTemplate) {
      setSelectedTemplate({ ...selectedTemplate, pdf_url: urlData.publicUrl })
    }
    showToast(`${ext.toUpperCase()} uploaded! Remember to save.`, 'success')
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="lg:col-span-3 space-y-4">
      {/* Header Card */}
      <div className={`${tc.cardBg} border border-slate-200 rounded-[14px] p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <input
              value={selectedTemplate.name || ''}
              onChange={e =>
                setSelectedTemplate({ ...selectedTemplate, name: e.target.value })
              }
              className={`text-xl font-bold ${tc.text} bg-transparent border-none outline-none w-full`}
              placeholder="Waiver name"
              disabled={selectedTemplate._legacy}
            />
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`text-xs ${tc.textMuted}`}>
                v{selectedTemplate.version || 1}
              </span>
              {signatureStats.signed !== undefined && !selectedTemplate._legacy && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isDark
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {signatureStats.signed} signed
                </span>
              )}
            </div>
            {/* Edit Fingerprint */}
            {selectedTemplate.last_edited_at && (
              <div className={`mt-2 flex items-center gap-2 text-xs ${tc.textMuted}`}>
                <span>✏️</span>
                <span>
                  Last edited{' '}
                  {editHistory[0]?.edited_by_name
                    ? `by ${editHistory[0].edited_by_name}`
                    : ''}{' '}
                  on {fullDate(selectedTemplate.last_edited_at)}
                </span>
              </div>
            )}
            {!selectedTemplate.last_edited_at && selectedTemplate.created_at && (
              <div className={`mt-2 flex items-center gap-2 text-xs ${tc.textMuted}`}>
                <span>📅</span>
                <span>Created {fullDate(selectedTemplate.created_at)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!selectedTemplate._legacy && (
              <>
                <button
                  onClick={onPreview}
                  className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} text-sm`}
                  title="Preview"
                >
                  👁️
                </button>
                <button
                  onClick={() => onDuplicate(selectedTemplate)}
                  className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} text-sm`}
                  title="Duplicate"
                >
                  📄
                </button>
                <button
                  onClick={() => onDelete(selectedTemplate.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 text-sm"
                  title="Delete"
                >
                  🗑️
                </button>
              </>
            )}
            <button
              onClick={onSave}
              disabled={saving || selectedTemplate._legacy}
              className="px-5 py-2 rounded-[14px] bg-lynx-navy text-white font-semibold text-r-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
        </div>

        {/* Settings Row */}
        {!selectedTemplate._legacy && (
          <div
            className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t border-dashed"
            style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
          >
            {[
              { key: 'is_required', label: 'Required' },
              { key: 'is_active', label: 'Active' },
              { key: 'requires_signature', label: 'Requires Signature' },
              { key: 'org_logo_on_waiver', label: 'Branded' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTemplate[opt.key] !== false}
                  onChange={e =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      [opt.key]: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded accent-lynx-sky"
                />
                <span className={`text-sm ${tc.text}`}>{opt.label}</span>
              </label>
            ))}

            <div className="ml-auto flex items-center gap-3">
              {/* Type selector */}
              <select
                value={selectedTemplate.type || 'standard'}
                onChange={e =>
                  setSelectedTemplate({
                    ...selectedTemplate,
                    type: e.target.value,
                    sport_id:
                      e.target.value !== 'sport_specific'
                        ? null
                        : selectedTemplate.sport_id,
                  })
                }
                className={`text-sm px-3 py-1.5 rounded-lg border ${tc.border} ${
                  isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                }`}
              >
                <option value="standard">📋 Standard</option>
                <option value="sport_specific">🏆 Sport-Specific</option>
                <option value="adhoc">📨 Ad-Hoc</option>
              </select>
              {/* Sport selector - only when sport_specific */}
              {selectedTemplate.type === 'sport_specific' && (
                <select
                  value={selectedTemplate.sport_id || ''}
                  onChange={e =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      sport_id: e.target.value || null,
                    })
                  }
                  className={`text-sm px-3 py-1.5 rounded-lg border ${tc.border} ${
                    isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                  }`}
                >
                  <option value="">Select sport...</option>
                  {(
                    organization?.settings?.enabled_sports || ['volleyball']
                  ).map(id => {
                    const ALL_SPORTS = [
                      { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
                      { id: 'basketball', name: 'Basketball', icon: '🏀' },
                      { id: 'soccer', name: 'Soccer', icon: '⚽' },
                      { id: 'baseball', name: 'Baseball', icon: '⚾' },
                      { id: 'softball', name: 'Softball', icon: '🥎' },
                      { id: 'football', name: 'Flag Football', icon: '🏈' },
                      { id: 'swimming', name: 'Swimming', icon: '🏊' },
                      { id: 'track', name: 'Track & Field', icon: '🏃' },
                      { id: 'tennis', name: 'Tennis', icon: '🎾' },
                      { id: 'golf', name: 'Golf', icon: '⛳' },
                      { id: 'cheer', name: 'Cheerleading', icon: '📣' },
                      { id: 'gymnastics', name: 'Gymnastics', icon: '🤸' },
                    ]
                    const s = ALL_SPORTS.find(sp => sp.id === id)
                    return s ? (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ) : null
                  })}
                </select>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content: Text Editor + File Upload */}
      <div className={`${tc.cardBg} border border-slate-200 rounded-[14px] p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold ${tc.text}`}>Waiver Content</h3>
          <span className={`text-xs ${tc.textMuted}`}>
            Type text below, upload a file, or both
          </span>
        </div>

        {/* File Upload Zone */}
        <div
          className={`mb-4 border-2 border-dashed ${tc.border} rounded-[14px] p-4 ${
            selectedTemplate.pdf_url
              ? ''
              : 'cursor-pointer hover:border-lynx-sky/30'
          } transition`}
          onClick={() =>
            !selectedTemplate.pdf_url &&
            !selectedTemplate._legacy &&
            fileInputRef.current?.click()
          }
        >
          {selectedTemplate.pdf_url ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📎</span>
                <div>
                  <p className={`font-medium text-sm ${tc.text}`}>File Attached</p>
                  <a
                    href={selectedTemplate.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-lynx-sky hover:underline"
                  >
                    View uploaded file →
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className={`text-xs px-3 py-1 rounded-lg border ${tc.border} ${tc.text}`}
                >
                  Replace
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedTemplate({ ...selectedTemplate, pdf_url: null })
                  }}
                  className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              {uploading ? (
                <p className={`text-sm ${tc.textMuted}`}>Uploading...</p>
              ) : (
                <>
                  <p className={`text-sm font-medium ${tc.textSecondary}`}>
                    📤 Click to upload a file
                  </p>
                  <p className={`text-xs ${tc.textMuted} mt-1`}>
                    PDF, DOCX, DOC, PNG, JPG - Max 10MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Text Content */}
        <textarea
          value={selectedTemplate.content || ''}
          onChange={e =>
            setSelectedTemplate({ ...selectedTemplate, content: e.target.value })
          }
          className={`w-full min-h-[350px] ${
            isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'
          } border ${tc.border} rounded-[14px] px-4 py-3 resize-y text-sm leading-relaxed`}
          placeholder={
            'Enter waiver text here...\n\nThis text will be displayed to parents during registration and when signing waivers.'
          }
          disabled={selectedTemplate._legacy}
        />
      </div>

      {/* Admin Notes */}
      {!selectedTemplate._legacy && (
        <div className={`${tc.cardBg} border border-slate-200 rounded-[14px] p-5`}>
          <label
            className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}
          >
            Admin Notes (internal only)
          </label>
          <input
            value={selectedTemplate.description || ''}
            onChange={e =>
              setSelectedTemplate({
                ...selectedTemplate,
                description: e.target.value,
              })
            }
            className={`w-full ${
              isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'
            } border ${tc.border} rounded-[14px] px-4 py-2.5 text-sm`}
            placeholder="e.g. Updated liability language for 2026 spring season"
          />
        </div>
      )}

      {/* Edit History Timeline */}
      {editHistory.length > 0 && (
        <div className={`${tc.cardBg} border border-slate-200 rounded-[14px] p-5`}>
          <h3 className={`text-sm font-bold ${tc.text} mb-3`}>📜 Edit History</h3>
          <div className="space-y-3 relative">
            {/* Timeline line */}
            <div
              className={`absolute left-[7px] top-2 bottom-2 w-px ${
                isDark ? 'bg-slate-700' : 'bg-slate-200'
              }`}
            />
            {editHistory.map(h => (
              <div key={h.id} className="flex items-start gap-3 relative">
                <div
                  className={`w-[15px] h-[15px] rounded-full border-2 shrink-0 z-10 ${
                    isDark
                      ? 'bg-slate-900 border-slate-600'
                      : 'bg-white border-slate-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${tc.text}`}>
                    <span className="font-medium">
                      {h.edited_by_name || 'Admin'}
                    </span>
                    <span className={` ${tc.textMuted}`}>
                      {' '}
                      -- {h.change_summary || 'Updated content'}
                    </span>
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>
                    v{h.version} - {fullDate(h.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
