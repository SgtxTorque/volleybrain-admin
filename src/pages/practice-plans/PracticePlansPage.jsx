import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useSport } from '../../contexts/SportContext'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/pages/PageShell'
import { fetchPracticePlans, togglePlanFavorite, deletePracticePlan } from '../../lib/practice-plan-service'
import { Plus, Search, Heart, Clock, ChevronDown, Trash2, Copy, Star } from 'lucide-react'

export default function PracticePlansPage({ showToast }) {
  const { user, organization } = useAuth()
  const { isDark } = useTheme()
  const { selectedSport } = useSport()
  const navigate = useNavigate()
  const orgId = organization?.id

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (orgId) loadPlans()
  }, [orgId, selectedSport?.id, favoritesOnly])

  async function loadPlans() {
    setLoading(true)
    const { data } = await fetchPracticePlans({
      orgId,
      sportId: selectedSport?.id,
      favoritesOnly,
      userId: user?.id,
    })
    if (data) {
      setPlans(data)
      const favs = new Set()
      data.forEach(p => {
        if (p.practice_plan_favorites?.some(f => f.user_id === user?.id)) favs.add(p.id)
      })
      setFavoriteIds(favs)
    }
    setLoading(false)
  }

  async function handleToggleFavorite(e, planId) {
    e.stopPropagation()
    const result = await togglePlanFavorite(user?.id, planId)
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (result.favorited) next.add(planId)
      else next.delete(planId)
      return next
    })
  }

  async function handleDelete(e, planId) {
    e.stopPropagation()
    if (!confirm('Delete this practice plan?')) return
    const { error } = await deletePracticePlan(planId)
    if (error) { showToast?.('Failed to delete plan', 'error'); return }
    setPlans(prev => prev.filter(p => p.id !== planId))
    showToast?.('Plan deleted', 'success')
  }

  const filtered = search.trim()
    ? plans.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : plans

  return (
    <PageShell
      breadcrumb="Practice > Practice Plans"
      title="Practice Plans"
      subtitle={`${plans.length} plan${plans.length !== 1 ? 's' : ''}`}
      actions={
        <button
          onClick={() => navigate('/practice-plans/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: 'var(--accent-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      }
    >
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search plans..."
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition ${
              isDark ? 'bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-white border border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400'
            }`}
          />
        </div>
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            favoritesOnly ? 'bg-red-500/10 text-red-400 border border-red-500/20'
            : isDark ? 'bg-white/[0.04] border border-white/[0.06] text-slate-400' : 'bg-white border border-[#E8ECF2] text-slate-500'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-red-400' : ''}`} />
          Favorites
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`rounded-[14px] p-5 animate-pulse ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}>
              <div className={`h-5 w-2/3 rounded mb-3 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
              <div className={`h-4 w-1/2 rounded ${isDark ? 'bg-white/[0.04]' : 'bg-slate-150'}`} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {search || favoritesOnly ? 'No plans match your filters' : 'No practice plans yet'}
          </h3>
          <p className={`text-sm max-w-md mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {search || favoritesOnly ? 'Try adjusting your filters.' : 'Create your first practice plan by assembling drills into a timed sequence.'}
          </p>
          {!search && !favoritesOnly && (
            <button
              onClick={() => navigate('/practice-plans/new')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'var(--accent-primary)' }}
            >
              <Plus className="w-4 h-4" />
              Create First Plan
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(plan => {
            const itemCount = plan.practice_plan_items?.[0]?.count || 0
            const totalMin = plan.target_duration_minutes
            const isFav = favoriteIds.has(plan.id)
            return (
              <div
                key={plan.id}
                onClick={() => navigate(`/practice-plans/${plan.id}`)}
                className={`group relative rounded-[14px] border p-5 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border-[#E8ECF2] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`text-base font-bold pr-6 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{plan.title}</h3>
                  <button onClick={e => handleToggleFavorite(e, plan.id)} className="shrink-0 p-1">
                    <Heart className={`w-4 h-4 transition ${isFav ? 'text-red-400 fill-red-400' : isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  {totalMin && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Clock className="w-3 h-3" /> {totalMin} min
                    </span>
                  )}
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </span>
                  {plan.is_template && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                      Template
                    </span>
                  )}
                </div>

                {plan.focus_areas?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plan.focus_areas.map(area => (
                      <span key={area} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {area.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`text-xs mt-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  Updated {new Date(plan.updated_at).toLocaleDateString()}
                </div>

                {/* Delete on hover */}
                <button
                  onClick={e => handleDelete(e, plan.id)}
                  className={`absolute bottom-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition ${
                    isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
