export default function EmailStatusBadge({ status }) {
  const styles = {
    delivered: 'bg-emerald-500/12 text-emerald-500',
    sent:      'bg-[#4BB9EC]/15 text-[#4BB9EC]',
    pending:   'bg-amber-500/12 text-amber-500',
    opened:    'bg-emerald-500/12 text-emerald-500',
    clicked:   'bg-emerald-500/12 text-emerald-500',
    bounced:   'bg-red-500/12 text-red-500',
    failed:    'bg-red-500/12 text-red-500',
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${styles[status] || styles.pending}`}>
      {status || 'pending'}
    </span>
  )
}
