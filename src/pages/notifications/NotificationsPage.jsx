import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeason } from '../../contexts/SeasonContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell, Send, Clock, CheckCircle, XCircle, AlertTriangle, Users,
  RefreshCw, Settings, ChevronDown, ChevronRight, Eye, Trash2,
  Smartphone, Mail, Filter, Search, BarChart3, Zap, MessageSquare
} from 'lucide-react';
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext';
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

// =====================================================
// NOTIFICATIONS ADMIN PAGE
// =====================================================
// Admin can:
//   - View all sent/pending/failed notifications
//   - Send manual push notifications to users/teams/everyone
//   - Configure notification templates
//   - View delivery stats
//   - Manage notification preferences defaults
// =====================================================

export function NotificationsPage({ showToast }) {
  const tc = useThemeClasses();
  const { isDark } = useTheme();
  const { selectedSeason } = useSeason();
  const { profile, organization } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0, read: 0 });
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Load Data ----
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load notifications (last 100, scoped to organization)
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*, profiles:user_id(full_name, email)')
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      setNotifications(notifData || []);

      // Compute stats
      const all = notifData || [];
      setStats({
        total: all.length,
        sent: all.filter(n => n.push_status === 'sent').length,
        failed: all.filter(n => n.push_status === 'failed').length,
        pending: all.filter(n => n.push_status === 'pending').length,
        read: all.filter(n => n.is_read).length,
      });

      // Load templates (scoped to organization)
      const { data: tmplData } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('trigger_event');

      setTemplates(tmplData || []);

      // Load teams for send modal
      if (selectedSeason?.id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('id, name, color')
          .eq('season_id', selectedSeason.id);

        setTeams(teamData || []);
      }
    } catch (err) {
      console.error('Error loading notifications data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSeason]);

  useEffect(() => { loadData(); }, [loadData]);

  // ---- Filter notifications ----
  const filtered = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (filterStatus !== 'all' && n.push_status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.title?.toLowerCase().includes(q) ||
        n.body?.toLowerCase().includes(q) ||
        n.profiles?.full_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ---- Notification type config ----
  const typeConfig = {
    game_reminder: { icon: '🏐', label: 'Game Reminder', color: '#3B82F6' },
    payment_due: { icon: '💳', label: 'Payment Due', color: '#EF4444' },
    rsvp_reminder: { icon: '📋', label: 'RSVP Reminder', color: '#F59E0B' },
    announcement: { icon: '📢', label: 'Announcement', color: '#8B5CF6' },
    score_posted: { icon: '🏆', label: 'Score Posted', color: '#10B981' },
    badge_earned: { icon: '🎖️', label: 'Badge Earned', color: '#EC4899' },
    registration_approved: { icon: '✅', label: 'Registration', color: '#06B6D4' },
    team_assignment: { icon: '👕', label: 'Team Assignment', color: '#6366F1' },
    chat_message: { icon: '💬', label: 'Chat Message', color: '#14B8A6' },
    schedule_change: { icon: '📅', label: 'Schedule Change', color: '#4BB9EC' },
    general: { icon: '🔔', label: 'General', color: '#6B7280' },
  };

  const statusConfig = {
    pending: { icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    sent: { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    delivered: { icon: CheckCircle, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    failed: { icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    skipped: { icon: AlertTriangle, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  };

  // ---- Tabs ----
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'history', label: 'History', icon: Bell },
    { id: 'templates', label: 'Templates', icon: Settings },
  ];

  return (
    <PageShell
      title="Push Notifications"
      breadcrumb="Communication"
      subtitle="Manage and monitor push notifications for your organization"
      actions={
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-r-sm font-medium transition ${isDark ? 'bg-lynx-charcoal border border-white/[0.06] text-white hover:bg-white/[0.04]' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-r-sm font-bold bg-lynx-navy text-white hover:brightness-110 transition"
          >
            <Send size={16} />
            Send Notification
          </button>
        </div>
      }
    >
      <SeasonFilterBar />
      {/* Tabs */}
      <div className={`flex gap-1 rounded-xl p-1 border mb-6 w-fit ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-r-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-lynx-sky/20 text-lynx-sky'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && (
        <DashboardView stats={stats} notifications={notifications} typeConfig={typeConfig} statusConfig={statusConfig} />
      )}
      {activeTab === 'history' && (
        <HistoryView
          notifications={filtered}
          typeConfig={typeConfig}
          statusConfig={statusConfig}
          filterType={filterType}
          setFilterType={setFilterType}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}
      {activeTab === 'templates' && (
        <TemplatesView templates={templates} typeConfig={typeConfig} showToast={showToast} onRefresh={loadData} />
      )}

      {/* Send Modal */}
      {showSendModal && (
        <SendNotificationModal
          teams={teams}
          onClose={() => setShowSendModal(false)}
          showToast={showToast}
          onSent={loadData}
          selectedSeason={selectedSeason}
        />
      )}
    </PageShell>
  );
}

// =====================================================
// DASHBOARD VIEW
// =====================================================
function DashboardView({ stats, notifications, typeConfig, statusConfig }) {
  const tc = useThemeClasses();
  const { isDark } = useTheme();

  const readRate = stats.sent > 0 ? Math.round((stats.read / stats.sent) * 100) + '%' : '0%'

  // Type breakdown
  const typeCounts = {};
  notifications.forEach(n => {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <InnerStatRow stats={[
        { value: stats.sent, label: 'TOTAL SENT', icon: '📤', color: 'text-emerald-500' },
        { value: stats.pending, label: 'PENDING', icon: '⏳', color: 'text-amber-500' },
        { value: stats.failed, label: 'FAILED', icon: '❌', color: 'text-red-500' },
        { value: readRate, label: 'READ RATE', icon: '👁', color: 'text-blue-500' },
      ]} />

      {/* Type Breakdown */}
      <div className={`p-6 rounded-[14px] ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-r-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Notifications by Type
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
            const config = typeConfig[type] || typeConfig.general;
            return (
              <div key={type} className={`flex items-center gap-3 p-3 rounded-[14px] ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                <span className="text-xl">{config.icon}</span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{config.label}</div>
                  <div className={`text-r-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</div>
                </div>
              </div>
            );
          })}
        </div>
        {Object.keys(typeCounts).length === 0 && (
          <p className="text-r-sm text-center py-8 text-slate-400">No notifications sent yet. Use the "Send Notification" button to get started.</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className={`p-6 rounded-[14px] ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-r-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Recent Activity
        </h3>
        <div className="space-y-2">
          {notifications.slice(0, 10).map(n => {
            const tConfig = typeConfig[n.type] || typeConfig.general;
            const sConfig = statusConfig[n.push_status] || statusConfig.pending;
            const StatusIcon = sConfig.icon;
            return (
              <div key={n.id} className={`flex items-center gap-3 p-3 rounded-[14px] ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                <span className="text-lg">{tConfig.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-r-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.title}</div>
                  <div className="text-r-xs truncate text-slate-400">{n.profiles?.full_name || 'Unknown user'}</div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: sConfig.bg, color: sConfig.color }}>
                  <StatusIcon size={12} />
                  {n.push_status}
                </div>
                <span className="text-r-xs text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            );
          })}
          {notifications.length === 0 && (
            <p className="text-r-sm text-center py-8 text-slate-400">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// HISTORY VIEW
// =====================================================
function HistoryView({ notifications, typeConfig, statusConfig, filterType, setFilterType, filterStatus, setFilterStatus, searchQuery, setSearchQuery }) {
  const tc = useThemeClasses();
  const { isDark } = useTheme();
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
        >
          <option value="all">All Types</option>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
        >
          <option value="all">All Status</option>
          <option value="sent">Sent</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {notifications.map(n => {
          const tConfig = typeConfig[n.type] || typeConfig.general;
          const sConfig = statusConfig[n.push_status] || statusConfig.pending;
          const StatusIcon = sConfig.icon;
          const isExpanded = expandedId === n.id;

          return (
            <div
              key={n.id}
              className={`rounded-[14px] overflow-hidden transition-all ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}
            >
              <div
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
                onClick={() => setExpandedId(isExpanded ? null : n.id)}
              >
                <span className="text-lg">{tConfig.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-r-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.title}</div>
                  <div className="text-r-xs text-slate-400">{n.body?.substring(0, 80)}{n.body?.length > 80 ? '...' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: sConfig.bg, color: sConfig.color }}>
                    <StatusIcon size={12} />
                    {n.push_status}
                  </div>
                  <div className="text-r-xs mt-1 text-slate-400">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </div>

              {isExpanded && (
                <div className={`px-4 pb-4 pt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                  <div className="grid grid-cols-2 gap-4 text-r-sm">
                    <div>
                      <span className="text-r-xs block text-slate-400">Recipient</span>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{n.profiles?.full_name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-r-xs block text-slate-400">Type</span>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{tConfig.label}</span>
                    </div>
                    <div>
                      <span className="text-r-xs block text-slate-400">Full Body</span>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{n.body}</span>
                    </div>
                    <div>
                      <span className="text-r-xs block text-slate-400">Read</span>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{n.is_read ? `Yes (${new Date(n.read_at).toLocaleString()})` : 'No'}</span>
                    </div>
                    {n.push_error && (
                      <div className="col-span-2">
                        <span className="text-r-xs block text-slate-400">Error</span>
                        <span className="text-red-400">{n.push_error}</span>
                      </div>
                    )}
                    {n.data && Object.keys(n.data).length > 0 && (
                      <div className="col-span-2">
                        <span className="text-r-xs block text-slate-400">Data</span>
                        <code className="text-r-xs block mt-1 text-slate-400">{JSON.stringify(n.data, null, 2)}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <Bell size={24} className="text-slate-400" />
            </div>
            <p className={`text-r-sm mt-4 ${isDark ? 'text-white' : 'text-slate-900'} font-bold`}>No notifications match your filters</p>
            <p className="text-r-xs text-slate-400 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// TEMPLATES VIEW
// =====================================================
function TemplatesView({ templates, typeConfig, showToast, onRefresh }) {
  const tc = useThemeClasses();
  const { isDark } = useTheme();

  const toggleTemplate = async (id, currentActive) => {
    const { error } = await supabase
      .from('notification_templates')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      showToast?.('Failed to update template', 'error');
    } else {
      showToast?.(`Template ${!currentActive ? 'enabled' : 'disabled'}`, 'success');
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-r-sm text-slate-400">
        These templates control automatic notifications. Toggle them on/off to control what gets sent.
      </p>
      <div className="space-y-3">
        {templates.map(tmpl => {
          const config = typeConfig[tmpl.type] || typeConfig.general;
          return (
            <div
              key={tmpl.id}
              className={`flex items-center gap-4 p-4 rounded-[14px] ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}
              style={{ opacity: tmpl.is_active ? 1 : 0.5 }}
            >
              <span className="text-2xl">{config.icon}</span>
              <div className="flex-1">
                <div className={`text-r-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tmpl.name}</div>
                <div className="text-r-xs mt-1 text-slate-400">
                  <span className="font-medium">Title:</span> {tmpl.title_template}
                </div>
                <div className="text-r-xs text-slate-400">
                  <span className="font-medium">Body:</span> {tmpl.body_template}
                </div>
                <div className="text-r-xs mt-1 text-slate-400">
                  Trigger: <code className="text-lynx-sky">{tmpl.trigger_event}</code>
                </div>
              </div>
              <button
                onClick={() => toggleTemplate(tmpl.id, tmpl.is_active)}
                className={`relative w-12 h-6 rounded-full transition-colors ${tmpl.is_active ? 'bg-lynx-sky' : isDark ? 'bg-white/15' : 'bg-slate-300'}`}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ left: tmpl.is_active ? '26px' : '2px' }}
                />
              </button>
            </div>
          );
        })}
        {templates.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <Settings size={24} className="text-slate-400" />
            </div>
            <p className={`text-r-sm font-bold mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>No templates configured</p>
            <p className="text-r-xs text-slate-400 mt-1">Run the SQL migration to seed default templates.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// SEND NOTIFICATION MODAL
// =====================================================
function SendNotificationModal({ teams, onClose, showToast, onSent, selectedSeason }) {
  const tc = useThemeClasses();
  const { isDark } = useTheme();
  const [target, setTarget] = useState('team');    // 'team', 'all', 'user'
  const [selectedTeam, setSelectedTeam] = useState('');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('announcement');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      showToast?.('Title and body are required', 'error');
      return;
    }

    setSending(true);
    try {
      if (target === 'team' && selectedTeam) {
        // Queue for entire team
        const { data, error } = await supabase.rpc('queue_team_notification', {
          p_team_id: selectedTeam,
          p_title: title,
          p_body: body,
          p_type: type,
          p_data: { screen: 'team_wall', team_id: selectedTeam },
          p_org_id: null,
          p_season_id: selectedSeason?.id || null,
        });

        if (error) throw error;
        showToast?.(`Notification queued for ${data} team members`, 'success');
      } else if (target === 'all') {
        // Queue for all users in the org
        const { data: members, error: memErr } = await supabase
          .from('profiles')
          .select('id')
          .limit(500);

        if (memErr) throw memErr;

        let count = 0;
        for (const member of (members || [])) {
          await supabase.rpc('queue_notification', {
            p_user_id: member.id,
            p_title: title,
            p_body: body,
            p_type: type,
            p_data: { screen: 'notifications' },
          });
          count++;
        }
        showToast?.(`Notification queued for ${count} users`, 'success');
      } else if (target === 'user' && userId) {
        const { error } = await supabase.rpc('queue_notification', {
          p_user_id: userId,
          p_title: title,
          p_body: body,
          p_type: type,
          p_data: { screen: 'notifications' },
        });
        if (error) throw error;
        showToast?.('Notification queued', 'success');
      }

      onSent();
      onClose();
    } catch (err) {
      console.error('Send error:', err);
      showToast?.(`Failed to send: ${err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-[14px] overflow-hidden ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          <h2 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Send Push Notification
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Target */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">SEND TO</label>
            <div className="flex gap-2">
              {[
                { id: 'team', label: 'Team', icon: Users },
                { id: 'all', label: 'Everyone', icon: Zap },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTarget(opt.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-r-sm font-bold transition ${
                      target === opt.id
                        ? 'bg-lynx-sky/20 text-lynx-sky'
                        : `${isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:bg-slate-100'}`
                    }`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team selector */}
          {target === 'team' && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">SELECT TEAM</label>
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className={inputCls}>
                <option value="">Choose a team...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">TYPE</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="announcement">Announcement</option>
              <option value="game_reminder">Game Reminder</option>
              <option value="schedule_change">Schedule Change</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">TITLE</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title..." className={inputCls} />
          </div>

          {/* Body */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">MESSAGE</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notification message..." rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 border-t flex justify-end gap-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-lg text-r-sm font-medium border ${isDark ? 'border-white/[0.06] text-white hover:bg-white/[0.04]' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-r-sm font-bold bg-lynx-navy text-white hover:brightness-110 transition disabled:opacity-50"
          >
            <Send size={14} />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
