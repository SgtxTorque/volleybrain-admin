import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
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
  const { selectedSport, sports } = useSport()
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
    registration_config: null
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
      sport_id: null, registration_opens: '', registration_closes: '',
      early_bird_deadline: '', early_bird_discount: 25, late_registration_deadline: '',
      late_registration_fee: 25, capacity: null, waitlist_enabled: true, waitlist_capacity: 20,
      description: '',
      registration_template_id: null,
      registration_config: null,
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
    })
    setShowModal(true)
  }

  async function handleSave() {
    const data = { organization_id: organization.id, ...form }
    if (editingSeason) {
      await supabase.from('seasons').update(data).eq('id', editingSeason.id)
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
        showToast('Error creating season', 'error')
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

  return (
    <PageShell
      title="Seasons"
      subtitle="Manage league seasons"
      breadcrumb="Setup > Seasons"
      actions={
        <button onClick={openNew} className="bg-lynx-navy text-white font-bold px-5 py-2.5 rounded-lg hover:brightness-110 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Season
        </button>
      }
    >
      {loading ? (
        <div className={`text-center py-12 ${tc.textMuted}`}>Loading...</div>
      ) : seasons.length === 0 ? (
        <div className={`${tc.cardBg} border ${tc.border} rounded-[14px] p-12 text-center`}>
          <Calendar className="w-16 h-16 mx-auto text-slate-400" />
          <h3 className={`text-lg font-medium ${tc.text} mt-4`}>No seasons yet</h3>
          <button onClick={openNew} className="mt-4 bg-lynx-navy text-white font-bold px-6 py-2 rounded-lg hover:brightness-110">
            Create Season
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seasons.map(season => {
            const isRegOpen = season.status === 'active' ||
              (season.registration_opens && new Date(season.registration_opens) <= new Date() &&
               (!season.registration_closes || new Date(season.registration_closes) >= new Date()))
            const registrationBaseUrl = organization.settings?.registration_url || window.location.origin
            const regLink = `${registrationBaseUrl}/register/${organization.slug}/${season.id}`

            return (
              <div key={season.id} className={`${tc.cardBg} border ${tc.border} rounded-[14px] p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {season.sports?.icon && <span className="text-xl">{season.sports.icon}</span>}
                      <h3 className={`text-lg font-semibold ${tc.text}`}>{season.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${season.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : season.status === 'upcoming' ? 'bg-lynx-sky/20 text-lynx-sky' : 'bg-gray-500/20 text-slate-400'}`}>
                        {season.status}
                      </span>
                      {isRegOpen && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                          Registration Open
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleClone(season)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} ${tc.textMuted}`} title="Clone Season"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(season)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} ${tc.textMuted}`} title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(season)} className={`p-2 rounded-lg hover:bg-red-500/10 ${tc.textMuted} hover:text-red-400`} title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {season.start_date && (
                    <p className={`${tc.textMuted} flex items-center gap-1`}><Calendar className="w-4 h-4" /> {new Date(season.start_date).toLocaleDateString()} - {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'TBD'}</p>
                  )}
                  <p className={`${tc.textMuted} flex items-center gap-1`}><DollarSign className="w-4 h-4" /> ${season.fee_registration || 0} registration</p>
                  {season.capacity && (
                    <p className={tc.textMuted}>Capacity: {season.capacity} players</p>
                  )}
                </div>
                {/* Quick Actions */}
                <div className={`mt-4 pt-4 border-t ${tc.border} flex gap-2`}>
                  <button
                    onClick={() => {
                      setShareSeason(season)
                      setShowShareModal(true)
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} text-xs font-medium`}
                  >
                    Share
                  </button>
                  <button
                    onClick={() => window.open(regLink + '?preview=true', '_blank')}
                    className="flex-1 px-3 py-2 rounded-lg bg-lynx-navy hover:brightness-110 text-white text-xs font-medium"
                  >
                    Preview
                  </button>
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
