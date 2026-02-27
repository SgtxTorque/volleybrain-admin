import { useState, useEffect, useCallback, useRef } from 'react'
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout'
import { useAuth } from '../../../contexts/AuthContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'
import { WIDGET_REGISTRY, DEFAULT_LAYOUTS } from './DashboardWidgets'
import {
  Plus, X, Lock, Unlock, RotateCcw, GripVertical
} from 'lucide-react'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// ============================================
// WIDGET PICKER MODAL
// ============================================
function WidgetPicker({ onAdd, activeWidgets, role, onClose }) {
  const { isDark } = useTheme()
  const available = Object.values(WIDGET_REGISTRY).filter(
    w => w.roles.includes(role) && !activeWidgets.includes(w.id)
  )

  if (available.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${isDark ? 'bg-lynx-charcoal border border-white/10' : 'bg-white border border-lynx-silver'}`}
          onClick={e => e.stopPropagation()}>
          <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>All widgets added</h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>You've already added all available widgets for this role.</p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto ${isDark ? 'bg-lynx-charcoal border border-white/10' : 'bg-white border border-lynx-silver'}`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Add Widget</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {available.map(w => (
            <button key={w.id} onClick={() => { onAdd(w.id); onClose() }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${isDark ? 'hover:bg-white/[0.06] border border-white/[0.06]' : 'hover:bg-lynx-cloud border border-slate-100'}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10">
                <w.icon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{w.name}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{w.description}</p>
              </div>
              <Plus className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// DASHBOARD GRID
// ============================================
export function DashboardGrid({ role = 'admin' }) {
  const { isDark } = useTheme()
  const { profile } = useAuth()
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 })
  const [activeWidgets, setActiveWidgets] = useState([])
  const [layouts, setLayouts] = useState({})
  const [locked, setLocked] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef(null)
  const layoutRef = useRef(null)
  const widgetsRef = useRef(null)

  // Keep refs in sync for debounced save
  useEffect(() => { layoutRef.current = layouts }, [layouts])
  useEffect(() => { widgetsRef.current = activeWidgets }, [activeWidgets])

  // Load saved layout on mount / role change
  useEffect(() => {
    loadLayout()
  }, [profile?.id, role])

  async function loadLayout() {
    if (!profile?.id) {
      applyDefaults()
      return
    }

    try {
      const { data } = await supabase
        .from('user_dashboard_layouts')
        .select('layout, widgets')
        .eq('user_id', profile.id)
        .eq('role', role)
        .maybeSingle()

      if (data?.layout && data?.widgets?.length) {
        setActiveWidgets(data.widgets)
        setLayouts({ lg: data.layout })
      } else {
        applyDefaults()
      }
    } catch (e) {
      console.error('Failed to load dashboard layout:', e)
      applyDefaults()
    }
    setLoaded(true)
  }

  function applyDefaults() {
    const def = DEFAULT_LAYOUTS[role] || DEFAULT_LAYOUTS.admin
    setActiveWidgets([...def.widgets])
    setLayouts({ lg: [...def.layout] })
    setLoaded(true)
  }

  // Debounced save
  const saveLayout = useCallback((newLayout) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!profile?.id) return
      try {
        await supabase.from('user_dashboard_layouts').upsert({
          user_id: profile.id,
          role,
          layout: newLayout || layoutRef.current?.lg || [],
          widgets: widgetsRef.current || [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,role' })
      } catch (e) {
        console.error('Failed to save layout:', e)
      }
    }, 800)
  }, [profile?.id, role])

  function handleLayoutChange(layout) {
    setLayouts(prev => ({ ...prev, lg: layout }))
    saveLayout(layout)
  }

  function addWidget(widgetId) {
    const reg = WIDGET_REGISTRY[widgetId]
    if (!reg) return
    const newWidgets = [...activeWidgets, widgetId]
    setActiveWidgets(newWidgets)

    // Place at bottom of current layout
    const currentLayout = layouts.lg || []
    const maxY = currentLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0)
    const newItem = { i: widgetId, x: 0, y: maxY, ...reg.defaultSize }
    const newLayout = [...currentLayout, newItem]
    setLayouts({ lg: newLayout })

    setTimeout(() => saveLayout(newLayout), 100)
  }

  function removeWidget(widgetId) {
    const newWidgets = activeWidgets.filter(id => id !== widgetId)
    const newLayout = (layouts.lg || []).filter(item => item.i !== widgetId)
    setActiveWidgets(newWidgets)
    setLayouts({ lg: newLayout })
    setTimeout(() => saveLayout(newLayout), 100)
  }

  function resetLayout() {
    const def = DEFAULT_LAYOUTS[role] || DEFAULT_LAYOUTS.admin
    setActiveWidgets([...def.widgets])
    setLayouts({ lg: [...def.layout] })
    setTimeout(() => saveLayout([...def.layout]), 100)
  }

  if (!loaded) return null

  return (
    <div ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setShowPicker(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${isDark ? 'bg-white/[0.06] hover:bg-white/10 text-slate-300 border border-white/[0.06]' : 'bg-white hover:bg-lynx-cloud text-slate-600 border border-lynx-silver'}`}>
          <Plus className="w-4 h-4" /> Add Widget
        </button>

        <button onClick={() => setLocked(!locked)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
            locked
              ? (isDark ? 'bg-white/[0.06] hover:bg-white/10 text-slate-300 border border-white/[0.06]' : 'bg-white hover:bg-lynx-cloud text-slate-600 border border-lynx-silver')
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
          }`}>
          {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {locked ? 'Locked' : 'Unlocked'}
        </button>

        <button onClick={resetLayout}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${isDark ? 'bg-white/[0.06] hover:bg-white/10 text-slate-300 border border-white/[0.06]' : 'bg-white hover:bg-lynx-cloud text-slate-600 border border-lynx-silver'}`}>
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* Grid */}
      {activeWidgets.length === 0 ? (
        <div className={`rounded-xl border-2 border-dashed p-12 text-center ${isDark ? 'border-white/10' : 'border-lynx-silver'}`}>
          <p className={`text-lg font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No widgets on your dashboard</p>
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Click "Add Widget" to customize your view</p>
          <button onClick={() => setShowPicker(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition">
            <Plus className="w-4 h-4 inline mr-1" /> Add Widget
          </button>
        </div>
      ) : mounted && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={{ lg: layouts.lg || [] }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          dragConfig={{ enabled: !locked, handle: '.widget-drag-handle' }}
          resizeConfig={{ enabled: !locked }}
          onLayoutChange={handleLayoutChange}
          compactor={verticalCompactor}
          margin={[16, 16]}
        >
          {activeWidgets.map(widgetId => {
            const reg = WIDGET_REGISTRY[widgetId]
            if (!reg) return null
            const WidgetComponent = reg.component
            return (
              <div key={widgetId} className="relative group">
                <WidgetComponent />
                {/* Drag handle + remove — show on hover when unlocked */}
                {!locked && (
                  <>
                    <div className="widget-drag-handle absolute top-1 left-1 p-1 rounded-lg bg-black/30 text-white opacity-0 group-hover:opacity-100 cursor-grab transition z-10">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <button onClick={() => removeWidget(widgetId)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition z-10">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </ResponsiveGridLayout>
      )}

      {/* Widget Picker Modal */}
      {showPicker && (
        <WidgetPicker
          onAdd={addWidget}
          activeWidgets={activeWidgets}
          role={role}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
