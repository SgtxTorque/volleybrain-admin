"use client"

import { ArrowRight } from "lucide-react"

const stats = [
  { label: "Rostered", count: 15, color: "bg-accent" },
  { label: "Pending", count: 4, color: "bg-warning" },
  { label: "Waitlisted", count: 0, color: "bg-chart-3" },
  { label: "Denied", count: 0, color: "bg-destructive" },
]

export function RegistrationStats() {
  const total = stats.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Registration Stats
        </h3>
        <button className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80">
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="12"
            />
            {/* Rostered segment */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="12"
              strokeDasharray={`${(15 / 19) * 314.16} 314.16`}
              strokeLinecap="round"
            />
            {/* Pending segment */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--warning)"
              strokeWidth="12"
              strokeDasharray={`${(4 / 19) * 314.16} 314.16`}
              strokeDashoffset={`${-(15 / 19) * 314.16}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold text-card-foreground">{total}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className="ml-auto text-sm font-semibold text-card-foreground">{stat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
