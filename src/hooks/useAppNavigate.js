import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { getPathForPage, getPageIdFromPath, PAGE_TITLES } from '../lib/routes'

// Drop-in replacement for the old setPage function.
// Returns a function with the same signature: navigate('pageId')
// Also handles dynamic pages like 'player-{id}' and 'teamwall-{id}'
export function useAppNavigate() {
  const navigate = useNavigate()

  const appNavigate = useCallback((pageId, item) => {
    // Handle team wall navigation (replaces old hash-based system)
    if (item?.teamId) {
      navigate(`/teams/${item.teamId}`)
      return
    }
    // Handle player card navigation
    if (item?.playerId) {
      navigate(`/parent/player/${item.playerId}`)
      return
    }

    const path = getPathForPage(pageId)
    navigate(path)
  }, [navigate])

  return appNavigate
}

// Hook to get the current "page ID" from the URL (for nav highlighting)
export function useCurrentPageId() {
  const location = useLocation()
  return getPageIdFromPath(location.pathname)
}

// Hook to update document.title based on current route
export function useDocumentTitle() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    let title = PAGE_TITLES[path]

    // Dynamic routes
    if (!title) {
      if (path.startsWith('/teams/')) title = 'Team Hub'
      else if (path.startsWith('/parent/player/')) title = 'Player Profile'
      else if (path.startsWith('/register/')) title = 'Registration'
      else title = 'Lynx'
    }

    document.title = title ? `${title} — Lynx` : 'Lynx'
  }, [location.pathname])
}
