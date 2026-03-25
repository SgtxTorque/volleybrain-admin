export default function V2ActionButton({ label, icon: Icon, onClick, variant = 'secondary', size = 'md', className = '' }) {
  const variants = {
    primary: 'bg-lynx-navy-subtle text-white hover:brightness-110 shadow-sm',
    sky: 'bg-[#4BB9EC] text-white hover:brightness-110 shadow-sm',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    secondary: 'bg-white text-[#10284C] border border-[#E8ECF2] hover:border-[#4BB9EC]/30 hover:shadow-sm',
    ghost: 'text-[#64748B] hover:text-[#10284C] hover:bg-[#F5F6F8]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center font-semibold transition-all duration-150 ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--v2-font)' }}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {label}
    </button>
  )
}
