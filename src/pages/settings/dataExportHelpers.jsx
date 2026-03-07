// =============================================================================
// Data Export Helpers -- utility functions and category definitions
// =============================================================================

import {
  Users, UserCog, DollarSign, Trophy, Star, CheckSquare, Calendar, Download,
} from '../../constants/icons'

export function escapeCSV(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCSV(headers, rows) {
  const headerLine = headers.map(h => escapeCSV(h)).join(',')
  const dataLines = rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
  return [headerLine, ...dataLines].join('\n')
}

export function buildJSON(data, exportType) {
  return JSON.stringify(
    { exportType, exportedAt: new Date().toISOString(), recordCount: data.length, data },
    null,
    2
  )
}

export function triggerDownload(content, filename, type) {
  const mimeType = type === 'json' ? 'application/json' : 'text/csv'
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtCurrency(v) {
  if (v === null || v === undefined) return ''
  return `$${Number(v).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ======= EXPORT CATEGORY DEFINITIONS =======

export const EXPORT_CATEGORIES = [
  {
    id: 'players',
    label: 'Player Roster',
    description:
      'All players with name, age, team, position, guardian info, registration status',
    icon: Users,
    color: '#3B82F6',
    table: 'players',
  },
  {
    id: 'coaches',
    label: 'Coach Directory',
    description: 'All coaches with name, email, phone, teams, certifications',
    icon: UserCog,
    color: '#8B5CF6',
    table: 'coaches',
  },
  {
    id: 'payments',
    label: 'Payment Records',
    description: 'All payments with date, amount, status, payer, type',
    icon: DollarSign,
    color: '#10B981',
    table: 'payments',
  },
  {
    id: 'seasons',
    label: 'Season History',
    description: 'All seasons with dates, teams, player counts',
    icon: Trophy,
    color: '#F59E0B',
    table: 'seasons',
  },
  {
    id: 'teams',
    label: 'Team Rosters',
    description: 'Per-team breakdown with players and staff',
    icon: Star,
    color: '#EC4899',
    table: 'teams',
  },
  {
    id: 'registrations',
    label: 'Registration Data',
    description: 'All registrations with status, dates, payment info',
    icon: CheckSquare,
    color: '#06B6D4',
    table: 'registrations',
  },
  {
    id: 'events',
    label: 'Schedule / Events',
    description: 'All events with dates, locations, teams, results',
    icon: Calendar,
    color: '#4BB9EC',
    table: 'schedule_events',
  },
  {
    id: 'full-backup',
    label: 'Full Org Backup',
    description: 'Everything above combined into one download',
    icon: Download,
    color: '#EF4444',
    table: null,
  },
]
