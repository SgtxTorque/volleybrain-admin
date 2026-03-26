import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { X } from '../../constants/icons'

export default function EmailPreviewModal({ html, onClose }) {
  const { isDark } = useTheme()
  const [width, setWidth] = useState(600)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className={`${isDark ? 'bg-[#0B1D35] border-white/[0.08]' : 'bg-white border-[#E8ECF2]'} border rounded-[14px] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Email Preview</h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => setWidth(600)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${width === 600 ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' : isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Desktop
              </button>
              <button
                onClick={() => setWidth(375)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${width === 375 ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' : isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Mobile
              </button>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/[0.06] text-white' : 'hover:bg-[#F5F6F8] text-[#10284C]'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="flex-1 overflow-auto p-6 flex justify-center" style={{ background: isDark ? '#1a1a2e' : '#f0f0f0' }}>
          <iframe
            srcDoc={html}
            title="Email Preview"
            style={{
              width: `${width}px`,
              maxWidth: '100%',
              height: '100%',
              minHeight: 500,
              border: 'none',
              borderRadius: 8,
              background: '#fff',
            }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
