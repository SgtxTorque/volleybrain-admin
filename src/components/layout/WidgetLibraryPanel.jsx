// =============================================================================
// WidgetLibraryPanel — slide-out panel to browse, add, and remove widgets
// =============================================================================

import { useState } from 'react'
import { X, Search } from 'lucide-react'
import { getWidgetsByCategory } from './widgetRegistry'
import { widgetExists } from './widgetComponents'

export default function WidgetLibraryPanel({
  isOpen,
  onClose,
  role,
  activeWidgetIds,
  onAddWidget,
  onRemoveWidget,
}) {
  const [search, setSearch] = useState('')
  const grouped = getWidgetsByCategory(role)

  const filteredGrouped = {}
  for (const [category, widgets] of Object.entries(grouped)) {
    const filtered = widgets.filter(w =>
      w.label.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase())
    )
    if (filtered.length > 0) {
      filteredGrouped[category] = filtered
    }
  }

  const totalAvailable = Object.values(grouped).flat().length
  const totalActive = activeWidgetIds?.size || 0

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      )}

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-[#0A1628] z-50 shadow-2xl transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-extrabold text-r-lg">Widget Library</h2>
            <p className="text-white/40 text-r-xs mt-0.5">{totalActive} of {totalAvailable} active</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.06] text-white placeholder-white/30 text-r-sm border border-white/[0.06] focus:border-[#4BB9EC] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Widget list */}
        <div className="overflow-y-auto h-[calc(100%-130px)] px-4 pb-4">
          {Object.entries(filteredGrouped).map(([category, widgets]) => (
            <div key={category} className="mb-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[1.2px] text-white/25 mb-2">{category}</h3>
              {widgets.map(widget => {
                const isActive = activeWidgetIds?.has(widget.id)
                const exists = widgetExists(widget.componentKey)
                return (
                  <div key={widget.id} className={`flex items-start gap-3 py-3 border-b border-white/[0.04] ${
                    isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                  } transition-opacity`}>
                    <span className="text-lg mt-0.5 flex-shrink-0">{widget.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-r-sm">{widget.label}</span>
                        {!exists && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Soon</span>
                        )}
                      </div>
                      <p className="text-white/30 text-r-xs mt-0.5 line-clamp-2">{widget.description}</p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {widget.allowMultiple ? (
                        <button
                          onClick={() => {
                            const suffix = Date.now().toString(36)
                            onAddWidget({ ...widget, id: `${widget.id}-${suffix}` })
                          }}
                          className="text-[11px] font-bold text-[#4BB9EC] hover:text-white px-2 py-1 rounded border border-[#4BB9EC]/30 hover:border-[#4BB9EC]/60 hover:bg-[#4BB9EC]/10 transition-colors"
                        >
                          + Add
                        </button>
                      ) : isActive ? (
                        <button
                          onClick={() => onRemoveWidget(widget.id)}
                          className="text-[11px] font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-400/30 hover:border-red-400/60 transition-colors"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => onAddWidget(widget)}
                          className="text-[11px] font-bold text-[#4BB9EC] hover:text-white px-2 py-1 rounded border border-[#4BB9EC]/30 hover:border-[#4BB9EC]/60 hover:bg-[#4BB9EC]/10 transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {Object.keys(filteredGrouped).length === 0 && (
            <div className="text-center py-8">
              <span className="text-2xl block mb-2">🔍</span>
              <p className="text-white/30 text-r-sm">No widgets match "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
