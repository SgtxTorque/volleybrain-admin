import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useSport } from './SportContext'
import { supabase } from '../lib/supabase'

// ============================================
// GLOBAL SEASON CONTEXT
// ============================================
const SeasonContext = createContext(null)

export function useSeason() { 
  return useContext(SeasonContext) 
}

export function SeasonProvider({ children }) {
  const { organization } = useAuth()
  const { selectedSport } = useSport()
  const [allSeasons, setAllSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.id) loadSeasons()
  }, [organization?.id])

  // Re-filter when sport changes
  useEffect(() => {
    if (allSeasons.length > 0) {
      const filtered = filteredSeasons()
      // If current season isn't in filtered list, switch to first available
      if (selectedSeason && !filtered.find(s => s.id === selectedSeason.id)) {
        const activeSeason = filtered.find(s => s.status === 'active')
        setSelectedSeason(activeSeason || filtered[0] || null)
      }
    }
  }, [selectedSport?.id, allSeasons])

  async function loadSeasons() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('seasons')
        .select('*, sports(id, name, icon, color_primary)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
      
      setAllSeasons(data || [])
      
      // Try to restore from localStorage, otherwise use active or first season
      const savedSeasonId = localStorage.getItem('vb_selected_season')
      const savedSeason = data?.find(s => s.id === savedSeasonId)
      const activeSeason = data?.find(s => s.status === 'active')
      
      setSelectedSeason(savedSeason || activeSeason || data?.[0] || null)
    } catch (err) {
      console.error('Load seasons error:', err)
    }
    setLoading(false)
  }

  // Filter seasons by selected sport (or show all if no sport selected)
  function filteredSeasons() {
    if (!selectedSport) return allSeasons
    // Filter by sport, but if nothing matches, show all (don't hide everything)
    const filtered = allSeasons.filter(s => s.sport_id === selectedSport.id)
    // If no seasons match the sport filter, show all seasons (with a note)
    // This prevents users from getting stuck with "no seasons" when they have seasons
    return filtered.length > 0 ? filtered : allSeasons
  }

  function selectSeason(season) {
    setSelectedSeason(season)
    if (season?.id) {
      localStorage.setItem('vb_selected_season', season.id)
    }
  }

  async function refreshSeasons(selectId = null) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('seasons')
        .select('*, sports(id, name, icon, color_primary)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
      
      setAllSeasons(data || [])
      
      // If a specific season ID was passed, select it
      if (selectId) {
        const targetSeason = data?.find(s => s.id === selectId)
        if (targetSeason) {
          setSelectedSeason(targetSeason)
          localStorage.setItem('vb_selected_season', targetSeason.id)
          setLoading(false)
          return
        }
      }
      
      // Otherwise, try to restore from localStorage, or use active/first season
      const savedSeasonId = localStorage.getItem('vb_selected_season')
      const savedSeason = data?.find(s => s.id === savedSeasonId)
      const activeSeason = data?.find(s => s.status === 'active')
      
      // If no season currently selected, auto-select the best option
      if (!selectedSeason) {
        const newSelection = savedSeason || activeSeason || data?.[0] || null
        setSelectedSeason(newSelection)
        if (newSelection?.id) {
          localStorage.setItem('vb_selected_season', newSelection.id)
        }
      }
    } catch (err) {
      console.error('Load seasons error:', err)
    }
    setLoading(false)
  }

  const seasons = filteredSeasons()

  return (
    <SeasonContext.Provider value={{ 
      seasons,
      allSeasons, 
      selectedSeason, 
      selectSeason, 
      loading,
      refreshSeasons 
    }}>
      {children}
    </SeasonContext.Provider>
  )
}
