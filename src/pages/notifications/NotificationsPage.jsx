import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeason } from '../../contexts/SeasonContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell, Send, Clock, CheckCircle, XCircle, AlertTriangle, Users,
  RefreshCw, Settings, ChevronDown, ChevronRight, Eye, Trash2,
  Smartphone, Mail, Filter, Search, BarChart3, Zap, MessageSquare
} from 'lucide-react';

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
    schedule_change: { icon: '📅', label: 'Schedule Change', color: '#F97316' },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
            Push Notifications
          </h1>
          <p className="text-sm opacity-60 mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Manage and monitor push notifications for your organization
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-black transition-all hover:scale-105"
            style={{
              background: 'var(--accent-primary, #D4A017)',
              fontFamily: 'Rajdhani, sans-serif',
            }}
          >
            <Send size={16} />
            Send Notification
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--accent-primary, #D4A017)' : 'rgba(255,255,255,0.06)',
                color: activeTab === tab.id ? '#000' : 'inherit',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: activeTab === tab.id ? 700 : 500,
              }}
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
    </div>
  );
}

// =====================================================
// DASHBOARD VIEW
// =====================================================
function DashboardView({ stats, notifications, typeConfig, statusConfig }) {
  const statCards = [
    { label: 'Total Sent', value: stats.sent, icon: Send, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Read Rate', value: stats.sent > 0 ? Math.round((stats.read / stats.sent) * 100) + '%' : '—', icon: Eye, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  ];

  // Type breakdown
  const typeCounts = {};
  notifications.forEach(n => {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ background: card.bg }}>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
                <span className="text-xs font-medium opacity-50 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {card.label}
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Type Breakdown */}
      <div
        className="p-6 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
          Notifications by Type
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
            const config = typeConfig[type] || typeConfig.general;
            return (
              <div key={type} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xl">{config.icon}</span>
                <div>
                  <div className="text-xs opacity-50" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{config.label}</div>
                  <div className="text-lg font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{count}</div>
                </div>
              </div>
            );
          })}
        </div>
        {Object.keys(typeCounts).length === 0 && (
          <p className="text-sm opacity-40 text-center py-8">No notifications sent yet. Use the "Send Notification" button to get started.</p>
        )}
      </div>

      {/* Recent Activity */}
      <div
        className="p-6 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
          Recent Activity
        </h3>
        <div className="space-y-2">
          {notifications.slice(0, 10).map(n => {
            const tConfig = typeConfig[n.type] || typeConfig.general;
            const sConfig = statusConfig[n.push_status] || statusConfig.pending;
            const StatusIcon = sConfig.icon;
            return (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-lg">{tConfig.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-xs opacity-40 truncate">{n.profiles?.full_name || 'Unknown user'}</div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: sConfig.bg, color: sConfig.color }}>
                  <StatusIcon size={12} />
                  {n.push_status}
                </div>
                <span className="text-xs opacity-30">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            );
          })}
          {notifications.length === 0 && (
            <p className="text-sm opacity-40 text-center py-8">No notifications yet.</p>
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
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="all">All Types</option>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
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
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : n.id)}
              >
                <span className="text-lg">{tConfig.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs opacity-40">{n.body?.substring(0, 80)}{n.body?.length > 80 ? '...' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: sConfig.bg, color: sConfig.color }}>
                    <StatusIcon size={12} />
                    {n.push_status}
                  </div>
                  <div className="text-xs opacity-30 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {isExpanded ? <ChevronDown size={16} className="opacity-40" /> : <ChevronRight size={16} className="opacity-40" />}
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs opacity-40 block">Recipient</span>
                      <span>{n.profiles?.full_name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-xs opacity-40 block">Type</span>
                      <span>{tConfig.label}</span>
                    </div>
                    <div>
                      <span className="text-xs opacity-40 block">Full Body</span>
                      <span>{n.body}</span>
                    </div>
                    <div>
                      <span className="text-xs opacity-40 block">Read</span>
                      <span>{n.is_read ? `Yes (${new Date(n.read_at).toLocaleString()})` : 'No'}</span>
                    </div>
                    {n.push_error && (
                      <div className="col-span-2">
                        <span className="text-xs opacity-40 block">Error</span>
                        <span className="text-red-400">{n.push_error}</span>
                      </div>
                    )}
                    {n.data && Object.keys(n.data).length > 0 && (
                      <div className="col-span-2">
                        <span className="text-xs opacity-40 block">Data</span>
                        <code className="text-xs opacity-60 block mt-1">{JSON.stringify(n.data, null, 2)}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-12 opacity-40">
            <Bell size={48} className="mx-auto mb-3 opacity-30" />
            <p>No notifications match your filters.</p>
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
      <p className="text-sm opacity-50" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        These templates control automatic notifications. Toggle them on/off to control what gets sent.
      </p>
      <div className="space-y-3">
        {templates.map(tmpl => {
          const config = typeConfig[tmpl.type] || typeConfig.general;
          return (
            <div
              key={tmpl.id}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                opacity: tmpl.is_active ? 1 : 0.5,
              }}
            >
              <span className="text-2xl">{config.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-bold">{tmpl.name}</div>
                <div className="text-xs opacity-40 mt-1">
                  <span className="font-medium">Title:</span> {tmpl.title_template}
                </div>
                <div className="text-xs opacity-40">
                  <span className="font-medium">Body:</span> {tmpl.body_template}
                </div>
                <div className="text-xs opacity-30 mt-1">
                  Trigger: <code>{tmpl.trigger_event}</code>
                </div>
              </div>
              <button
                onClick={() => toggleTemplate(tmpl.id, tmpl.is_active)}
                className="relative w-12 h-6 rounded-full transition-colors"
                style={{
                  background: tmpl.is_active ? 'var(--accent-primary, #D4A017)' : 'rgba(255,255,255,0.15)',
                }}
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
          <div className="text-center py-12 opacity-40">
            <Settings size={48} className="mx-auto mb-3 opacity-30" />
            <p>No templates configured. Run the SQL migration to seed default templates.</p>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(30,30,40,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
            Send Push Notification
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Target */}
          <div>
            <label className="text-xs font-medium opacity-50 block mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>SEND TO</label>
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                    style={{
                      background: target === opt.id ? 'var(--accent-primary, #D4A017)' : 'rgba(255,255,255,0.06)',
                      color: target === opt.id ? '#000' : 'inherit',
                      fontWeight: target === opt.id ? 700 : 500,
                    }}
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
              <label className="text-xs font-medium opacity-50 block mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>SELECT TEAM</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="">Choose a team...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="text-xs font-medium opacity-50 block mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>TYPE</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="announcement">📢 Announcement</option>
              <option value="game_reminder">🏐 Game Reminder</option>
              <option value="schedule_change">📅 Schedule Change</option>
              <option value="general">🔔 General</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium opacity-50 block mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title..."
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium opacity-50 block mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>MESSAGE</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: 'var(--accent-primary, #D4A017)' }}
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
