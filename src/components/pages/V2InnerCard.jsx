import { useTheme } from '../../contexts/ThemeContext'

export default function V2InnerCard({ children, className = '', padding = true, onClick }) {
  const { isDark } = useTheme()

  return (
    <div
      onClick={onClick}
      className={`rounded-[14px] overflow-hidden transition-all duration-200 ${
        isDark
          ? 'bg-[#132240] border border-white/[0.06]'
          : 'bg-white border border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04),0_4px_12px_rgba(16,40,76,0.03)]'
      } ${onClick ? 'cursor-pointer hover:shadow-[0_2px_8px_rgba(16,40,76,0.06),0_8px_24px_rgba(16,40,76,0.05)]' : ''} ${className}`}
      style={{ fontFamily: 'var(--v2-font)' }}
    >
      {padding ? <div className="p-5">{children}</div> : children}
    </div>
  )
}
