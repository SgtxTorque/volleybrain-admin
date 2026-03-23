import { useTheme } from '../../contexts/ThemeContext'

export default function InnerStatRow({ stats }) {
  const { isDark } = useTheme()

  return (
    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`rounded-[14px] px-5 py-4 transition-all duration-200 ${
            isDark
              ? 'bg-[#132240] border border-white/[0.06] hover:border-white/[0.12]'
              : 'bg-white border border-[#E8ECF2] hover:shadow-[0_2px_8px_rgba(16,40,76,0.06),0_8px_24px_rgba(16,40,76,0.05)]'
          }`}
          style={{ fontFamily: 'var(--v2-font)' }}
        >
          <div className="flex items-center gap-3">
            {stat.icon && (
              <span className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'
              }`}>
                {stat.icon}
              </span>
            )}
            <div>
              <div className={`text-2xl font-extrabold tracking-tight ${stat.color || (isDark ? 'text-white' : 'text-[#10284C]')}`}
                style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div className={`text-[10.5px] font-bold uppercase tracking-[0.08em] mt-1 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {stat.label}
              </div>
              {stat.sub && (
                <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stat.sub}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
