// ═══════════════════════════════════════════════════════════
// Health Score Calculator — Composite org health + churn risk
// PA Command Center Phase 3.4
// ═══════════════════════════════════════════════════════════

export function calculateHealthScore(org, data) {
  const scores = {}
  const riskFactors = []

  // Activity Score (0-100): Recent activity signals
  const hasRecentEvents = (data.recentEventCount || 0) > 0
  const hasRecentChat = (data.recentChatCount || 0) > 0
  const hasRecentAttendance = (data.recentAttendanceCount || 0) > 0
  scores.activity = (hasRecentEvents ? 35 : 0) + (hasRecentChat ? 35 : 0) + (hasRecentAttendance ? 30 : 0)
  if (scores.activity < 30) riskFactors.push('no_recent_activity')

  // Payment Score (0-100): Subscription and payment health
  const hasActiveSub = data.subscriptionStatus === 'active'
  const hasFailedPayments = (data.failedPaymentCount || 0) > 0
  const isPastDue = data.subscriptionStatus === 'past_due'
  scores.payment = (hasActiveSub ? 50 : 0) + (!hasFailedPayments ? 30 : 0) + (!isPastDue ? 20 : 0)
  if (hasFailedPayments) riskFactors.push('payment_failures')
  if (isPastDue) riskFactors.push('past_due')

  // Engagement Score (0-100): Feature breadth
  const featuresUsed = data.featuresUsed || 0
  scores.engagement = Math.min(100, featuresUsed * 20) // 5 features = 100
  if (featuresUsed < 2) riskFactors.push('low_feature_adoption')

  // Growth Score (0-100): Player/team count trend
  const isGrowing = (data.playerCountThisMonth || 0) > (data.playerCountLastMonth || 0)
  const isStable = (data.playerCountThisMonth || 0) >= (data.playerCountLastMonth || 0)
  scores.growth = isGrowing ? 100 : (isStable ? 60 : 20)
  if (!isStable) riskFactors.push('declining_roster')

  // Setup Score (0-100): Onboarding milestones
  const milestonesComplete = data.milestonesComplete || 0
  scores.setup = Math.round((milestonesComplete / 7) * 100)
  if (milestonesComplete < 4) riskFactors.push('incomplete_setup')

  // Overall: weighted average
  scores.overall = Math.round(
    scores.activity * 0.25 +
    scores.payment * 0.25 +
    scores.engagement * 0.20 +
    scores.growth * 0.15 +
    scores.setup * 0.15
  )

  // Churn risk
  let churnRisk = 'low'
  if (scores.overall < 40) churnRisk = 'critical'
  else if (scores.overall < 60) churnRisk = 'high'
  else if (scores.overall < 80) churnRisk = 'medium'

  return {
    overall_score: scores.overall,
    activity_score: scores.activity,
    payment_score: scores.payment,
    engagement_score: scores.engagement,
    growth_score: scores.growth,
    setup_score: scores.setup,
    churn_risk: churnRisk,
    risk_factors: riskFactors,
  }
}

export const RISK_LABELS = {
  no_recent_activity: 'No Recent Activity',
  payment_failures: 'Payment Failures',
  past_due: 'Past Due',
  low_feature_adoption: 'Low Feature Adoption',
  declining_roster: 'Declining Roster',
  incomplete_setup: 'Incomplete Setup',
}

export const RISK_COLORS = {
  low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Low Risk' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Medium Risk' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'High Risk' },
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Critical Risk' },
}

export function getScoreColor(score) {
  if (score >= 80) return '#10B981'
  if (score >= 60) return '#EAB308'
  if (score >= 40) return '#F97316'
  return '#EF4444'
}
