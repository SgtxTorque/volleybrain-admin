import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { ClipboardList, Check, DollarSign, Calendar } from '../../constants/icons'

export default function RegistrationAnalytics({ registrations, season, statusCounts, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (season?.id) loadPaymentData()
  }, [season?.id])

  async function loadPaymentData() {
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('season_id', season.id)
      setPayments(data || [])
    } catch (err) {
      console.error('Error loading payments:', err)
    }
    setLoading(false)
  }

  // Calculate metrics
  const totalRegistrations = registrations.length
  const approvalRate = totalRegistrations > 0
    ? ((statusCounts.approved + statusCounts.rostered) / totalRegistrations * 100).toFixed(1)
    : 0

  // Revenue metrics
  const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const collectedRevenue = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const outstandingRevenue = totalRevenue - collectedRevenue
  const collectionRate = totalRevenue > 0 ? (collectedRevenue / totalRevenue * 100).toFixed(1) : 0

  // Family metrics
  const uniqueFamilies = [...new Set(registrations.map(r => r.parent_email?.toLowerCase()).filter(Boolean))]
  const familyCount = uniqueFamilies.length
  const avgPlayersPerFamily = familyCount > 0 ? (totalRegistrations / familyCount).toFixed(1) : 0

  // Registration timeline - group by date
  const registrationsByDate = registrations.reduce((acc, r) => {
    const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Unknown'
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  // Get last 14 days of data
  const last14Days = []
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString()
    last14Days.push({
      date: dateStr,
      shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: registrationsByDate[dateStr] || 0
    })
  }

  const maxDailyRegs = Math.max(...last14Days.map(d => d.count), 1)

  // Grade distribution
  const gradeDistribution = registrations.reduce((acc, r) => {
    const grade = r.grade || 'Unknown'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {})

  // Gender distribution
  const genderDistribution = registrations.reduce((acc, r) => {
    const gender = r.gender || 'Unknown'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {})

  // Conversion funnel
  const funnel = [
    { stage: 'Submitted', count: totalRegistrations, color: 'bg-slate-500' },
    { stage: 'Pending Review', count: statusCounts.pending, color: 'bg-[var(--accent-primary)]' },
    { stage: 'Approved', count: statusCounts.approved, color: 'bg-blue-500' },
    { stage: 'On Roster', count: statusCounts.rostered, color: 'bg-emerald-500' },
  ]

  // Calculate capacity if available
  const capacity = season?.capacity || 0
  const capacityUsed = statusCounts.approved + statusCounts.rostered
  const capacityPercent = capacity > 0 ? (capacityUsed / capacity * 100).toFixed(0) : null

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-base ${tc.textMuted}`}>Total Registrations</p>
              <p className={`text-4xl font-bold ${tc.text}`}>{totalRegistrations}</p>
            </div>
            <ClipboardList className="w-8 h-8" />
          </div>
          <p className={`text-sm ${tc.textMuted} mt-2`}>{familyCount} families</p>
        </div>

        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-base ${tc.textMuted}`}>Approval Rate</p>
              <p className={`text-4xl font-bold text-emerald-400`}>{approvalRate}%</p>
            </div>
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <p className={`text-sm ${tc.textMuted} mt-2`}>{statusCounts.approved + statusCounts.rostered} approved</p>
        </div>

        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-base ${tc.textMuted}`}>Revenue</p>
              <p className={`text-4xl font-bold text-emerald-400`}>${collectedRevenue.toFixed(0)}</p>
            </div>
            <DollarSign className="w-10 h-10" />
          </div>
          <p className={`text-sm text-amber-400 mt-2`}>${outstandingRevenue.toFixed(0)} outstanding</p>
        </div>

        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-base ${tc.textMuted}`}>Collection Rate</p>
              <p className={`text-4xl font-bold ${parseFloat(collectionRate) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{collectionRate}%</p>
            </div>
            <span className="text-4xl">📈</span>
          </div>
          <p className={`text-sm ${tc.textMuted} mt-2`}>${totalRevenue.toFixed(0)} total due</p>
        </div>
      </div>

      {/* Capacity Bar (if capacity is set) */}
      {capacity > 0 && (
        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${tc.text}`}>Season Capacity</h3>
            <span className={`text-base ${capacityPercent >= 90 ? 'text-red-400' : capacityPercent >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {capacityUsed} / {capacity} spots filled
            </span>
          </div>
          <div className={`w-full h-4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-full overflow-hidden`}>
            <div
              className={`h-full transition-all ${capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${tc.textMuted}`}>
              {statusCounts.waitlist > 0 && `${statusCounts.waitlist} on waitlist`}
            </span>
            <span className={`text-sm ${tc.textMuted}`}>
              {capacity - capacityUsed > 0 ? `${capacity - capacityUsed} spots left` : 'Full!'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Timeline Chart */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
            <Calendar className="w-5 h-5" />Registration Timeline (Last 14 Days)
          </h3>
          <div className="flex items-end justify-between h-40 gap-1">
            {last14Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[24px] bg-[var(--accent-primary)] rounded-t transition-all hover:brightness-110"
                    style={{ height: `${(day.count / maxDailyRegs) * 100}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
                    title={`${day.date}: ${day.count} registrations`}
                  />
                </div>
                <p className={`text-sm ${tc.textMuted} mt-1 rotate-[-45deg] origin-top-left translate-y-2`}>
                  {day.shortDate}
                </p>
              </div>
            ))}
          </div>
          <div className={`mt-6 pt-2 border-t ${tc.border}`}>
            <p className={`text-base ${tc.textMuted}`}>
              Total in period: <span className={tc.text}>{last14Days.reduce((sum, d) => sum + d.count, 0)}</span>
              {' · '}Avg/day: <span className={tc.text}>{(last14Days.reduce((sum, d) => sum + d.count, 0) / 14).toFixed(1)}</span>
            </p>
          </div>
        </div>

        {/* Status Funnel */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <h3 className={`font-semibold ${tc.text} mb-4`}>🔄 Registration Funnel</h3>
          <div className="space-y-3">
            {funnel.map((stage, i) => {
              const percent = totalRegistrations > 0 ? (stage.count / totalRegistrations * 100) : 0
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-base ${tc.textSecondary}`}>{stage.stage}</span>
                    <span className={`text-base font-medium ${tc.text}`}>{stage.count}</span>
                  </div>
                  <div className={`w-full h-3 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                    <div
                      className={`h-full ${stage.color} transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {statusCounts.waitlist > 0 && (
            <div className={`mt-4 pt-4 border-t ${tc.border}`}>
              <div className="flex items-center justify-between">
                <span className={`text-base text-amber-400`}>⏳ Waitlist</span>
                <span className={`text-base font-medium text-amber-400`}>{statusCounts.waitlist}</span>
              </div>
            </div>
          )}
          {statusCounts.denied > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className={`text-base text-red-400`}>✗ Denied</span>
                <span className={`text-base font-medium text-red-400`}>{statusCounts.denied}</span>
              </div>
            </div>
          )}
        </div>

        {/* Grade Distribution */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <h3 className={`font-semibold ${tc.text} mb-4`}>🎓 Grade Distribution</h3>
          <div className="space-y-2">
            {Object.entries(gradeDistribution)
              .sort((a, b) => {
                const gradeOrder = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'Unknown']
                return gradeOrder.indexOf(a[0]) - gradeOrder.indexOf(b[0])
              })
              .map(([grade, count]) => {
                const percent = (count / totalRegistrations * 100)
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <span className={`w-20 text-base ${tc.textSecondary}`}>Grade {grade}</span>
                    <div className={`flex-1 h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded overflow-hidden`}>
                      <div
                        className="h-full bg-[var(--accent-primary)] flex items-center justify-end pr-2"
                        style={{ width: `${percent}%`, minWidth: count > 0 ? '30px' : '0' }}
                      >
                        <span className="text-sm text-white font-medium">{count}</span>
                      </div>
                    </div>
                    <span className={`w-12 text-sm ${tc.textMuted} text-right`}>{percent.toFixed(0)}%</span>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Gender & Family Stats */}
        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
          <h3 className={`font-semibold ${tc.text} mb-4`}>Demographics</h3>

          {/* Gender Pills */}
          <div className="flex gap-3 mb-6">
            {Object.entries(genderDistribution).map(([gender, count]) => {
              const percent = (count / totalRegistrations * 100).toFixed(0)
              const icon = gender.toLowerCase() === 'male' ? 'M' : gender.toLowerCase() === 'female' ? 'F' : 'O'
              const color = gender.toLowerCase() === 'male' ? 'bg-blue-500/20 text-blue-400' : gender.toLowerCase() === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-500/20 text-gray-400'
              return (
                <div key={gender} className={`flex-1 ${color} rounded-xl p-4 text-center`}>
                  <span className="text-3xl">{icon}</span>
                  <p className="text-3xl font-bold mt-1">{count}</p>
                  <p className="text-sm opacity-75">{gender} ({percent}%)</p>
                </div>
              )
            })}
          </div>

          {/* Family Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
              <p className={`text-4xl font-bold ${tc.text}`}>{familyCount}</p>
              <p className={`text-sm ${tc.textMuted}`}>Unique Families</p>
            </div>
            <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
              <p className={`text-4xl font-bold ${tc.text}`}>{avgPlayersPerFamily}</p>
              <p className={`text-sm ${tc.textMuted}`}>Avg Players/Family</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
        <h3 className={`font-semibold ${tc.text} mb-4`}>💵 Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <p className={`text-base ${tc.textMuted}`}>Total Expected</p>
            <p className={`text-3xl font-bold ${tc.text}`}>${totalRevenue.toFixed(2)}</p>
          </div>
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <p className={`text-base ${tc.textMuted}`}>Collected</p>
            <p className={`text-3xl font-bold text-emerald-400`}>${collectedRevenue.toFixed(2)}</p>
          </div>
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <p className={`text-base ${tc.textMuted}`}>Outstanding</p>
            <p className={`text-3xl font-bold text-amber-400`}>${outstandingRevenue.toFixed(2)}</p>
          </div>
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <p className={`text-base ${tc.textMuted}`}>Avg per Player</p>
            <p className={`text-3xl font-bold ${tc.text}`}>${totalRegistrations > 0 ? (totalRevenue / totalRegistrations).toFixed(2) : '0.00'}</p>
          </div>
        </div>

        {/* Fee Type Breakdown */}
        {payments.length > 0 && (
          <div className={`mt-4 pt-4 border-t ${tc.border}`}>
            <p className={`text-base ${tc.textMuted} mb-3`}>By Fee Type</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(
                payments.reduce((acc, p) => {
                  const type = p.fee_type || 'other'
                  if (!acc[type]) acc[type] = { total: 0, paid: 0 }
                  acc[type].total += parseFloat(p.amount) || 0
                  if (p.paid) acc[type].paid += parseFloat(p.amount) || 0
                  return acc
                }, {})
              ).map(([type, data]) => (
                <div key={type} className={`${tc.cardBg} border ${tc.border} rounded-lg px-4 py-2`}>
                  <p className={`text-base ${tc.textMuted} capitalize`}>{type}</p>
                  <p className={`font-medium ${tc.text}`}>${data.total.toFixed(0)}</p>
                  <p className="text-sm text-emerald-400">${data.paid.toFixed(0)} paid</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
