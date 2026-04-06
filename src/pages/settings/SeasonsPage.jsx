import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useProgram } from '../../contexts/ProgramContext'
import { useSport } from '../../contexts/SportContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { parseLocalDate } from '../../lib/date-helpers'
import {
  Plus, Edit, Trash2, Calendar, DollarSign, Users, Settings,
  Share2, Copy, Check, ExternalLink, X
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import { SeasonFormModal, ShareHubModal } from './SeasonFormModal'

function SeasonsPage({ showToast }) {
  const journey = useJourney()
  const { organization } = useAuth()
  const { refreshSeasons } = useSeason()
  const { selectedProgram } = useProgram()
  const { sports } = useSport()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState(null)
  const [modalTab, setModalTab] = useState('basic')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareSeason, setShareSeason] = useState(null)
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState({
    name: '', status: 'upcoming', start_date: '', end_date: '',
    fee_registration: 150, fee_uniform: 35, fee_monthly: 50, fee_per_family: 0, months_in_season: 3,
    sibling_discount_type: 'none', sibling_discount_amount: 0, sibling_discount_apply_to: 'additional',
    sport_id: null, registration_opens: '', registration_closes: '',
    early_bird_deadline: '', early_bird_discount: 25, late_registration_deadline: '',
    late_registration_fee: 25, capacity: null, waitlist_enabled: true, waitlist_capacity: 20,
    description: '',
    registration_template_id: null,
    registration_config: null,
    program_id: null
  })

  useEffect(() => {
    if (organization?.id) {
      loadSeasons()
      loadTemplates()
    }
  }, [organization?.id])

  async function loadSeasons() {
    setLoading(true)
    const { data } = await supabase.from('seasons').select('*, sports(id, name, icon)').eq('organization_id', organization.id).order('created_at', { ascending: false })
    setSeasons(data || [])
    setLoading(false)
  }

  async function loadTemplates() {
    const { data } = await supabase
      .from('registration_templates')
      .select('*, sports(id, name, icon)')
      .eq('organization_id', organization.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
    setTemplates(data || [])
  }

  function openNew() {
    setEditingSeason(null)
    setForm({
      name: '', status: 'upcoming', start_date: '', end_date: '',
      fee_registration: 150, fee_uniform: 35, fee_monthly: 50, fee_per_family: 0, months_in_season: 3,
      sibling_discount_type: 'none', sibling_discount_amount: 0, sibling_discount_apply_to: 'additional',
      sport_id: selectedProgram?.sport_id || null, registration_opens: '', registration_closes: '',
      early_bird_deadline: '', early_bird_discount: 25, late_registration_deadline: '',
      late_registration_fee: 25, capacity: null, waitlist_enabled: true, waitlist_capacity: 20,
      description: '',
      registration_template_id: null,
      registration_config: null,
      program_id: selectedProgram?.id || null,
    })
    setShowModal(true)
  }

  function openEdit(season) {
    setEditingSeason(season)
    setForm({
      name: season.name,
      status: season.status,
      start_date: season.start_date || '',
      end_date: season.end_date || '',
      fee_registration: season.fee_registration || 150,
      fee_uniform: season.fee_uniform || 35,
      fee_monthly: season.fee_monthly || 50,
      fee_per_family: season.fee_per_family || 0,
      months_in_season: season.months_in_season || 3,
      sibling_discount_type: season.sibling_discount_type || 'none',
      sibling_discount_amount: season.sibling_discount_amount || 0,
      sibling_discount_apply_to: season.sibling_discount_apply_to || 'additional',
      sport_id: season.sport_id || null,
      registration_opens: season.registration_opens || '',
      registration_closes: season.registration_closes || '',
      early_bird_deadline: season.early_bird_deadline || '',
      early_bird_discount: season.early_bird_discount || 25,
      late_registration_deadline: season.late_registration_deadline || '',
      late_registration_fee: season.late_registration_fee || 25,
      capacity: season.capacity || null,
      waitlist_enabled: season.waitlist_enabled ?? true,
      waitlist_capacity: season.waitlist_capacity || 20,
      description: season.description || '',
      registration_template_id: season.registration_template_id || null,
      registration_config: season.registration_config || null,
      program_id: season.program_id || null,
    })
    setShowModal(true)
  }

  async function handleSave() {
    // Clean form data: convert empty strings to null for date/nullable fields
    // PostgreSQL rejects empty strings ('') for date, integer, and uuid columns
    const dateFields = ['start_date', 'end_date', 'registration_opens', 'registration_closes', 'early_bird_deadline', 'late_registration_deadline']
    const nullableFields = ['sport_id', 'capacity', 'waitlist_capacity', 'registration_template_id', 'registration_config', 'program_id']
    const cleaned = { ...form }
    dateFields.forEach(f => { if (cleaned[f] === '' || cleaned[f] === undefined) cleaned[f] = null })
    nullableFields.forEach(f => { if (cleaned[f] === '' || cleaned[f] === undefined) cleaned[f] = null })

    const data = { organization_id: organization.id, ...cleaned }

    if (editingSeason) {
      const { error } = await supabase.from('seasons').update(data).eq('id', editingSeason.id)
      if (error) {
        console.error('Season update error:', error)
        showToast(`Error updating season: ${error.message}`, 'error')
        return
      }
      showToast('Season updated!', 'success')
      setShowModal(false)
      loadSeasons()
      refreshSeasons()
    } else {
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('Season creation error:', error)
        showToast(`Error creating season: ${error.message}`, 'error')
        return
      }

      showToast('Season created!', 'success')
      journey?.completeStep('create_season')
      setShowModal(false)
      loadSeasons()
      refreshSeasons(newSeason.id)
    }
  }

  async function handleDelete(season) {
    if (!confirm(`Delete "${season.name}"?`)) return
    await supabase.from('seasons').delete().eq('id', season.id)
    showToast('Season deleted', 'success')
    loadSeasons()
    refreshSeasons()
  }

  async function handleClone(season) {
    const newName = prompt('Name for the new season:', `${season.name} (Copy)`)
    if (!newName) return

    const cloneData = {
      organization_id: organization.id,
      name: newName,
      status: 'upcoming',
      sport_id: season.sport_id,
      program_id: season.program_id || null,
      start_date: null,
      end_date: null,
      fee_registration: season.fee_registration,
      fee_uniform: season.fee_uniform,
      fee_monthly: season.fee_monthly,
      months_in_season: season.months_in_season,
      registration_opens: null,
      registration_closes: null,
      early_bird_deadline: null,
      early_bird_discount: season.early_bird_discount,
      late_registration_deadline: null,
      late_registration_fee: season.late_registration_fee,
      capacity: season.capacity,
      waitlist_enabled: season.waitlist_enabled,
      waitlist_capacity: season.waitlist_capacity,
      description: season.description,
      registration_template_id: season.registration_template_id || null,
      registration_config: season.registration_config || null,
    }

    const { data: newSeason, error } = await supabase
      .from('seasons')
      .insert(cloneData)
      .select()
      .single()

    if (error) {
      showToast('Error cloning season', 'error')
      return
    }

    showToast(`"${newName}" created from "${season.name}"!`, 'success')
    loadSeasons()
    openEdit(newSeason)
  }

  // Compute stats for navy header
  const activeCount = seasons.filter(s => s.status === 'active').length
  const upcomingCount = seasons.filter(s => s.status === 'upcoming').length
  const archivedCount = seasons.filter(s => s.status === 'archived' || s.status === 'completed').length

  // Sport color map for left border
  const SPORT_COLORS = {
    volleyball: '#F59E0B',
    basketball: '#EF4444',
    soccer: '#22C55E',
    baseball: '#3B82F6',
    softball: '#EC4899',
    football: '#8B5CF6',
    lacrosse: '#14B8A6',
    hockey: '#06B6D4',
  }
  function getSportColor(season) {
    const sportName = season.sports?.name?.toLowerCase() || ''
    return SPORT_COLORS[sportName] || '#4BB9EC'
  }

  return (
    <PageShell
      title="Seasons"
      subtitle="Manage league seasons"
      breadcrumb="Setup > Seasons"
      actions={
        <button onClick={openNew} className="bg-[#10284C] text-white font-bold px-5 py-2.5 rounded-xl hover:brightness-110 flex items-center gap-2" style={{ fontFamily: 'var(--v2-font)' }}>
          <Plus className="w-4 h-4" /> New Season
        </button>
      }
    >
      {/* Navy Overview Header */}
      <div className="bg-[#10284C] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--v2-font)' }}>
              Season Management
            </h2>
            <p className="text-sm text-white/50">Create, manage, and track your seasons</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black italic text-[#4BB9EC]">{seasons.length}</span>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Seasons</div>
          </div>
        </div>
        <div className="flex gap-6 text-xs font-bold text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block" />
            {activeCount} Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4BB9EC] inline-block" />
            {upcomingCount} Upcoming
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
            {archivedCount} Archived
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : seasons.length === 0 ? (
        <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
          <Calendar className="w-16 h-16 mx-auto text-slate-400 mb-3" />
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>No seasons yet</h3>
          <p className={`text-sm mt-1 mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Create your first season to get started</p>
          <button onClick={openNew} className="bg-[#10284C] text-white font-bold px-6 py-2.5 rounded-xl hover:brightness-110">
            Create Season
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map(season => {
            const isRegOpen = season.status === 'active' ||
              (season.registration_opens && parseLocalDate(season.registration_opens) <= new Date() &&
               (!season.registration_closes || parseLocalDate(season.registration_closes) >= new Date()))
            const registrationBaseUrl = organization.settings?.registration_url || window.location.origin
            const regLink = `${registrationBaseUrl}/register/${organization.slug}/${season.id}`
            const sportColor = getSportColor(season)

            const statusBadge = season.status === 'active'
              ? { bg: 'bg-emerald-500/15', text: 'text-emerald-500', label: 'Active' }
              : season.status === 'upcoming'
              ? { bg: 'bg-[#4BB9EC]/15', text: 'text-[#4BB9EC]', label: 'Upcoming' }
              : { bg: isDark ? 'bg-white/[0.06]' : 'bg-slate-100', text: isDark ? 'text-slate-400' : 'text-slate-500', label: season.status || 'Draft' }

            return (
              <div key={season.id}
                className={`rounded-[14px] overflow-hidden transition-all hover:shadow-lg ${
                  isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'
                }`}
                style={{ borderLeftWidth: '4px', borderLeftColor: sportColor }}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {season.sports?.icon && <span className="text-lg">{season.sports.icon}</span>}
                        <h3 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
                          {season.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                        {isRegOpen && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                            Reg Open
                          </span>
                        )}
                      </div>
                    </div>
                    {season.sports?.name && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-[#F5F6F8] text-slate-500'}`}>
                        {season.sports.name}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 mb-4">
                    {season.start_date && (
                      <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{parseLocalDate(season.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {season.end_date ? parseLocalDate(season.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>${season.fee_registration || 0} registration{season.fee_uniform ? ` + $${season.fee_uniform} uniform` : ''}</span>
                    </div>
                    {season.capacity && (
                      <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Users className="w-3.5 h-3.5" />
                        <span>Capacity: {season.capacity} players</span>
                      </div>
                    )}
                    {season.registration_opens && (
                      <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Settings className="w-3.5 h-3.5" />
                        <span>Reg: {parseLocalDate(season.registration_opens).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {season.registration_closes ? parseLocalDate(season.registration_closes).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'} flex gap-2`}>
                    <button onClick={() => openEdit(season)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isDark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-white' : 'bg-[#F5F6F8] hover:bg-[#E8ECF2] text-[#10284C]'
                      }`}>
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleClone(season)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isDark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-400' : 'bg-[#F5F6F8] hover:bg-[#E8ECF2] text-slate-500'
                      }`} title="Clone">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => {
                      setShareSeason(season)
                      setShowShareModal(true)
                    }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isDark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-400' : 'bg-[#F5F6F8] hover:bg-[#E8ECF2] text-slate-500'
                      }`} title="Share">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(season)}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition bg-red-500/10 hover:bg-red-500/20 text-red-400" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SeasonFormModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingSeason={editingSeason}
        form={form}
        setForm={setForm}
        handleSave={handleSave}
        modalTab={modalTab}
        setModalTab={setModalTab}
        sports={sports}
        templates={templates}
        tc={tc}
        isDark={isDark}
        selectedProgram={selectedProgram}
      />

      <ShareHubModal
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        shareSeason={shareSeason}
        organization={organization}
        showToast={showToast}
        tc={tc}
        isDark={isDark}
      />
    </PageShell>
  )
}

export { SeasonsPage }
