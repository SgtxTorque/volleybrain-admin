/**
 * Export data to CSV file and trigger download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Base filename (date will be appended)
 * @param {Array} columns - Array of { label, accessor } objects
 */
export function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  const headers = columns.map(c => c.label).join(',')
  const rows = data.map(row => 
    columns.map(c => {
      let value = c.accessor(row)
      if (value === null || value === undefined) value = ''
      // Escape commas and quotes
      value = String(value).replace(/"/g, '""')
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value}"`
      }
      return value
    }).join(',')
  )

  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Create CSV columns definition for common exports
 */
export const csvColumnSets = {
  players: [
    { label: 'First Name', accessor: p => p.first_name },
    { label: 'Last Name', accessor: p => p.last_name },
    { label: 'Email', accessor: p => p.parent_email },
    { label: 'Phone', accessor: p => p.parent_phone },
    { label: 'Birth Date', accessor: p => p.birth_date },
    { label: 'Gender', accessor: p => p.gender },
    { label: 'School', accessor: p => p.school },
    { label: 'Status', accessor: p => p.registrations?.[0]?.status || 'pending' },
    { label: 'Team', accessor: p => p.teams?.name || '' },
    { label: 'Jersey Number', accessor: p => p.jersey_number || '' },
  ],
  
  payments: [
    { label: 'Player', accessor: p => `${p.players?.first_name || ''} ${p.players?.last_name || ''}` },
    { label: 'Fee Type', accessor: p => p.fee_name || p.fee_type },
    { label: 'Amount', accessor: p => p.amount?.toFixed(2) },
    { label: 'Paid', accessor: p => p.paid ? 'Yes' : 'No' },
    { label: 'Method', accessor: p => p.payment_method || '' },
    { label: 'Date', accessor: p => p.payment_date || '' },
    { label: 'Verified By', accessor: p => p.verified_by || '' },
  ],
  
  attendance: [
    { label: 'Event', accessor: a => a.events?.name || '' },
    { label: 'Date', accessor: a => a.events?.event_date || '' },
    { label: 'Player', accessor: a => `${a.players?.first_name || ''} ${a.players?.last_name || ''}` },
    { label: 'Status', accessor: a => a.status },
    { label: 'RSVP', accessor: a => a.rsvp_status || '' },
  ],
}
