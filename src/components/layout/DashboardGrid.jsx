// =============================================================================
// DashboardGrid — react-grid-layout v2 powered drag-and-drop dashboard wrapper
// Wraps existing card components as draggable/resizable widgets.
// Edit mode: drag handles + export layout + reset to defaults.
// =============================================================================

import { useState, useCallback, useMemo, useRef } from 'react'
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

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

  // Build initial layouts from widget defaults
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
  })), [widgets])

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

  const handleExport = useCallback(() => {
    const exportData = (layoutRef.current.lg || defaultLg).map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
    const json = JSON.stringify(exportData, null, 2)
    console.log('=== CURRENT LAYOUT ===')
    console.log(json)
    console.log('=== END LAYOUT ===')
    try {
      navigator.clipboard.writeText(json)
    } catch { /* clipboard may not be available */ }
    alert('Layout exported to console (F12 → Console) and copied to clipboard.')
  }, [defaultLg])

  return (
    <div className="relative" ref={containerRef}>
      {/* Edit mode banner */}
      {editMode && (
        <div className="sticky top-0 z-50 bg-amber-50 border-b-2 border-amber-400 px-4 py-2 flex items-center justify-between mb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-amber-700 font-bold text-r-base">Edit Mode</span>
            <span className="text-amber-600 text-r-sm">Drag cards to rearrange. Drag edges to resize.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-r-sm font-bold hover:bg-slate-300 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleExport}
              className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-r-sm font-bold hover:bg-amber-600 transition-colors"
            >
              Export Layout
            </button>
          </div>
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
          resizeConfig={{ enabled: editMode }}
          onLayoutChange={handleLayoutChange}
          compactor={verticalCompactor}
          margin={[16, 16]}
        >
          {widgets.map(widget => (
            <div key={widget.id} className="relative group">
              {/* Drag handle — only visible in edit mode */}
              {editMode && (
                <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 bg-lynx-sky/10 border-b border-lynx-sky/20 rounded-t-xl flex items-center justify-between px-3 cursor-grab active:cursor-grabbing z-10">
                  <span className="text-r-xs font-bold text-lynx-sky uppercase tracking-wider">
                    {widget.label || widget.id}
                  </span>
                </div>
              )}
              {/* The actual card component */}
              <div className={`h-full overflow-auto ${editMode ? 'pt-8' : ''}`}>
                {widget.component}
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  )
}
