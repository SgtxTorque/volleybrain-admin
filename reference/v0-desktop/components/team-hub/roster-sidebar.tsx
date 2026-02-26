"use client"

const players = [
  { number: 7, name: "Ava T.", position: "OH", online: true },
  { number: 13, name: "Mia A.", position: "S", online: true },
  { number: 9, name: "Emma D.", position: "MB", online: false },
  { number: 33, name: "Sophia L.", position: "DS", online: true },
  { number: 4, name: "Isabella R.", position: "RS", online: false },
  { number: 15, name: "Olivia M.", position: "L", online: false },
  { number: 24, name: "Charlotte W.", position: "OH", online: true },
  { number: 6, name: "Amelia J.", position: "MB", online: false },
]

const onlineCount = players.filter((p) => p.online).length

export function RosterSidebar() {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border py-8 pl-6 pr-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Roster
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-accent" />
          {onlineCount} online
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {players.map((player) => (
          <button
            key={player.number}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border text-xs font-bold text-muted-foreground transition-colors group-hover:border-accent group-hover:text-accent">
              {player.number}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                  player.online ? "bg-accent" : "bg-muted-foreground/30"
                }`}
              />
            </span>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-card-foreground">{player.name}</p>
              <p className="text-xs text-muted-foreground">{player.position}</p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
