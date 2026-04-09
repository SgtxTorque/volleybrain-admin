import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// ============================================
// GLOBAL PROGRAM CONTEXT
// Programs are organizational containers that optionally reference a sport.
// Replaces SportContext as the primary nav/filter context.
// ============================================

const ProgramContext = createContext(null)

export const ALL_PROGRAMS = Object.freeze({ id: 'all', name: 'All Programs', isSentinel: true })

export function isAllPrograms(p) {
  return p?.id === 'all' || p?.isSentinel === true
}

// Safe default shape for consumers that run outside ProgramProvider (e.g., the
// CommandPalette rendered under Platform Admin, which is not wrapped in the
// org-level provider tree). Returning no-op defaults keeps those components
// working without needing to drill a provider into every shell.
const PROGRAM_CONTEXT_FALLBACK = Object.freeze({
  programs: [],
  selectedProgram: null,
  selectProgram: () => {},
  loading: false,
  refreshPrograms: async () => {},
})

export function useProgram() {
  const context = useContext(ProgramContext)
  if (!context) return PROGRAM_CONTEXT_FALLBACK
  return context
}

export function ProgramProvider({ children }) {
  const { organization } = useAuth()
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState(null) // null = "All Programs"
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organization?.id) return
    loadPrograms()
  }, [organization?.id])

  async function loadPrograms() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*, sport:sports(id, name, icon, color_primary, code)')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error loading programs:', error)
        setPrograms([])
        setLoading(false)
        return
      }

      setPrograms(data || [])

      // Restore saved selection from localStorage
      const savedId = localStorage.getItem('vb_selected_program')
      if (savedId && savedId !== 'all') {
        const saved = (data || []).find(p => p.id === savedId)
        if (saved) {
          setSelectedProgram(saved)
        } else {
          setSelectedProgram(null)
        }
      }
      // If no saved selection, default to null (All Programs)
    } catch (err) {
      console.error('Load programs error:', err)
    }
    setLoading(false)
  }

  function selectProgram(program) {
    if (!program || isAllPrograms(program)) {
      setSelectedProgram(null)
      localStorage.removeItem('vb_selected_program')
    } else {
      setSelectedProgram(program)
      localStorage.setItem('vb_selected_program', program.id)
    }
  }

  async function refreshPrograms() {
    await loadPrograms()
  }

  return (
    <ProgramContext.Provider value={{
      programs,
      selectedProgram,   // null = All Programs
      selectProgram,
      loading,
      refreshPrograms
    }}>
      {children}
    </ProgramContext.Provider>
  )
}
