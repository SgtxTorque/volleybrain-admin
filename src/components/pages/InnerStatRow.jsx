export default function InnerStatRow({ stats }) {
  return (
    <div className="grid gap-3.5 mb-6" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-[14px] border border-slate-200 px-5 py-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2.5">
            {stat.icon && <span className="text-lg">{stat.icon}</span>}
            <div>
              <div className={`text-r-3xl font-extrabold tracking-tight ${stat.color || 'text-slate-900'}`}>
                {stat.value}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                {stat.label}
              </div>
              {stat.sub && <div className="text-r-xs text-slate-500 mt-1">{stat.sub}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
