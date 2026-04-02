import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useSport } from '../../contexts/SportContext'
import PageShell from '../../components/pages/PageShell'
import DrillCard from './DrillCard'
import CreateDrillModal from './CreateDrillModal'
import DrillDetailModal from './DrillDetailModal'
import AssignDrillModal from '../../components/practice/AssignDrillModal'
import { fetchDrills, fetchDrillCategories, toggleDrillFavorite } from '../../lib/drill-service'
import { Plus, Search, Heart, ChevronDown } from 'lucide-react'

export default function DrillLibraryPage({ showToast }) {
  const { user, organization } = useAuth()
  const { isDark } = useTheme()
  const { selectedSport } = useSport()
  const navigate = useNavigate()
  const orgId = organization?.id

  const [drills, setDrills] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const searchTimeout = useRef(null)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editDrill, setEditDrill] = useState(null)
  const [detailDrill, setDetailDrill] = useState(null)
  const [assignDrill, setAssignDrill] = useState(null)

  // Favorites tracking (local cache)
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  useEffect(() => {
    if (orgId) {
      loadCategories()
      loadDrills()
    }
  }, [orgId, selectedSport?.id, selectedCategory, favoritesOnly])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      if (orgId) loadDrills()
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [search])

  async function loadCategories() {
    const { data } = await fetchDrillCategories({ orgId, sportId: selectedSport?.id })
    if (data) setCategories(data)
  }

  async function loadDrills() {
    setLoading(true)
    const { data, count } = await fetchDrills({
      orgId,
      sportId: selectedSport?.id,
      category: selectedCategory || undefined,
      search: search.trim() || undefined,
      favoritesOnly,
      userId: user?.id,
    })

    if (data) {
      setDrills(data)
      setTotal(count || data.length)
      // Build favorites set
      const favs = new Set()
      data.forEach(d => {
        if (d.drill_favorites?.some(f => f.user_id === user?.id)) favs.add(d.id)
      })
      setFavoriteIds(favs)
    }
    setLoading(false)
  }

  async function handleToggleFavorite(drillId) {
    const result = await toggleDrillFavorite(user?.id, drillId)
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (result.favorited) next.add(drillId)
      else next.delete(drillId)
      return next
    })
  }

  function handleDrillCreated() {
    loadDrills()
  }

  function handleDrillDeleted(drillId) {
    setDrills(prev => prev.filter(d => d.id !== drillId))
    setDetailDrill(null)
  }

  function handleEditDrill(drill) {
    setDetailDrill(null)
    setEditDrill(drill)
    setShowCreateModal(true)
  }

  return (
    <PageShell
      breadcrumb="Practice > Drill Library"
      title="Drill Library"
      subtitle={`${total} drill${total !== 1 ? 's' : ''} in your library`}
      actions={
        <button
          onClick={() => { setEditDrill(null); setShowCreateModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: 'var(--accent-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Add Drill
        </button>
      }
    >
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className={`relative flex-1 min-w-[200px] max-w-sm`}>
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drills..."
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition ${
              isDark
                ? 'bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-slate-500 focus:border-white/[0.12]'
                : 'bg-white border border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400 focus:border-[#CBD5E1]'
            }`}
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className={`appearance-none px-4 pr-8 py-2.5 rounded-xl text-sm font-semibold outline-none cursor-pointer transition ${
              isDark
                ? 'bg-white/[0.04] border border-white/[0.06] text-white'
                : 'bg-white border border-[#E8ECF2] text-[#10284C]'
            }`}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.display_name}</option>
            ))}
          </select>
          <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>

        {/* Favorites toggle */}
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            favoritesOnly
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : isDark
                ? 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white'
                : 'bg-white border border-[#E8ECF2] text-slate-500 hover:text-[#10284C]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-red-400' : ''}`} />
          Favorites
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`rounded-[14px] overflow-hidden ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'} animate-pulse`}>
              <div className="aspect-video" />
              <div className="p-3 space-y-2">
                <div className={`h-4 rounded ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
                <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-white/[0.04]' : 'bg-slate-150'}`} />
              </div>
            </div>
          ))}
        </div>
      ) : drills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🏐</div>
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {search || selectedCategory || favoritesOnly ? 'No drills match your filters' : 'Build your drill library'}
          </h3>
          <p className={`text-sm max-w-md mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {search || selectedCategory || favoritesOnly
              ? 'Try adjusting your search or category filter.'
              : 'Add your favorite drills with YouTube videos, coaching points, and diagrams.'}
          </p>
          {!search && !selectedCategory && !favoritesOnly && (
            <button
              onClick={() => { setEditDrill(null); setShowCreateModal(true) }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'var(--accent-primary)' }}
            >
              <Plus className="w-4 h-4" />
              Create First Drill
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {drills.map(drill => (
            <DrillCard
              key={drill.id}
              drill={drill}
              isFavorited={favoriteIds.has(drill.id)}
              onToggleFavorite={handleToggleFavorite}
              onClick={setDetailDrill}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <CreateDrillModal
        visible={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditDrill(null) }}
        onSuccess={handleDrillCreated}
        editDrill={editDrill}
        orgId={orgId}
        showToast={showToast}
      />

      {/* Detail Modal */}
      <DrillDetailModal
        drill={detailDrill}
        visible={!!detailDrill}
        onClose={() => setDetailDrill(null)}
        onEdit={handleEditDrill}
        onDelete={handleDrillDeleted}
        onAssignToPlayer={(drill) => { setDetailDrill(null); setAssignDrill(drill) }}
        onAddToPlan={() => navigate('/practice-plans/new')}
        isFavorited={detailDrill ? favoriteIds.has(detailDrill.id) : false}
        userId={user?.id}
        showToast={showToast}
      />

      {/* Assign to Player Modal */}
      <AssignDrillModal
        drill={assignDrill}
        visible={!!assignDrill}
        onClose={() => setAssignDrill(null)}
        onSuccess={() => { setAssignDrill(null); loadDrills() }}
        showToast={showToast}
      />
    </PageShell>
  )
}
