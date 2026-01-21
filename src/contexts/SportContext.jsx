import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

// ============================================
// GLOBAL SPORT CONTEXT
// ============================================
const SportContext = createContext(null)

export function useSport() { 
  return useContext(SportContext) 
}

export function SportProvider({ children }) {
  const { organization } = useAuth()
  const [sports, setSports] = useState([])
  const [selectedSport, setSelectedSport] = useState(null) // null = "All Sports"
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSports()
  }, [organization?.id])

  async function loadSports() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      setSports(data || [])
      
      // Try to restore from localStorage
      const savedSportId = localStorage.getItem('vb_selected_sport')
      if (savedSportId && savedSportId !== 'all') {
        const savedSport = data?.find(s => s.id === savedSportId)
        setSelectedSport(savedSport || null)
      }
    } catch (err) {
      console.error('Load sports error:', err)
    }
    setLoading(false)
  }

  function selectSport(sport) {
    setSelectedSport(sport)
    localStorage.setItem('vb_selected_sport', sport?.id || 'all')
  }

  return (
    <SportContext.Provider value={{ 
      sports, 
      selectedSport, 
      selectSport, 
      loading 
    }}>
      {children}
    </SportContext.Provider>
  )
}
