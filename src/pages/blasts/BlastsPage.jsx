import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { sanitizeText } from '../../lib/validation'
import {
  Megaphone, DollarSign, Calendar, Clock, Users, Check, X, Plus, Mail
} from '../../constants/icons'
import { EmailService } from '../../lib/email-service'
import { buildLynxEmail, resolveOrgBranding } from '../../lib/email-html-builder'
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

function BlastsPage({ showToast, activeView, roleContext }) {
  const { organization, profile, user } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [blasts, setBlasts] = useState([])
  const [teams, setTeams] = useState([])
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [selectedBlast, setSelectedBlast] = useState(null)
  const [filterType, setFilterType] = useState('all')
  
  // Helper: get season IDs filtered by sport (for "All Seasons" + sport filter)
  function getSportSeasonIds() {
    if (!selectedSport?.id) return null
    return (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  }

  useEffect(() => {
    if (selectedSeason?.id) loadBlasts()
  }, [selectedSeason?.id, selectedSport?.id])

  const isCoach = activeView === 'coach'
  const isTeamManager = activeView === 'team_manager'
  const coachTeamIds = isCoach
    ? (roleContext?.coachInfo?.team_coaches || []).map(tc => tc.team_id).filter(Boolean)
    : isTeamManager
    ? (roleContext?.teamManagerInfo || []).map(ts => ts.team_id).filter(Boolean)
    : []

  async function loadBlasts() {
    setLoading(true)
    try {
      const sportIds = getSportSeasonIds()

      // Load teams (scoped to coach's teams if coach role)
      let teamsQuery = supabase.from('teams').select('*')
      if (!isAllSeasons(selectedSeason)) {
        teamsQuery = teamsQuery.eq('season_id', selectedSeason.id)
      } else if (sportIds && sportIds.length > 0) {
        teamsQuery = teamsQuery.in('season_id', sportIds)
      } else if (sportIds && sportIds.length === 0) {
        setTeams([])
        setBlasts([])
        setLoading(false)
        return
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setTeams([])
          setBlasts([])
          setLoading(false)
          return
        }
        teamsQuery = teamsQuery.in('season_id', orgSeasonIds)
      }
      if ((isCoach || isTeamManager) && coachTeamIds.length > 0) {
        teamsQuery = teamsQuery.in('id', coachTeamIds)
      }
      const { data: teamsData } = await teamsQuery
      setTeams(teamsData || [])

      // Load blasts/announcements
      let blastsQuery = supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (full_name),
          teams:target_team_id (name, color),
          message_recipients (id, acknowledged, acknowledged_at, recipient_name)
        `)
        .eq('organization_id', organization.id)
      if (!isAllSeasons(selectedSeason)) {
        blastsQuery = blastsQuery.eq('season_id', selectedSeason.id)
      } else if (sportIds && sportIds.length > 0) {
        blastsQuery = blastsQuery.in('season_id', sportIds)
      } else if (sportIds && sportIds.length === 0) {
        setBlasts([])
        setLoading(false)
        return
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setBlasts([])
          setLoading(false)
          return
        }
        blastsQuery = blastsQuery.in('season_id', orgSeasonIds)
      }
      const { data: blastsData } = await blastsQuery
        .order('created_at', { ascending: false })

      // If coach or TM, filter to only relevant blasts
      let relevantBlasts = blastsData || []
      if ((isCoach || isTeamManager) && coachTeamIds.length > 0) {
        relevantBlasts = relevantBlasts.filter(b =>
          b.target_type === 'all' ||
          coachTeamIds.includes(b.target_team_id) ||
          b.sender_id === user?.id
        )
      }

      // Calculate stats for each blast
      const blastsWithStats = relevantBlasts.map(blast => {
        const total = blast.message_recipients?.length || 0
        const acknowledged = blast.message_recipients?.filter(r => r.acknowledged).length || 0
        return {
          ...blast,
          total_recipients: total,
          acknowledged_count: acknowledged,
          read_percentage: total > 0 ? Math.round((acknowledged / total) * 100) : 0
        }
      })

      setBlasts(blastsWithStats)
    } catch (err) {
      console.error('Error loading blasts:', err)
      showToast?.('Error loading announcements', 'error')
    }
    setLoading(false)
  }
  
  const filteredBlasts = blasts.filter(b => {
    if (filterType === 'all') return true
    if (filterType === 'urgent') return b.priority === 'urgent'
    if (filterType === 'pending') return b.read_percentage < 100
    return b.message_type === filterType
  })
  
  const getTypeIcon = (type) => {
    switch(type) {
      case 'payment_reminder': return <DollarSign className="w-6 h-6" />
      case 'schedule_change': return <Calendar className="w-6 h-6" />
      case 'deadline': return <Clock className="w-6 h-6" />
      case 'announcement': return <Megaphone className="w-6 h-6" />
      default: return <Megaphone className="w-6 h-6" />
    }
  }
  
  const getTypeColor = (type) => {
    switch(type) {
      case 'payment_reminder': return 'bg-emerald-500/20 text-emerald-500'
      case 'schedule_change': return 'bg-blue-500/20 text-blue-500'
      case 'deadline': return 'bg-red-500/20 text-red-500'
      default: return 'bg-purple-500/20 text-purple-500'
    }
  }

  const avgReadRate = blasts.length > 0
    ? Math.round(blasts.reduce((sum, b) => sum + b.read_percentage, 0) / blasts.length)
    : 0

  return (
    <PageShell
      title="Announcements"
      breadcrumb="Communication"
      subtitle="Send messages to teams, parents, and track read receipts"
      actions={
        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lynx-navy-subtle text-white font-bold hover:brightness-110 transition text-sm"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      }
    >
      <SeasonFilterBar />
      {/* Stats */}
      <InnerStatRow stats={[
        { value: blasts.length, label: 'TOTAL SENT', icon: '📢' },
        { value: `${avgReadRate}%`, label: 'AVG READ RATE', icon: '📊', color: 'text-emerald-500' },
        { value: blasts.filter(b => b.read_percentage < 100).length, label: 'PENDING READS', icon: '👀', color: 'text-amber-500' },
        { value: blasts.filter(b => b.priority === 'urgent').length, label: 'URGENT', icon: '🚨', color: 'text-red-500' },
      ]} />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 mb-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'urgent', label: 'Urgent' },
          { id: 'pending', label: 'Pending Reads' },
          { id: 'payment_reminder', label: 'Payment' },
          { id: 'schedule_change', label: 'Schedule' },
          { id: 'announcement', label: 'General' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
              filterType === filter.id
                ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                : `text-slate-400 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#F5F6F8]'}`
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* Blasts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-lynx-sky border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-400 mt-4 text-r-sm">Loading announcements...</p>
        </div>
      ) : filteredBlasts.length === 0 ? (
        <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-12 text-center`}>
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
            <Megaphone className="w-7 h-7 text-purple-400" />
          </div>
          <h3 className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>No announcements yet</h3>
          <p className="text-slate-400 mt-1 text-sm">Send your first announcement to parents and teams</p>
          <button
            onClick={() => setShowComposeModal(true)}
            className="mt-4 px-6 py-3 rounded-xl bg-lynx-navy-subtle text-white font-bold hover:brightness-110 transition text-sm"
          >
            Create Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBlasts.map(blast => (
            <div
              key={blast.id}
              onClick={() => setSelectedBlast(blast)}
              className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:border-[#4BB9EC]/30' : 'bg-white border border-[#E8ECF2] hover:border-[#4BB9EC]/50'} rounded-[14px] p-4 cursor-pointer transition hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl ${getTypeColor(blast.message_type)}`}>
                  {getTypeIcon(blast.message_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-r-sm ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>{blast.title}</h3>
                    {blast.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500 text-white">URGENT</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getTypeColor(blast.message_type)}`}>
                      {blast.message_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className={`text-r-sm line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{blast.body}</p>
                  <div className="flex items-center gap-4 mt-2 text-r-xs text-slate-400">
                    <span>
                      {new Date(blast.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span>by {blast.profiles?.full_name}</span>
                    {blast.teams && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: (blast.teams.color || '#6366F1') + '30', color: blast.teams.color || '#6366F1' }}>
                        {blast.teams.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Read Progress */}
                <div className="text-right min-w-[100px]">
                  <div className={`text-r-2xl font-extrabold ${blast.read_percentage === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {blast.read_percentage}%
                  </div>
                  <p className="text-r-xs text-slate-400">
                    {blast.acknowledged_count}/{blast.total_recipients} read
                  </p>
                  <div className={`w-full h-2.5 rounded-full mt-2 overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'}`}>
                    <div
                      className={`h-full rounded-full transition-all ${blast.read_percentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${blast.read_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Compose Modal */}
      {showComposeModal && (
        <ComposeBlastModal
          teams={teams}
          isCoach={isCoach}
          onClose={() => setShowComposeModal(false)}
          onSent={() => { loadBlasts(); setShowComposeModal(false) }}
          showToast={showToast}
        />
      )}
      
      {/* Blast Detail Modal */}
      {selectedBlast && (
        <BlastDetailModal
          blast={selectedBlast}
          onClose={() => setSelectedBlast(null)}
          showToast={showToast}
        />
      )}
    </PageShell>
  )
}

// ============================================
// COMPOSE BLAST MODAL
// ============================================
function ComposeBlastModal({ teams, isCoach, onClose, onSent, showToast }) {
  const { user, profile, organization } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [form, setForm] = useState({
    title: '',
    body: '',
    richBody: '',
    message_type: 'announcement',
    priority: 'normal',
    target_type: isCoach ? 'team' : 'all',
    target_team_id: isCoach && teams.length === 1 ? teams[0].id : null
  })
  const [sending, setSending] = useState(false)
  const [recipientCount, setRecipientCount] = useState(0)

  // Email delivery state
  const [sendAsEmail, setSendAsEmail] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailCtaText, setEmailCtaText] = useState('')
  const [emailCtaUrl, setEmailCtaUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Lazy-load email components
  const [EmailComposer, setEmailComposer] = useState(null)
  const [EmailPreviewModal, setEmailPreviewModal] = useState(null)

  useEffect(() => {
    // Lazy load Tiptap composer
    import('../../components/email/EmailComposer').then(mod => setEmailComposer(() => mod.default))
    import('../../components/email/EmailPreviewModal').then(mod => setEmailPreviewModal(() => mod.default))
  }, [])

  // Calculate recipients when target changes
  useEffect(() => {
    calculateRecipients()
  }, [form.target_type, form.target_team_id])

  async function calculateRecipients() {
    try {
      let count = 0

      // Get org season IDs for scoping queries
      const orgSeasonIds = (allSeasons || []).map(s => s.id)

      if (form.target_type === 'all') {
        // All parents in the season(s)
        let query = supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
        if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
          query = query.eq('season_id', selectedSeason.id)
        } else if (orgSeasonIds.length > 0) {
          query = query.in('season_id', orgSeasonIds)
        }
        const { count: parentCount } = await query
        count = parentCount || 0
      } else if (form.target_type === 'team' && form.target_team_id) {
        // Parents of players on specific team
        const { count: teamCount } = await supabase
          .from('team_players')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', form.target_team_id)
        count = teamCount || 0
      } else if (form.target_type === 'coaches') {
        // Coaches in org — scope through teams in org seasons
        const { data: orgTeams } = await supabase
          .from('teams')
          .select('id')
          .in('season_id', orgSeasonIds.length > 0 ? orgSeasonIds : ['__none__'])
        const orgTeamIds = (orgTeams || []).map(t => t.id)
        if (orgTeamIds.length > 0) {
          const { count: coachCount } = await supabase
            .from('team_coaches')
            .select('*', { count: 'exact', head: true })
            .in('team_id', orgTeamIds)
          count = coachCount || 0
        }
      }

      setRecipientCount(count)
    } catch (err) {
      console.log('Error calculating recipients:', err)
    }
  }

  function getPreviewHtml() {
    const branding = resolveOrgBranding(organization)
    return buildLynxEmail({
      ...branding,
      heading: form.title,
      body: form.richBody || `<p>${form.body}</p>`,
      ctaText: emailCtaText || null,
      ctaUrl: emailCtaUrl || null,
      showUnsubscribe: branding.includeUnsubscribe,
      unsubscribeUrl: '#unsubscribe',
    })
  }

  async function handleSend() {
    const cleanTitle = sanitizeText(form.title)
    // For plain-text blast body, use sanitized form.body. For rich text, use richBody as-is (HTML).
    const plainBody = sanitizeText(form.body)
    const hasContent = cleanTitle && (plainBody || form.richBody)
    if (!hasContent) {
      showToast?.('Please fill in all fields', 'error')
      return
    }
    if (cleanTitle.length > 200) {
      showToast?.('Title must be 200 characters or less', 'error')
      return
    }

    setSending(true)
    try {
      // Create the message/blast
      const insertData = {
        sender_id: user?.id,
        title: cleanTitle,
        body: plainBody || form.richBody?.replace(/<[^>]+>/g, ' ').trim() || '',
        message_type: form.message_type,
        priority: form.priority,
        target_type: form.target_type,
        target_team_id: form.target_team_id
      }
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        insertData.season_id = selectedSeason.id
      }
      const { data: blast, error } = await supabase
        .from('messages')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      // Get recipients based on target
      let recipients = []
      let playersList = []

      if (form.target_type === 'all' || form.target_type === 'parents') {
        let playersQuery = supabase
          .from('players')
          .select('id, first_name, last_name, parent_name, parent_email')
        if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
          playersQuery = playersQuery.eq('season_id', selectedSeason.id)
        }
        const { data: players } = await playersQuery
        playersList = players || []
      } else if (form.target_type === 'team' && form.target_team_id) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('players(id, first_name, last_name, parent_name, parent_email)')
          .eq('team_id', form.target_team_id)
        playersList = (teamPlayers || []).map(tp => tp.players).filter(Boolean)
      }

      // Resolve profile_id for each parent by matching email to profiles table
      const parentEmails = [...new Set(playersList.map(p => p.parent_email).filter(Boolean))]
      let emailToProfileId = {}
      if (parentEmails.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', parentEmails)
        ;(profiles || []).forEach(p => { emailToProfileId[p.email?.toLowerCase()] = p.id })
      }

      recipients = playersList.map(p => ({
        message_id: blast.id,
        recipient_type: 'parent',
        recipient_id: p.id,
        recipient_name: p.parent_name || `${p.first_name} ${p.last_name}'s Parent`,
        recipient_email: p.parent_email,
        profile_id: emailToProfileId[p.parent_email?.toLowerCase()] || null,
      })).filter(r => r.recipient_id)

      // Insert recipients
      if (recipients.length > 0) {
        await supabase.from('message_recipients').insert(recipients)
      }

      // Queue emails if toggle is on
      let emailCount = 0
      if (sendAsEmail) {
        const batchId = crypto.randomUUID()
        // Get unsubscribed emails
        const { data: unsubs } = await supabase
          .from('email_unsubscribes')
          .select('email')
          .eq('organization_id', organization.id)
        const unsubSet = new Set((unsubs || []).map(u => u.email?.toLowerCase()))

        const emailBody = form.richBody || `<p>${plainBody}</p>`
        for (const r of recipients) {
          if (!r.recipient_email || unsubSet.has(r.recipient_email.toLowerCase())) continue
          await EmailService.sendBlastEmail({
            recipientEmail: r.recipient_email,
            recipientName: r.recipient_name,
            recipientUserId: r.profile_id,
            subject: emailSubject || cleanTitle,
            heading: cleanTitle,
            body: emailBody,
            ctaText: emailCtaText || null,
            ctaUrl: emailCtaUrl || null,
            organizationId: organization.id,
            organizationName: organization.email_sender_name || organization.name,
            sentBy: user.id,
            sentByRole: isCoach ? 'coach' : 'admin',
            blastMessageId: blast.id,
            broadcastBatchId: batchId,
            audienceType: form.target_type,
            audienceTargetId: form.target_type === 'team' ? form.target_team_id : null,
          })
          emailCount++
        }
      }

      const emailMsg = emailCount > 0 ? ` ${emailCount} emails queued.` : ''
      showToast?.(`Announcement sent to ${recipients.length} recipients!${emailMsg}`, 'success')
      onSent?.()
    } catch (err) {
      console.error('Error sending blast:', err)
      showToast?.('Error sending announcement', 'error')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${isDark ? 'bg-[#0B1D35] border border-white/[0.08]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] w-full max-w-xl max-h-[90vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>📢 New Announcement</h2>
          <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/[0.06] text-white' : 'hover:bg-[#F5F6F8] text-[#10284C]'}`}>✕</button>
        </div>
        
        {/* Form */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Important announcement..."
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400'} border focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 outline-none transition`}
            />
          </div>

          {/* Body — Tiptap rich text or plain textarea fallback */}
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Message</label>
            {EmailComposer ? (
              <EmailComposer
                content={form.richBody}
                onChange={(html) => setForm(prev => ({ ...prev, richBody: html, body: html.replace(/<[^>]+>/g, ' ').trim() }))}
                placeholder="Write your message here..."
                minHeight={120}
              />
            ) : (
              <textarea
                value={form.body}
                onChange={e => setForm({...form, body: e.target.value})}
                placeholder="Write your message here..."
                rows={4}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400'} border focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 outline-none transition resize-none`}
              />
            )}
          </div>
          
          {/* Type */}
          <div>
            <label className={`block text-sm font-medium ${tc.textSecondary} mb-1`}>Type</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'announcement', label: '📢 General', color: 'purple' },
                { id: 'payment_reminder', label: '💰 Payment', color: 'emerald' },
                { id: 'schedule_change', label: '📅 Schedule', color: 'blue' },
                { id: 'deadline', label: '⏰ Deadline', color: 'red' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setForm({...form, message_type: type.id})}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    form.message_type === type.id
                      ? `bg-${type.color}-500 text-white`
                      : `${tc.cardBgAlt} ${tc.text}`
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Priority */}
          <div>
            <label className={`block text-sm font-medium ${tc.textSecondary} mb-1`}>Priority</label>
            <div className="flex gap-2">
              <button
                onClick={() => setForm({...form, priority: 'normal'})}
                className={`px-4 py-2 rounded-xl font-medium transition ${
                  form.priority === 'normal'
                    ? 'bg-slate-600 text-white'
                    : `${tc.cardBgAlt} ${tc.text}`
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setForm({...form, priority: 'urgent'})}
                className={`px-4 py-2 rounded-xl font-medium transition ${
                  form.priority === 'urgent'
                    ? 'bg-red-500 text-white'
                    : `${tc.cardBgAlt} ${tc.text}`
                }`}
              >
                🚨 Urgent
              </button>
            </div>
          </div>
          
          {/* Target Audience */}
          <div>
            <label className={`block text-sm font-medium ${tc.textSecondary} mb-1`}>Send To</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {!isCoach && (
                <button
                  onClick={() => setForm({...form, target_type: 'all', target_team_id: null})}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    form.target_type === 'all'
                      ? 'bg-[var(--accent-primary)] text-white'
                      : `${tc.cardBgAlt} ${tc.text}`
                  }`}
                >
                  🌐 Everyone
                </button>
              )}
              <button
                onClick={() => setForm({...form, target_type: 'team'})}
                className={`px-4 py-2 rounded-xl font-medium transition ${
                  form.target_type === 'team'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : `${tc.cardBgAlt} ${tc.text}`
                }`}
              >
                👥 {isCoach ? 'My Team' : 'Specific Team'}
              </button>
            </div>
            
            {form.target_type === 'team' && (
              <select
                value={form.target_team_id || ''}
                onChange={e => setForm({...form, target_team_id: e.target.value || null})}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 outline-none transition`}
              >
                <option value="">Select a team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            )}
          </div>
          
          {/* Email Delivery Toggle */}
          <div className={`rounded-xl border ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-[#E8ECF2] bg-[#FAFBFC]'} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#4BB9EC]" />
                <span className={`text-sm font-bold ${tc.text}`}>Also send as email</span>
              </div>
              <button
                onClick={() => setSendAsEmail(!sendAsEmail)}
                className={`w-11 h-6 rounded-full transition-colors ${sendAsEmail ? 'bg-[#4BB9EC]' : isDark ? 'bg-white/[0.08]' : 'bg-slate-300'}`}
                type="button"
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow ${sendAsEmail ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {sendAsEmail && (
              <div className="space-y-3 mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E8ECF2'}` }}>
                <div>
                  <label className={`block text-xs font-bold ${tc.textMuted} mb-1`}>Email Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder={form.title || 'Same as title'}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'} border outline-none focus:border-[#4BB9EC]`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs font-bold ${tc.textMuted} mb-1`}>CTA Button Text</label>
                    <input
                      type="text"
                      value={emailCtaText}
                      onChange={e => setEmailCtaText(e.target.value)}
                      placeholder="Open Lynx"
                      className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'} border outline-none focus:border-[#4BB9EC]`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold ${tc.textMuted} mb-1`}>CTA Button URL</label>
                    <input
                      type="url"
                      value={emailCtaUrl}
                      onChange={e => setEmailCtaUrl(e.target.value)}
                      placeholder="https://..."
                      className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'} border outline-none focus:border-[#4BB9EC]`}
                    />
                  </div>
                </div>
                <p className={`text-xs ${tc.textMuted}`}>
                  Email will be sent to {recipientCount} recipients (unsubscribed will be skipped)
                </p>
              </div>
            )}
          </div>

          {/* Recipient Preview */}
          <div className={`${tc.cardBgAlt} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${tc.text}`}>{recipientCount}</p>
            <p className={`text-sm ${tc.textMuted}`}>recipients will receive this message</p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'} flex gap-3`}>
          {sendAsEmail && (
            <button
              onClick={() => setShowPreview(true)}
              className={`py-3 px-4 rounded-xl border ${isDark ? 'border-white/[0.08] text-[#4BB9EC]' : 'border-[#E8ECF2] text-[#4BB9EC]'} font-bold text-sm`}
              type="button"
            >
              Preview
            </button>
          )}
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl border ${isDark ? 'border-white/[0.08] text-white' : 'border-[#E8ECF2] text-[#10284C]'} font-bold`}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !form.title.trim() || (!form.body.trim() && !form.richBody)}
            className="flex-1 py-3 rounded-xl bg-lynx-navy-subtle text-white font-bold hover:brightness-110 transition disabled:opacity-50"
          >
            {sending ? 'Sending...' : `Send to ${recipientCount} Recipients`}
          </button>
        </div>

        {/* Email Preview Modal */}
        {showPreview && EmailPreviewModal && (
          <EmailPreviewModal html={getPreviewHtml()} onClose={() => setShowPreview(false)} />
        )}
      </div>
    </div>
  )
}

// ============================================
// BLAST DETAIL MODAL - View recipients & read status
// ============================================
function BlastDetailModal({ blast, onClose, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [filterStatus, setFilterStatus] = useState('all')
  
  const recipients = blast.message_recipients || []
  const filteredRecipients = recipients.filter(r => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'read') return r.acknowledged
    return !r.acknowledged
  })

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${isDark ? 'bg-[#0B1D35] border border-white/[0.08]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>{blast.title}</h2>
            <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/[0.06] text-white' : 'hover:bg-[#F5F6F8] text-[#10284C]'}`}>✕</button>
          </div>
          <p className={`${tc.textSecondary} text-sm`}>{blast.body}</p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className={tc.textMuted}>
              Sent {new Date(blast.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
            <span className={tc.textMuted}>by {blast.profiles?.full_name}</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className={`p-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'} flex gap-4`}>
          <div className="flex-1 text-center">
            <p className="text-3xl font-bold text-emerald-500">{blast.acknowledged_count}</p>
            <p className={`text-xs ${tc.textMuted}`}>Read</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-3xl font-bold text-amber-500">{blast.total_recipients - blast.acknowledged_count}</p>
            <p className={`text-xs ${tc.textMuted}`}>Unread</p>
          </div>
          <div className="flex-1 text-center">
            <p className={`text-3xl font-bold ${blast.read_percentage === 100 ? 'text-emerald-500' : tc.text}`}>
              {blast.read_percentage}%
            </p>
            <p className={`text-xs ${tc.textMuted}`}>Rate</p>
          </div>
        </div>
        
        {/* Filter */}
        <div className={`p-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'} flex gap-2`}>
          {['all', 'read', 'unread'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                filterStatus === status
                  ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                  : `${isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:bg-[#F5F6F8]'}`
              }`}
              style={{ fontFamily: 'var(--v2-font)' }}
            >
              {status === 'all' ? 'All' : status === 'read' ? '✓ Read' : '○ Unread'}
              <span className="ml-1 text-xs opacity-70">
                ({status === 'all' ? recipients.length : status === 'read' ? blast.acknowledged_count : blast.total_recipients - blast.acknowledged_count})
              </span>
            </button>
          ))}
        </div>
        
        {/* Recipients List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRecipients.length === 0 ? (
            <p className={`text-center ${tc.textMuted} py-8`}>No recipients in this category</p>
          ) : (
            <div className="space-y-2">
              {filteredRecipients.map(recipient => (
                <div 
                  key={recipient.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${tc.cardBgAlt}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      recipient.acknowledged ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-600 text-slate-400'
                    }`}>
                      {recipient.acknowledged ? <Check className="w-4 h-4" /> : '○'}
                    </div>
                    <div>
                      <p className={`font-medium ${tc.text}`}>{recipient.recipient_name || 'Unknown'}</p>
                      {recipient.acknowledged_at && (
                        <p className={`text-xs ${tc.textMuted}`}>
                          Read {new Date(recipient.acknowledged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  {recipient.acknowledged ? (
                    <span className="text-emerald-500 text-sm font-medium">✓ Read</span>
                  ) : (
                    <span className={`${tc.textMuted} text-sm`}>Pending</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl border ${isDark ? 'border-white/[0.08] text-white' : 'border-[#E8ECF2] text-[#10284C]'} font-bold`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}


export { BlastsPage }
