// =============================================================================
// DashboardGrid — react-grid-layout v2 powered drag-and-drop dashboard wrapper
// Wraps existing card components as draggable/resizable widgets.
// Edit mode: drag handles + export layout + reset to defaults.
// =============================================================================

import { useState, useCallback, useMemo, useRef } from 'react'
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor, noCompactor } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Copy, RotateCcw, Check } from 'lucide-react'

/**
 * DashboardGrid — wraps dashboard cards in a draggable/resizable grid.
 *
 * Props:
 * - widgets: Array of { id, component, defaultLayout: {x,y,w,h}, minW, minH, maxW, maxH, label }
 * - editMode: boolean — when true, cards are draggable/resizable
 * - onLayoutChange: callback with new layout (for future persistence)
 * - columns: number of grid columns (default 12)
 * - rowHeight: pixel height per row unit (default 40)
 */
export default function DashboardGrid({
  widgets,
  editMode = false,
  onLayoutChange,
  columns = 12,
  rowHeight = 40,
}) {
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 })

  // Build initial layouts from widget defaults — stable reference via widget IDs
  const widgetIds = widgets.map(w => w.id).join(',')
  const defaultLg = useMemo(() => widgets.map(w => ({
    i: w.id,
    x: w.defaultLayout.x,
    y: w.defaultLayout.y,
    w: w.defaultLayout.w,
    h: w.defaultLayout.h,
    minW: w.minW || 2,
    minH: w.minH || 2,
    maxW: w.maxW || 12,
    maxH: w.maxH || 20,
  })), [widgetIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const [layouts, setLayouts] = useState({ lg: defaultLg })
  const layoutRef = useRef(layouts)

  const handleLayoutChange = useCallback((layout) => {
    const updated = { ...layoutRef.current, lg: layout }
    layoutRef.current = updated
    setLayouts(updated)
    onLayoutChange?.(updated)
  }, [onLayoutChange])

  const handleReset = useCallback(() => {
    const reset = { lg: defaultLg }
    layoutRef.current = reset
    setLayouts(reset)
  }, [defaultLg])

  const [exported, setExported] = useState(false)

  const handleExport = useCallback(() => {
    const currentLg = layoutRef.current.lg || defaultLg
    const exportData = currentLg.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
    const json = JSON.stringify(exportData, null, 2)
    console.log('=== CURRENT LAYOUT ===')
    console.log(json)
    currentLg.forEach(item => {
      console.log(`  ${item.i}: ${item.w}col x ${item.h}row at (${item.x},${item.y})`)
    })
    console.log('=== END LAYOUT ===')
    try {
      navigator.clipboard.writeText(json)
    } catch { /* clipboard may not be available */ }
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }, [defaultLg])

  // Get current dimensions for a widget from layout state
  const getCurrentDims = useCallback((widgetId, fallbackW, fallbackH) => {
    const item = (layoutRef.current.lg || defaultLg).find(l => l.i === widgetId)
    return { w: item?.w || fallbackW, h: item?.h || fallbackH }
  }, [defaultLg])

  return (
    <div className="relative" ref={containerRef}>
      {/* Edit mode banner */}
      {editMode && (
        <div className="sticky top-0 z-50 bg-amber-50 border-b-2 border-amber-400 px-4 py-2 flex items-center justify-between mb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-amber-700 font-bold text-r-base">Edit Mode</span>
            <span className="text-amber-600 text-r-sm">Drag cards to rearrange. Drag corners to resize.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-r-sm font-bold hover:bg-slate-300 transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={handleExport}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-r-sm font-bold transition-colors ${
                exported
                  ? 'bg-green-500 text-white'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {exported ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Export Layout</>}
            </button>
          </div>
        </div>
      )}

      {/* Grid overlay — visible columns in edit mode */}
      {editMode && (
        <div className="dashboard-grid-overlay">
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="grid-col" data-col={i + 1} />
          ))}
        </div>
      )}

      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: columns, md: columns, sm: 6, xs: 4 }}
          rowHeight={rowHeight}
          dragConfig={{ enabled: editMode, handle: '.widget-drag-handle' }}
          resizeConfig={{ enabled: editMode, handles: ['se', 'sw', 'ne', 'nw'] }}
          onLayoutChange={handleLayoutChange}
          compactor={editMode ? noCompactor : verticalCompactor}
          margin={[16, 16]}
        >
          {widgets.map(widget => {
            const dims = editMode ? getCurrentDims(widget.id, widget.defaultLayout.w, widget.defaultLayout.h) : null
            return (
              <div key={widget.id} className={`relative group overflow-hidden rounded-2xl ${editMode ? 'ring-2 ring-lynx-sky/20 ring-offset-2' : ''}`}>
                {/* Drag handle — only visible in edit mode */}
                {editMode && (
                  <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 bg-lynx-sky/10 border-b border-lynx-sky/20 rounded-t-xl flex items-center justify-between px-3 cursor-grab active:cursor-grabbing z-10">
                    <span className="text-r-xs font-bold text-lynx-sky uppercase tracking-wider">
                      {widget.label || widget.id}
                    </span>
                    <span className="text-r-xs text-lynx-sky/50 font-mono">
                      {dims.w}x{dims.h}
                    </span>
                  </div>
                )}
                {/* The actual card component — scrolls internally when resized small */}
                <div className={`h-full overflow-auto scrollbar-hide ${editMode ? 'pt-8' : ''}`}>
                  {widget.component}
                </div>
              </div>
            )
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  )
}
