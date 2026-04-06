// RegistrationCartPage — unified multi-program registration shopping cart
// 5-step flow: Programs → Children → Assign → Family Info → Review + Submit
// Reuses existing form components from RegistrationFormSteps.jsx and RegistrationScreens.jsx

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { calculateFeePerChild, DEFAULT_CONFIG } from './registrationConstants'
import { Check, ChevronRight, ShoppingCart, Users, GitBranch, FileText, CreditCard, AlertCircle, Loader2 } from 'lucide-react'

const CARD = 'bg-white rounded-2xl border border-[#E8ECF2] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'

// ─── Step Progress Indicator ──────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Programs', icon: ShoppingCart },
  { num: 2, label: 'Children', icon: Users },
  { num: 3, label: 'Assign', icon: GitBranch },
  { num: 4, label: 'Family Info', icon: FileText },
  { num: 5, label: 'Review', icon: CreditCard },
]

function StepProgress({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {STEPS.map((step, i) => {
        const isActive = step.num === currentStep
        const isComplete = step.num < currentStep
        const Icon = step.icon
        return (
          <div key={step.num} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive ? 'bg-white text-[#10284C] shadow-sm' :
              isComplete ? 'bg-white/20 text-white' :
              'text-white/40'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-[#10284C] text-white' :
                isComplete ? 'bg-white/30 text-white' :
                'bg-white/10 text-white/40'
              }`}>
                {isComplete ? <Check className="w-3 h-3" /> : step.num}
              </div>
              <span className={i < STEPS.length - 1 ? '' : ''}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${step.num < currentStep ? 'bg-white/40' : 'bg-white/15'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Program Card (selectable) ────────────────────────────────────────────
function ProgramCard({ program, season, isSelected, onToggle, accentColor }) {
  const sportIcon = program.sport?.icon || program.icon || '🏆'
  const sportColor = program.sport?.color_primary || accentColor
  const fee = calculateFeePerChild(season)
  const isFull = season._isFull && !season.waitlist_enabled
  const isWaitlist = season._isFull && season.waitlist_enabled
  const spotsLeft = season._spotsRemaining
  const closesIn = season.registration_closes ? Math.ceil((new Date(season.registration_closes) - new Date()) / (1000 * 60 * 60 * 24)) : null

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={onToggle}
      className={`${CARD} w-full text-left p-4 transition-all ${
        isFull ? 'opacity-50 cursor-not-allowed' :
        isSelected ? 'ring-2 ring-offset-1 bg-blue-50/50' :
        'hover:border-slate-300 hover:shadow-md cursor-pointer'
      }`}
      style={isSelected ? { ringColor: sportColor, borderColor: sportColor } : {}}
    >
      <div className="flex items-start gap-3">
        {/* Sport icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${sportColor}15` }}>
          {sportIcon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm truncate">{program.name}</h3>
            {isSelected && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: sportColor }}>
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{season.name}</p>
          {season.start_date && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              {new Date(season.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {season.end_date && ` – ${new Date(season.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
          )}
        </div>

        {/* Fee */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-slate-900">${fee.toFixed(0)}</p>
          <p className="text-[10px] text-slate-400">per player</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        {isFull && (
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide">Full</span>
        )}
        {isWaitlist && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide">Waitlist Available</span>
        )}
        {!isFull && !isWaitlist && spotsLeft != null && spotsLeft <= 10 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide">
            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
          </span>
        )}
        {closesIn != null && closesIn <= 7 && closesIn > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wide">
            Closes in {closesIn} day{closesIn !== 1 ? 's' : ''}!
          </span>
        )}
        {season.early_bird_deadline && new Date(season.early_bird_deadline) > new Date() && (
          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wide">
            Early Bird
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Multi-Season Selector (for programs with multiple open seasons) ──────
function MultiSeasonProgramCard({ program, seasons, selectedSeasonId, onSelectSeason, onDeselect, accentColor }) {
  const sportIcon = program.sport?.icon || program.icon || '🏆'
  const sportColor = program.sport?.color_primary || accentColor
  const isSelected = !!selectedSeasonId

  return (
    <div className={`${CARD} w-full text-left p-4 transition-all ${
      isSelected ? 'ring-2 ring-offset-1 bg-blue-50/50' : ''
    }`}
    style={isSelected ? { borderColor: sportColor } : {}}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${sportColor}15` }}>
          {sportIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">{program.name}</h3>
            {isSelected && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: sportColor }}>
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Choose a season:</p>
        </div>
      </div>
      <div className="space-y-2">
        {seasons.map(season => {
          const fee = calculateFeePerChild(season)
          const isFull = season._isFull && !season.waitlist_enabled
          const isThisSelected = selectedSeasonId === season.id
          return (
            <button
              key={season.id}
              type="button"
              disabled={isFull}
              onClick={() => isThisSelected ? onDeselect() : onSelectSeason(season)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                isFull ? 'opacity-50 cursor-not-allowed border-slate-200' :
                isThisSelected ? 'border-blue-300 bg-blue-50' :
                'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-800">{season.name}</p>
                {season.start_date && (
                  <p className="text-[10px] text-slate-400">
                    {new Date(season.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {season.end_date && ` – ${new Date(season.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700">${fee.toFixed(0)}</p>
                {isFull && <p className="text-[10px] text-red-500 font-bold">Full</p>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 1: Program Catalog ──────────────────────────────────────────────
function ProgramCatalogStep({ availablePrograms, selectedPrograms, setSelectedPrograms, accentColor, onContinue }) {
  function toggleProgram(program, season) {
    setSelectedPrograms(prev => {
      const exists = prev.find(sp => sp.programId === program.id && sp.seasonId === season.id)
      if (exists) return prev.filter(sp => !(sp.programId === program.id && sp.seasonId === season.id))
      return [...prev, { programId: program.id, seasonId: season.id, program, season }]
    })
  }

  function handleMultiSeasonSelect(program, season) {
    setSelectedPrograms(prev => {
      // Remove any existing selection for this program
      const filtered = prev.filter(sp => sp.programId !== program.id)
      return [...filtered, { programId: program.id, seasonId: season.id, program, season }]
    })
  }

  function handleMultiSeasonDeselect(programId) {
    setSelectedPrograms(prev => prev.filter(sp => sp.programId !== programId))
  }

  const runningTotal = selectedPrograms.reduce((sum, sp) => sum + calculateFeePerChild(sp.season), 0)

  return (
    <div>
      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-[#10284C]">Choose Programs</h2>
        <p className="text-sm text-slate-500 mt-1">Select the programs you'd like to register for. You can pick multiple!</p>
      </div>

      <div className="px-4 pb-32 max-w-2xl mx-auto space-y-3">
        {availablePrograms.length === 0 ? (
          <div className={`${CARD} p-8 text-center`}>
            <p className="text-slate-500 text-sm">No programs with open registration at this time.</p>
          </div>
        ) : (
          availablePrograms.map(program => (
            program.seasons.length === 1 ? (
              <ProgramCard
                key={program.id}
                program={program}
                season={program.seasons[0]}
                isSelected={selectedPrograms.some(sp => sp.programId === program.id)}
                onToggle={() => toggleProgram(program, program.seasons[0])}
                accentColor={accentColor}
              />
            ) : (
              <MultiSeasonProgramCard
                key={program.id}
                program={program}
                seasons={program.seasons}
                selectedSeasonId={selectedPrograms.find(sp => sp.programId === program.id)?.seasonId}
                onSelectSeason={(season) => handleMultiSeasonSelect(program, season)}
                onDeselect={() => handleMultiSeasonDeselect(program.id)}
                accentColor={accentColor}
              />
            )
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              {selectedPrograms.length === 0 ? 'No programs selected' :
               `${selectedPrograms.length} program${selectedPrograms.length > 1 ? 's' : ''} selected`}
            </p>
            {selectedPrograms.length > 0 && (
              <p className="text-sm font-bold text-[#10284C]">${runningTotal.toFixed(0)} per player</p>
            )}
          </div>
          <button
            type="button"
            disabled={selectedPrograms.length === 0}
            onClick={onContinue}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: selectedPrograms.length > 0 ? accentColor : '#94a3b8' }}
          >
            Continue — Add Children
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Cart Page ───────────────────────────────────────────────────────
export function RegistrationCartPage() {
  const { orgIdOrSlug } = useParams()

  // Step management
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Program catalog
  const [availablePrograms, setAvailablePrograms] = useState([])
  const [selectedPrograms, setSelectedPrograms] = useState([])

  // Step 2: Children (populated in Phase 2)
  const [children, setChildren] = useState([])
  const [currentChild, setCurrentChild] = useState({})
  const [editingChildIndex, setEditingChildIndex] = useState(null)
  const [showAddChildForm, setShowAddChildForm] = useState(true)

  // Step 3: Per-child program assignments (populated in Phase 3)
  const [childProgramMap, setChildProgramMap] = useState({})

  // Step 4: Family info + waivers (populated in Phase 4)
  const [sharedInfo, setSharedInfo] = useState({})
  const [waiverState, setWaiverState] = useState({})
  const [customAnswers, setCustomAnswers] = useState({})
  const [signature, setSignature] = useState('')

  // Step 5: Review + submit (populated in Phase 5)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [registrationIds, setRegistrationIds] = useState([])

  // App state
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ─── Accent color ────────────────────────────────────────────────────
  const orgSettings = organization?.settings || {}
  const orgBranding = orgSettings.branding || {}
  const accentColor = orgBranding.primary_color || orgSettings.primary_color || '#4BB9EC'
  const orgLogo = orgBranding.logo_url || orgSettings.logo_url || null

  // ─── Load org + programs with open registration ──────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Load organization
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdOrSlug)
        let orgQuery = supabase.from('organizations').select('*')
        orgQuery = isUUID ? orgQuery.eq('id', orgIdOrSlug) : orgQuery.eq('slug', orgIdOrSlug)
        const { data: orgData } = await orgQuery.single()

        if (!orgData) { setError('Organization not found'); setLoading(false); return }
        setOrganization(orgData)

        // 2. Load programs with sport info
        const { data: programs } = await supabase
          .from('programs')
          .select('*, sport:sports(id, name, icon, color_primary)')
          .eq('organization_id', orgData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        // 3. Load seasons with open registration
        const { data: seasons } = await supabase
          .from('seasons')
          .select('*, sports(name, icon), programs(id, name, icon)')
          .eq('organization_id', orgData.id)
          .eq('status', 'active')
          .order('start_date', { ascending: false })

        // 4. Filter to seasons within registration window
        const today = new Date().toISOString().split('T')[0]
        const openSeasons = (seasons || []).filter(s => {
          if (s.registration_opens && today < s.registration_opens) return false
          if (s.registration_closes && today > s.registration_closes) return false
          return true
        })

        // 5. Group seasons by program
        const programsWithSeasons = (programs || []).map(program => {
          const programSeasons = openSeasons.filter(s => s.program_id === program.id)
          return { ...program, seasons: programSeasons }
        }).filter(p => p.seasons.length > 0)

        // 6. Also include orphan seasons (not linked to a program) as standalone entries
        const linkedSeasonIds = new Set(programsWithSeasons.flatMap(p => p.seasons.map(s => s.id)))
        const orphanSeasons = openSeasons.filter(s => !linkedSeasonIds.has(s.id))
        const orphanPrograms = orphanSeasons.map(s => ({
          id: `orphan_${s.id}`,
          name: s.name,
          icon: s.sports?.icon || s.programs?.icon || '🏆',
          sport: s.sports ? { id: null, name: s.sports.name, icon: s.sports.icon } : null,
          seasons: [s],
          _isOrphan: true,
        }))

        const allPrograms = [...programsWithSeasons, ...orphanPrograms]

        // 7. Load capacity info for each season
        for (const program of allPrograms) {
          for (const season of program.seasons) {
            if (season.capacity) {
              const { count } = await supabase
                .from('registrations')
                .select('id', { count: 'exact', head: true })
                .eq('season_id', season.id)
                .not('status', 'eq', 'denied')
              season._spotsRemaining = season.capacity - (count || 0)
              season._isFull = season._spotsRemaining <= 0
            }
          }
        }

        setAvailablePrograms(allPrograms)
      } catch (err) {
        console.error('Failed to load registration data:', err)
        setError('Failed to load registration data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (orgIdOrSlug) loadData()
  }, [orgIdOrSlug])

  // ─── Loading / Error screens ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading registration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
        <div className={`${CARD} p-8 max-w-md text-center`}>
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Unable to Load</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Header bar */}
      <div className="sticky top-0 z-40" style={{ backgroundColor: accentColor }}>
        <div className="max-w-2xl mx-auto px-4">
          {/* Org branding */}
          <div className="flex items-center justify-center gap-3 pt-4 pb-2">
            {orgLogo && <img src={orgLogo} alt="" className="w-8 h-8 rounded-full object-cover bg-white" />}
            <h1 className="text-white font-bold text-base">{organization?.name || 'Registration'}</h1>
          </div>
          {/* Step progress */}
          <StepProgress currentStep={currentStep} />
        </div>
      </div>

      {/* Step content */}
      {currentStep === 1 && (
        <ProgramCatalogStep
          availablePrograms={availablePrograms}
          selectedPrograms={selectedPrograms}
          setSelectedPrograms={setSelectedPrograms}
          accentColor={accentColor}
          onContinue={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <div className="px-4 py-8 max-w-2xl mx-auto text-center text-slate-400 text-sm">
          Step 2: Add Children — coming in Phase 2
          <div className="mt-4 flex gap-3 justify-center">
            <button type="button" onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-white">
              Back
            </button>
          </div>
        </div>
      )}

      {currentStep >= 3 && currentStep <= 5 && (
        <div className="px-4 py-8 max-w-2xl mx-auto text-center text-slate-400 text-sm">
          Step {currentStep} — coming in later phases
        </div>
      )}
    </div>
  )
}

export default RegistrationCartPage
