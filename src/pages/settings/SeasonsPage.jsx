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

function SeasonsPage({ showToast }) {
  const journey = useJourney()
  const { organization } = useAuth()
  const { refreshSeasons } = useSeason()
  const { selectedSport, sports } = useSport()
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState(null)
  const [modalTab, setModalTab] = useState('basic') // 'basic', 'registration', 'fees'
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
    // Don't pre-select sport - let user explicitly choose
    setForm({ 
      name: '', 
      status: 'upcoming', 
      start_date: '', 
      end_date: '', 
      fee_registration: 150, 
      fee_uniform: 35, 
      fee_monthly: 50, 
      fee_per_family: 0,
      months_in_season: 3, 
      sibling_discount_type: 'none',
      sibling_discount_amount: 0,
      sibling_discount_apply_to: 'additional',
      sport_id: null,
      // Registration Settings
      registration_opens: '',
      registration_closes: '',
      early_bird_deadline: '',
      early_bird_discount: 25,
      late_registration_deadline: '',
      late_registration_fee: 25,
      capacity: null,
      waitlist_enabled: true,
      waitlist_capacity: 20,
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
      // Registration Settings
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
    }))
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
      // Insert and get the new season ID
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
      // Auto-select the newly created season
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
      start_date: null, // Clear dates for new season
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
    // Open edit modal for new season to set dates
    openEdit(newSeason)
  }

  const totalFee = (parseFloat(form.fee_registration) || 0) + (parseFloat(form.fee_uniform) || 0) + ((parseFloat(form.fee_monthly) || 0) * (parseInt(form.months_in_season) || 0))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Seasons</h1>
          <p className="text-slate-400 mt-1">Manage league seasons</p>
        </div>
        <button onClick={openNew} className="bg-[var(--accent-primary)] text-white font-semibold px-6 py-3 rounded-xl">➕ New Season</button>
      </div>

      {loading ? <div className="text-center py-12 text-slate-400">Loading...</div> :
        seasons.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16" />
            <h3 className="text-lg font-medium text-white mt-4">No seasons yet</h3>
            <button onClick={openNew} className="mt-4 bg-[var(--accent-primary)] text-white font-semibold px-6 py-2 rounded-xl">Create Season</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seasons.map(season => {
              const isRegOpen = season.status === 'active' || 
                (season.registration_opens && new Date(season.registration_opens) <= new Date() && 
                 (!season.registration_closes || new Date(season.registration_closes) >= new Date()))
              // Use configured registration URL or default to current origin
              const registrationBaseUrl = organization.settings?.registration_url || window.location.origin
              const regLink = `${registrationBaseUrl}/register/${organization.slug}/${season.id}`
              
              return (
                <div key={season.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {season.sports?.icon && <span className="text-xl">{season.sports.icon}</span>}
                        <h3 className="text-lg font-semibold text-white">{season.name}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${season.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : season.status === 'upcoming' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-gray-500/20 text-slate-400'}`}>
                          {season.status}
                        </span>
                        {isRegOpen && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                            📋 Registration Open
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleClone(season)} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400" title="Clone Season"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(season)} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(season)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {season.start_date && (
                      <p className="text-slate-400 flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(season.start_date).toLocaleDateString()} - {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'TBD'}</p>
                    )}
                    <p className="text-slate-400 flex items-center gap-1"><DollarSign className="w-4 h-4" /> ${season.fee_registration || 0} registration</p>
                    {season.capacity && (
                      <p className="text-slate-400">Capacity: {season.capacity} players</p>
                    )}
                  </div>
                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
                    <button 
                      onClick={() => {
                        setShareSeason(season)
                        setShowShareModal(true)
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium"
                    >
                      Share
                    </button>
                    <button 
                      onClick={() => window.open(regLink, '_blank')}
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--accent-primary)] hover:brightness-110 text-white text-xs font-medium"
                    >
                      👁️ Preview
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{editingSeason ? 'Edit Season' : 'Create Season'}</h2>
              <button onClick={() => { setShowModal(false); setModalTab('basic'); }} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              {[
                { id: 'basic', label: '📋 Basic Info' },
                { id: 'registration', label: '📅 Registration' },
                { id: 'fees', label: '💰 Fees & Pricing' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    modalTab === tab.id
                      ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-slate-900/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Basic Info Tab */}
              {modalTab === 'basic' && (
                <>
                  {/* Sport Selection */}
                  {sports && sports.length > 0 && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Sport <span className="text-red-400">*</span></label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                        {sports.map(sport => (
                          <button
                            key={sport.id}
                            type="button"
                            onClick={() => setForm({...form, sport_id: sport.id})}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              form.sport_id === sport.id
                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                : 'border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span className="text-xl">{sport.icon}</span>
                            <p className={`text-sm font-medium mt-1 ${form.sport_id === sport.id ? 'text-white' : 'text-slate-400'}`}>
                              {sport.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Season Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Spring 2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Description</label>
                    <textarea 
                      value={form.description} 
                      onChange={e => setForm({...form, description: e.target.value})} 
                      placeholder="Brief description shown on registration page..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Season Starts</label>
                      <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Season Ends</label>
                      <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active (Registration Open)</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </>
              )}

              {/* Registration Tab */}
              {modalTab === 'registration' && (
                <>
                  {/* Registration Form Template */}
                  <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">📋 Registration Form Template</label>
                    <select
                      value={form.registration_template_id || ''}
                      onChange={e => {
                        const templateId = e.target.value || null
                        const template = templates.find(t => t.id === templateId)
                        setForm({
                          ...form, 
                          registration_template_id: templateId,
                          registration_config: template ? {
                            player_fields: template.player_fields,
                            parent_fields: template.parent_fields,
                            emergency_fields: template.emergency_fields,
                            medical_fields: template.medical_fields,
                            waivers: template.waivers,
                            custom_questions: template.custom_questions
                          } : null
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                    >
                      <option value="">Use default form</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.sports?.icon || '📋'} {t.name} {t.is_default ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Select which registration form to use for this season. 
                      <a href="#" onClick={(e) => { e.preventDefault(); window.open('/templates', '_blank') }} className="text-[var(--accent-primary)] hover:underline ml-1">
                        Manage templates →
                      </a>
                    </p>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-300">
                      📅 Set when families can register. Leave dates blank to use season status instead.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Registration Opens</label>
                      <input 
                        type="date" 
                        value={form.registration_opens} 
                        onChange={e => setForm({...form, registration_opens: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Registration Closes</label>
                      <input 
                        type="date" 
                        value={form.registration_closes} 
                        onChange={e => setForm({...form, registration_closes: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <h4 className="text-white font-medium mb-3">🎯 Early Bird & Late Registration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Early Bird Deadline</label>
                        <input 
                          type="date" 
                          value={form.early_bird_deadline} 
                          onChange={e => setForm({...form, early_bird_deadline: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Early Bird Discount ($)</label>
                        <input 
                          type="number" 
                          value={form.early_bird_discount} 
                          onChange={e => setForm({...form, early_bird_discount: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Late Registration Starts</label>
                        <input 
                          type="date" 
                          value={form.late_registration_deadline} 
                          onChange={e => setForm({...form, late_registration_deadline: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Late Fee ($)</label>
                        <input 
                          type="number" 
                          value={form.late_registration_fee} 
                          onChange={e => setForm({...form, late_registration_fee: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <h4 className="text-white font-medium mb-3">Capacity</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Max Players</label>
                        <input 
                          type="number" 
                          value={form.capacity || ''} 
                          onChange={e => setForm({...form, capacity: e.target.value ? parseInt(e.target.value) : null})}
                          placeholder="Unlimited"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                        />
                        <p className="text-xs text-slate-500 mt-1">Leave blank for unlimited</p>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Waitlist Size</label>
                        <input 
                          type="number" 
                          value={form.waitlist_capacity} 
                          onChange={e => setForm({...form, waitlist_capacity: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-3 mt-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.waitlist_enabled} 
                        onChange={e => setForm({...form, waitlist_enabled: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-700"
                      />
                      <span className="text-slate-300">Enable waitlist when full</span>
                    </label>
                  </div>
                </>
              )}

              {/* Fees Tab */}
              {modalTab === 'fees' && (
                <>
                  <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-300">
                      💰 Set the fees for this season. Per-player fees are charged for each child. Per-family fees are charged once per family per season.
                    </p>
                  </div>
                  
                  {/* Per-Player Fees */}
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Per-Player Fees</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Registration Fee ($)</label>
                      <input 
                        type="number" 
                        value={form.fee_registration} 
                        onChange={e => setForm({...form, fee_registration: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Uniform Fee ($)</label>
                      <input 
                        type="number" 
                        value={form.fee_uniform} 
                        onChange={e => setForm({...form, fee_uniform: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Monthly Fee ($)</label>
                      <input 
                        type="number" 
                        value={form.fee_monthly} 
                        onChange={e => setForm({...form, fee_monthly: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Number of Months</label>
                      <input 
                        type="number" 
                        value={form.months_in_season} 
                        onChange={e => setForm({...form, months_in_season: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg" 
                      />
                    </div>
                  </div>
                  
                  {/* Per-Family Fee */}
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 mt-6">Per-Family Fee</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Family Registration Fee ($)</label>
                      <input 
                        type="number" 
                        value={form.fee_per_family} 
                        onChange={e => setForm({...form, fee_per_family: e.target.value})}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg" 
                      />
                      <p className="text-xs text-slate-500 mt-1">Charged once per family, regardless of # of kids</p>
                    </div>
                  </div>
                  
                  {/* Sibling Discount */}
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 mt-6">Sibling Discount</h4>
                  <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-300">
                      Family: Automatically discount fees when multiple kids from the same family register.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Discount Type</label>
                      <select 
                        value={form.sibling_discount_type} 
                        onChange={e => setForm({...form, sibling_discount_type: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                      >
                        <option value="none">No Discount</option>
                        <option value="flat">Flat Amount ($)</option>
                        <option value="percent">Percentage (%)</option>
                      </select>
                    </div>
                    {form.sibling_discount_type !== 'none' && (
                      <>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">
                            {form.sibling_discount_type === 'flat' ? 'Discount Amount ($)' : 'Discount Percent (%)'}
                          </label>
                          <input 
                            type="number" 
                            value={form.sibling_discount_amount} 
                            onChange={e => setForm({...form, sibling_discount_amount: e.target.value})}
                            placeholder={form.sibling_discount_type === 'flat' ? '25' : '10'}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Apply To</label>
                          <select 
                            value={form.sibling_discount_apply_to} 
                            onChange={e => setForm({...form, sibling_discount_apply_to: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                          >
                            <option value="additional">2nd Child & Beyond</option>
                            <option value="all">All Children</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  {form.sibling_discount_type !== 'none' && parseFloat(form.sibling_discount_amount) > 0 && (
                    <p className="text-xs text-emerald-400 mt-2">
                      ✓ {form.sibling_discount_apply_to === 'additional' ? '2nd child and beyond' : 'All children'} will receive{' '}
                      {form.sibling_discount_type === 'flat' 
                        ? `$${form.sibling_discount_amount} off` 
                        : `${form.sibling_discount_amount}% off`
                      } registration and monthly fees
                    </p>
                  )}
                  
                  {/* Fee Summary */}
                  <div className="bg-slate-900 rounded-xl p-5 mt-6">
                    <h4 className="text-slate-400 text-sm mb-3">Fee Summary (Per Player)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registration</span>
                        <span className="text-white">${parseFloat(form.fee_registration) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Uniform</span>
                        <span className="text-white">${parseFloat(form.fee_uniform) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Monthly × {form.months_in_season || 0}</span>
                        <span className="text-white">${(parseFloat(form.fee_monthly) || 0) * (parseInt(form.months_in_season) || 0)}</span>
                      </div>
                      {parseFloat(form.fee_per_family) > 0 && (
                        <div className="flex justify-between text-blue-400">
                          <span>+ Family Fee (once per family)</span>
                          <span>${parseFloat(form.fee_per_family) || 0}</span>
                        </div>
                      )}
                      {form.early_bird_discount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Early Bird Discount</span>
                          <span>-${form.early_bird_discount}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between">
                        <span className="text-white font-medium">Total Per Player (Regular)</span>
                        <span className="text-2xl font-bold text-[var(--accent-primary)]">${totalFee.toFixed(0)}</span>
                      </div>
                      {form.early_bird_discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-emerald-400 font-medium">Total Per Player (Early Bird)</span>
                          <span className="text-xl font-bold text-emerald-400">${(totalFee - (form.early_bird_discount || 0)).toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                    {/* Example calculation with sibling discount */}
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                      <p className="text-xs text-slate-500">
                        💡 <strong>Example - 1 Child:</strong>{' '}
                        <span className="text-white">
                          ${((totalFee - (form.early_bird_discount > 0 ? form.early_bird_discount : 0)) + (parseFloat(form.fee_per_family) || 0)).toFixed(0)}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        💡 <strong>Example - 2 Children:</strong>{' '}
                        {(() => {
                          const basePerPlayer = totalFee - (form.early_bird_discount > 0 ? form.early_bird_discount : 0)
                          const familyFee = parseFloat(form.fee_per_family) || 0
                          let child1 = basePerPlayer
                          let child2 = basePerPlayer
                          
                          if (form.sibling_discount_type !== 'none' && parseFloat(form.sibling_discount_amount) > 0) {
                            const discountAmount = parseFloat(form.sibling_discount_amount)
                            if (form.sibling_discount_apply_to === 'all') {
                              // Both get discount
                              if (form.sibling_discount_type === 'flat') {
                                child1 = Math.max(0, child1 - discountAmount)
                                child2 = Math.max(0, child2 - discountAmount)
                              } else {
                                child1 = child1 * (1 - discountAmount / 100)
                                child2 = child2 * (1 - discountAmount / 100)
                              }
                            } else {
                              // Only 2nd gets discount
                              if (form.sibling_discount_type === 'flat') {
                                child2 = Math.max(0, child2 - discountAmount)
                              } else {
                                child2 = child2 * (1 - discountAmount / 100)
                              }
                            }
                          }
                          const total = child1 + child2 + familyFee
                          const savings = (basePerPlayer * 2 + familyFee) - total
                          return (
                            <>
                              <span className="text-white">${total.toFixed(0)}</span>
                              {savings > 0 && (
                                <span className="text-emerald-400 ml-2">(saves ${savings.toFixed(0)})</span>
                              )}
                            </>
                          )
                        })()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-700 flex justify-between">
              <button onClick={() => { setShowModal(false); setModalTab('basic'); }} className="px-6 py-2 rounded-xl border border-slate-700 text-white">
                Cancel
              </button>
              <div className="flex gap-3">
                {modalTab !== 'basic' && (
                  <button 
                    onClick={() => setModalTab(modalTab === 'fees' ? 'registration' : 'basic')}
                    className="px-6 py-2 rounded-xl border border-slate-700 text-white"
                  >
                    ← Back
                  </button>
                )}
                {modalTab !== 'fees' ? (
                  <button 
                    onClick={() => setModalTab(modalTab === 'basic' ? 'registration' : 'fees')}
                    className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold"
                  >
                    Next →
                  </button>
                ) : (
                  <button 
                    onClick={handleSave} 
                    disabled={!form.name || (sports && sports.length > 0 && !form.sport_id)} 
                    className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50"
                  >
                    {editingSeason ? '💾 Save Changes' : '✨ Create Season'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Hub Modal */}
      {showShareModal && shareSeason && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Share Registration</h2>
                <p className="text-sm text-slate-400 mt-1">{shareSeason.name}</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Registration Link */}
              {(() => {
                const registrationBaseUrl = organization.settings?.registration_url || window.location.origin
                const shareLink = `${registrationBaseUrl}/register/${organization.slug}/${shareSeason.id}`
                const totalFee = (parseFloat(shareSeason.fee_registration) || 0) + (parseFloat(shareSeason.fee_uniform) || 0) + ((parseFloat(shareSeason.fee_monthly) || 0) * (parseInt(shareSeason.months_in_season) || 0))
                
                return (
                  <>
                    {/* Direct Link */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">📋 Registration Link</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={shareLink} 
                          readOnly 
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(shareLink)
                            showToast('Link copied!', 'success')
                          }}
                          className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-medium hover:brightness-110"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">📱 QR Code</label>
                      <div className="flex gap-4 items-start">
                        <div className="bg-white p-4 rounded-xl">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareLink)}`}
                            alt="QR Code"
                            className="w-36 h-36"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm text-slate-400">Scan to register! Perfect for flyers, posters, and social media.</p>
                          <button 
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareLink)}`
                              link.download = `${organization.name}-${shareSeason.name}-QR.png`
                              link.click()
                            }}
                            className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600"
                          >
                            ⬇️ Download QR Code
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Share Buttons */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">🚀 Quick Share</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button 
                          onClick={() => {
                            const text = `Register for ${organization.name} ${shareSeason.name}! ${shareLink}`
                            navigator.clipboard.writeText(text)
                            showToast('Text copied!', 'success')
                          }}
                          className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                        >
                          💬 Text
                        </button>
                        <button 
                          onClick={() => {
                            const text = encodeURIComponent(`Register for ${organization.name} ${shareSeason.name}!`)
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${text}`, '_blank', 'width=600,height=400')
                          }}
                          className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2"
                        >
                          📘 Facebook
                        </button>
                        <button 
                          onClick={() => {
                            const subject = encodeURIComponent(`Registration Open: ${organization.name} ${shareSeason.name}`)
                            const body = encodeURIComponent(`Hi!\n\nRegistration is now open for ${shareSeason.name}.\n\nRegister here: ${shareLink}\n\nFee: $${totalFee}\n\nSee you on the court!`)
                            window.location.href = `mailto:?subject=${subject}&body=${body}`
                          }}
                          className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                        >
                          ✉️ Email
                        </button>
                        <button 
                          onClick={() => window.open(shareLink, '_blank')}
                          className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                        >
                          👁️ Preview
                        </button>
                      </div>
                    </div>

                    {/* Email Template */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Email Template</label>
                      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                        <div className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
{`Subject: Registration Open - ${shareSeason.name}

Hi [Parent Name]!

Registration is now open for ${organization.name} ${shareSeason.name}!

📅 Season: ${shareSeason.start_date ? new Date(shareSeason.start_date).toLocaleDateString() : 'TBD'} - ${shareSeason.end_date ? new Date(shareSeason.end_date).toLocaleDateString() : 'TBD'}
💰 Fee: $${totalFee}
${shareSeason.early_bird_deadline ? `🎉 Early Bird Deadline: ${new Date(shareSeason.early_bird_deadline).toLocaleDateString()} (Save $${shareSeason.early_bird_discount || 0}!)` : ''}

Register now: ${shareLink}

Questions? Reply to this email.

See you on the court!
${organization.name}`}
                        </div>
                        <button 
                          onClick={() => {
                            const template = `Subject: Registration Open - ${shareSeason.name}\n\nHi [Parent Name]!\n\nRegistration is now open for ${organization.name} ${shareSeason.name}!\n\n📅 Season: ${shareSeason.start_date ? new Date(shareSeason.start_date).toLocaleDateString() : 'TBD'} - ${shareSeason.end_date ? new Date(shareSeason.end_date).toLocaleDateString() : 'TBD'}\n💰 Fee: $${totalFee}\n${shareSeason.early_bird_deadline ? `🎉 Early Bird Deadline: ${new Date(shareSeason.early_bird_deadline).toLocaleDateString()} (Save $${shareSeason.early_bird_discount || 0}!)` : ''}\n\nRegister now: ${shareLink}\n\nQuestions? Reply to this email.\n\nSee you on the court!\n${organization.name}`
                            navigator.clipboard.writeText(template)
                            showToast('Email template copied!', 'success')
                          }}
                          className="mt-3 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600"
                        >
                          📋 Copy Email Template
                        </button>
                      </div>
                    </div>

                    {/* Social Media Post */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">📱 Social Media Post</label>
                      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                        <div className="text-sm text-slate-300">
{`🏐 Registration is OPEN!

${shareSeason.name} is here! Join ${organization.name} for an amazing season.

✅ All skill levels welcome
✅ Expert coaching
✅ Fun team environment

Register now 👇
${shareLink}

${shareSeason.early_bird_deadline ? `⏰ Early bird pricing ends ${new Date(shareSeason.early_bird_deadline).toLocaleDateString()}!` : ''}

#youth${shareSeason.sports?.name || 'sports'} #${organization.name.replace(/\s+/g, '')} #registration`}
                        </div>
                        <button 
                          onClick={() => {
                            const post = `🏐 Registration is OPEN! 🏐\n\n${shareSeason.name} is here! Join ${organization.name} for an amazing season.\n\n✅ All skill levels welcome\n✅ Expert coaching\n✅ Fun team environment\n\nRegister now 👇\n${shareLink}\n\n${shareSeason.early_bird_deadline ? `⏰ Early bird pricing ends ${new Date(shareSeason.early_bird_deadline).toLocaleDateString()}!` : ''}\n\n#youth${shareSeason.sports?.name || 'sports'} #${organization.name.replace(/\s+/g, '')} #registration`
                            navigator.clipboard.writeText(post)
                            showToast('Social post copied!', 'success')
                          }}
                          className="mt-3 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600"
                        >
                          📋 Copy Social Post
                        </button>
                      </div>
                    </div>

                    {/* Flyer Info */}
                    <div className="bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent rounded-xl p-4 border border-[var(--accent-primary)]/30">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                          <p className="font-medium text-white">Pro Tip: Print a Flyer!</p>
                          <p className="text-sm text-slate-400 mt-1">Download the QR code and add it to a flyer. Parents can scan with their phone to register instantly!</p>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
            
            <div className="p-6 border-t border-slate-700 flex justify-end">
              <button 
                onClick={() => setShowShareModal(false)} 
                className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export { SeasonsPage }
