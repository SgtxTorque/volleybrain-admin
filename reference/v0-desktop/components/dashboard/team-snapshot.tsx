"use client"

import { ArrowRight } from "lucide-react"

const teams = [
  { name: "BH Elite", players: 12, record: "3W-1L", color: "bg-accent" },
  { name: "BH Stingers", players: 8, record: "2W-0L", color: "bg-chart-3" },
  { name: "13U", players: 6, record: "0W-0L", color: "bg-warning" },
  { name: "BH Reserve", players: 4, record: "1W-2L", color: "bg-chart-5" },
]

export function TeamSnapshot() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Team Snapshot
        </h3>
        <button className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80">
          Manage
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {teams.map((team) => (
          <div
            key={team.name}
            className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`absolute top-0 left-0 h-1 w-full ${team.color} rounded-t-2xl`} />
            <h4 className="text-base font-bold text-card-foreground">{team.name}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{team.players} players</p>
            <p className="mt-2 text-sm font-semibold text-accent">{team.record}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
