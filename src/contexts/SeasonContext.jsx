import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useProgram } from './ProgramContext'
import { supabase } from '../lib/supabase'

// ============================================
// GLOBAL SEASON CONTEXT
// ============================================

/** Sentinel object representing "All Seasons" org-wide view. Admin only. */
export const ALL_SEASONS = Object.freeze({ id: 'all', name: 'All Seasons', isSentinel: true })

/** Check if a season value is the "All Seasons" sentinel */
export function isAllSeasons(season) {
  return season?.id === 'all'
}

const SeasonContext = createContext(null)

export function useSeason() { 
  return useContext(SeasonContext) 
}

export function SeasonProvider({ children }) {
  const { organization } = useAuth()
  const { selectedProgram } = useProgram()
  const [allSeasons, setAllSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.id) loadSeasons()
  }, [organization?.id])

  // Re-filter when program changes
  useEffect(() => {
    // Don't reset if user is in "All Seasons" mode
    if (isAllSeasons(selectedSeason)) return
    if (allSeasons.length > 0) {
      const filtered = filteredSeasons()
      // If current season isn't in filtered list, switch to first available
      if (selectedSeason && !filtered.find(s => s.id === selectedSeason.id)) {
        const activeSeason = filtered.find(s => s.status === 'active')
        setSelectedSeason(activeSeason || filtered[0] || null)
      }
    }
  }, [selectedProgram?.id, allSeasons])

  async function loadSeasons() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('seasons')
        .select('*, sports(id, name, icon, color_primary), programs(id, name, icon, sport_id)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      setAllSeasons(data || [])

      // Try to restore from localStorage, otherwise use active or first season
      const savedSeasonId = localStorage.getItem('vb_selected_season')
      if (savedSeasonId === 'all') {
        setSelectedSeason(ALL_SEASONS)
      } else {
        // savedSeason will be undefined if the saved ID belongs to a different org
        // (data is already filtered by organization.id)
        const savedSeason = data?.find(s => s.id === savedSeasonId)
        if (savedSeasonId && !savedSeason) {
          // Clear stale cross-org saved season
          localStorage.removeItem('vb_selected_season')
        }
        const activeSeason = data?.find(s => s.status === 'active')
        setSelectedSeason(savedSeason || activeSeason || data?.[0] || null)
      }
    } catch (err) {
      console.error('Load seasons error:', err)
    }
    setLoading(false)
  }

  // Filter seasons by selected program (or show all if no program selected)
  function filteredSeasons() {
    if (!selectedProgram) return allSeasons
    // Filter by program, but if nothing matches, show all (don't hide everything)
    const filtered = allSeasons.filter(s => s.program_id === selectedProgram.id)
    return filtered.length > 0 ? filtered : allSeasons
  }

  function selectSeason(season) {
    // Accept the "All Seasons" sentinel
    if (season?.id === 'all') {
      setSelectedSeason(ALL_SEASONS)
      localStorage.setItem('vb_selected_season', 'all')
      return
    }
    // Guard: if null is passed but seasons exist, keep current selection
    if (!season && allSeasons.length > 0) {
      console.warn('[SeasonContext] Attempted to set season to null while seasons exist. Ignoring.')
      return
    }
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
        .select('*, sports(id, name, icon, color_primary), programs(id, name, icon, sport_id)')
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
      
      // If a season is currently selected (and not "All Seasons"),
      // refresh it with the updated data so renames propagate immediately.
      if (selectedSeason && !isAllSeasons(selectedSeason)) {
        const updated = (data || []).find(s => s.id === selectedSeason.id)
        if (updated) setSelectedSeason(updated)
      } else {
        // Otherwise, try to restore from localStorage, or use active/first season
        const savedSeasonId = localStorage.getItem('vb_selected_season')
        if (savedSeasonId === 'all') {
          setSelectedSeason(ALL_SEASONS)
        } else {
          const savedSeason = data?.find(s => s.id === savedSeasonId)
          const activeSeason = data?.find(s => s.status === 'active')
          const newSelection = savedSeason || activeSeason || data?.[0] || null
          setSelectedSeason(newSelection)
          if (newSelection?.id) {
            localStorage.setItem('vb_selected_season', newSelection.id)
          }
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
