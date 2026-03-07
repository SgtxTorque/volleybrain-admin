export default function PageShell({ breadcrumb, title, subtitle, actions, children }) {
  return (
    <div className="w-full max-w-[1400px] px-6 py-6">
      {breadcrumb && (
        <div className="text-r-xs font-medium text-lynx-sky mb-1 flex items-center gap-1.5">
          <span>🏠</span> <span className="text-slate-400">›</span> {breadcrumb}
        </div>
      )}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-r-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-r-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 items-center">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
