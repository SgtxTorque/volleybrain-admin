// =============================================================================
// DashboardGrid — react-grid-layout v2 powered drag-and-drop dashboard wrapper
// 24-column grid, 20px row height, free placement in edit mode with overlap.
// Supports widget library: add/remove widgets from a slide-out panel.
// =============================================================================

import { useState, useCallback, useMemo, useRef } from 'react'
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor, getCompactor } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Copy, RotateCcw, Check, LayoutGrid, X } from 'lucide-react'
import WidgetLibraryPanel from './WidgetLibraryPanel'
import { resolveWidget } from './widgetComponents'

// Edit mode compactor: no compaction, allow overlap, no collision prevention
const editCompactor = getCompactor(null, true, false)

export default function DashboardGrid({
  widgets,
  editMode = false,
  onLayoutChange,
  columns = 24,
  rowHeight = 20,
  role = 'admin',
  sharedProps = {},
}) {
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 })

  // ── Widget add/remove state ──
  const [addedWidgets, setAddedWidgets] = useState([])
  const [removedWidgetIds, setRemovedWidgetIds] = useState(new Set())
  const [libraryOpen, setLibraryOpen] = useState(false)

  // Merge: effective widgets = (original - removed) + added
  const effectiveWidgets = useMemo(() => {
    const kept = widgets.filter(w => !removedWidgetIds.has(w.id))
    return [...kept, ...addedWidgets]
  }, [widgets, removedWidgetIds, addedWidgets])

  // Set of active widget IDs (for the library panel)
  const activeWidgetIds = useMemo(
    () => new Set(effectiveWidgets.map(w => w.id)),
    [effectiveWidgets]
  )

  // Build initial layouts from widget defaults — stable reference via widget IDs
  const widgetIds = effectiveWidgets.map(w => w.id).join(',')
  const defaultLg = useMemo(() => effectiveWidgets.map(w => ({
    i: w.id,
    x: w.defaultLayout.x,
    y: w.defaultLayout.y,
    w: w.defaultLayout.w,
    h: w.defaultLayout.h,
    minW: w.minW || 2,
    minH: w.minH || 2,
    maxW: w.maxW || 24,
    maxH: w.maxH || 40,
  })), [widgetIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track current breakpoint to avoid cross-contamination
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg')

  // Initialize layouts for ALL breakpoints so resizing doesn't contaminate
  const [layouts, setLayouts] = useState(() => {
    const lg = defaultLg
    const md = lg.map(item => ({
      ...item,
      w: Math.min(item.w, 24),
      x: Math.min(item.x, 24 - Math.min(item.w, 24)),
    }))
    const sm = lg.map((item, idx) => ({
      ...item,
      x: 0,
      w: 12,
      y: idx * item.h,
    }))
    const xs = lg.map((item, idx) => ({
      ...item,
      x: 0,
      w: 6,
      y: idx * item.h,
    }))
    return { lg, md, sm, xs }
  })
  const layoutRef = useRef(layouts)
  const [overlappingItems, setOverlappingItems] = useState(new Set())

  // Sync layouts when widgets are added or removed
  const prevWidgetIds = useRef(widgetIds)
  if (prevWidgetIds.current !== widgetIds) {
    prevWidgetIds.current = widgetIds
    const activeIds = new Set(effectiveWidgets.map(w => w.id))

    // Merge each breakpoint's layout
    const mergeBreakpoint = (bpLayout, fallback) => {
      const existing = (bpLayout || fallback || [])
      const existingIds = new Set(existing.map(l => l.i))
      const merged = existing.filter(l => activeIds.has(l.i))
      for (const w of effectiveWidgets) {
        if (!existingIds.has(w.id)) {
          merged.push({
            i: w.id,
            x: w.defaultLayout.x,
            y: w.defaultLayout.y,
            w: w.defaultLayout.w,
            h: w.defaultLayout.h,
            minW: w.minW || 2,
            minH: w.minH || 2,
            maxW: w.maxW || 24,
            maxH: w.maxH || 40,
          })
        }
      }
      return merged
    }

    const prev = layoutRef.current
    const lgMerged = mergeBreakpoint(prev.lg, defaultLg)
    const updated = {
      lg: lgMerged,
      md: mergeBreakpoint(prev.md, lgMerged),
      sm: mergeBreakpoint(prev.sm, lgMerged),
      xs: mergeBreakpoint(prev.xs, lgMerged),
    }
    layoutRef.current = updated
    setLayouts(updated)
  }

  // Detect overlapping cards
  const detectOverlaps = useCallback((layout) => {
    const overlaps = new Set()
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const a = layout[i]
        const b = layout[j]
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
          overlaps.add(a.i)
          overlaps.add(b.i)
        }
      }
    }
    setOverlappingItems(overlaps)
  }, [])

  const handleBreakpointChange = useCallback((newBreakpoint) => {
    setCurrentBreakpoint(newBreakpoint)
  }, [])

  const handleLayoutChange = useCallback((layout) => {
    const updated = { ...layoutRef.current, [currentBreakpoint]: layout }
    layoutRef.current = updated
    setLayouts(updated)
    if (editMode) detectOverlaps(layout)
    onLayoutChange?.(updated)
  }, [currentBreakpoint, onLayoutChange, editMode, detectOverlaps])

  const handleReset = useCallback(() => {
    // Reset layout AND restore all original widgets
    setAddedWidgets([])
    setRemovedWidgetIds(new Set())
    const md = defaultLg.map(item => ({
      ...item,
      w: Math.min(item.w, 24),
      x: Math.min(item.x, 24 - Math.min(item.w, 24)),
    }))
    const sm = defaultLg.map((item, idx) => ({
      ...item, x: 0, w: 12, y: idx * item.h,
    }))
    const xs = defaultLg.map((item, idx) => ({
      ...item, x: 0, w: 6, y: idx * item.h,
    }))
    const reset = { lg: defaultLg, md, sm, xs }
    layoutRef.current = reset
    setLayouts(reset)
    setOverlappingItems(new Set())
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

  // ── Add/Remove handlers ──
  const handleAddWidget = useCallback((widgetDef) => {
    // Find the bottom-most Y to place new widget below everything
    const currentLg = layoutRef.current.lg || []
    const maxY = currentLg.reduce((max, item) => Math.max(max, item.y + item.h), 0)

    const newWidget = {
      id: widgetDef.id,
      label: widgetDef.label,
      componentKey: widgetDef.componentKey,
      defaultLayout: {
        x: 0,
        y: maxY + 1,
        w: widgetDef.defaultSize.w,
        h: widgetDef.defaultSize.h,
      },
      minW: widgetDef.minSize.w,
      minH: widgetDef.minSize.h,
    }

    // If this widget was previously removed, un-remove it instead
    setRemovedWidgetIds(prev => {
      if (prev.has(widgetDef.id)) {
        const next = new Set(prev)
        next.delete(widgetDef.id)
        return next
      }
      return prev
    })

    // Only add if it's genuinely new (not an original widget being restored)
    const isOriginal = widgets.some(w => w.id === widgetDef.id)
    if (!isOriginal) {
      setAddedWidgets(prev => {
        if (prev.some(w => w.id === widgetDef.id)) return prev
        return [...prev, newWidget]
      })
    }
  }, [widgets])

  const handleRemoveWidget = useCallback((widgetId) => {
    // If it's an added widget, remove from added list
    setAddedWidgets(prev => prev.filter(w => w.id !== widgetId))
    // If it's an original widget, add to removed set
    if (widgets.some(w => w.id === widgetId)) {
      setRemovedWidgetIds(prev => new Set([...prev, widgetId]))
    }
  }, [widgets])

  const overlapCount = overlappingItems.size > 0 ? Math.floor(overlappingItems.size / 2) : 0

  return (
    <div className="relative" ref={containerRef}>
      {/* Edit mode banner */}
      {editMode && (
        <div className="sticky top-0 z-50 bg-amber-50 border-b-2 border-amber-400 px-4 py-2 flex items-center justify-between mb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-amber-700 font-bold text-r-base">Edit Mode</span>
            <span className="text-amber-600 text-r-sm">Drag cards to rearrange. Drag edges to resize.</span>
            {overlapCount > 0 && (
              <span className="text-red-500 font-bold text-r-sm ml-2">
                {overlapCount} overlapping card{overlapCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLibraryOpen(true)}
              className="flex items-center gap-1.5 bg-[#4BB9EC] text-white px-3 py-1.5 rounded-lg text-r-sm font-bold hover:bg-[#3BA8DB] transition-colors"
            >
              <LayoutGrid size={14} /> Widgets
            </button>
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
        <div className="dashboard-grid-overlay" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
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
          cols={{ lg: columns, md: columns, sm: 12, xs: 6 }}
          rowHeight={rowHeight}
          dragConfig={{ enabled: editMode, handle: '.widget-drag-handle' }}
          resizeConfig={{ enabled: editMode, handles: ['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's'] }}
          onBreakpointChange={handleBreakpointChange}
          onLayoutChange={handleLayoutChange}
          compactor={editMode ? editCompactor : verticalCompactor}
          margin={[12, 12]}
        >
          {effectiveWidgets.map(widget => {
            const dims = editMode ? getCurrentDims(widget.id, widget.defaultLayout.w, widget.defaultLayout.h) : null
            const isOverlapping = editMode && overlappingItems.has(widget.id)
            return (
              <div key={widget.id} className={`relative group overflow-hidden rounded-2xl ${
                editMode
                  ? isOverlapping
                    ? 'ring-2 ring-red-500 ring-offset-2'
                    : 'ring-2 ring-lynx-sky/20 ring-offset-2'
                  : ''
              }`}>
                {/* Drag handle — only visible in edit mode */}
                {editMode && (
                  <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 bg-lynx-sky/10 border-b border-lynx-sky/20 rounded-t-xl flex items-center justify-between px-3 cursor-grab active:cursor-grabbing z-10">
                    <span className="text-r-xs font-bold text-lynx-sky uppercase tracking-wider">
                      {widget.label || widget.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-r-xs text-lynx-sky/50 font-mono">
                        {dims.w}x{dims.h}
                      </span>
                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widget.id) }}
                        className="w-5 h-5 rounded-full bg-red-500/80 text-white text-[10px] flex items-center justify-center hover:bg-red-500 transition-colors"
                        title="Remove widget"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                )}
                {/* The actual card component — scrolls internally when resized small */}
                <div className={`h-full overflow-auto scrollbar-hide ${editMode ? 'pt-8' : ''}`}>
                  {widget.component || resolveWidget(widget.componentKey, { ...sharedProps, editMode })}
                </div>
              </div>
            )
          })}
        </ResponsiveGridLayout>
      )}

      {/* Widget Library Panel */}
      <WidgetLibraryPanel
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        role={role}
        activeWidgetIds={activeWidgetIds}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
      />
    </div>
  )
}
