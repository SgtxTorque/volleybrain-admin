"use client"

import { SidebarNav } from "./sidebar-nav"
import { Share2, Search, ChevronDown, Filter } from "lucide-react"

function PowerBarSmall({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100)
  const color =
    pct >= 80 ? "bg-gradient-to-r from-[#4BB9EC] to-[#FFD700]" :
    pct >= 60 ? "bg-[#4BB9EC]" :
    pct >= 40 ? "bg-[#6AC4EE]/60" :
    "bg-[#64748B]"
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] font-bold text-white/35 tracking-wider uppercase">{label}</span>
        <span className="text-[10px] font-bold text-white/70">{value}</span>
      </div>
      <div className="h-[5px] bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const rosterPlayers = [
  { name: "Ava Williams", pos: "Setter", num: "#1", ovr: 56, hit: 100, srv: 100, ast: 88, blk: 5, dig: 62, ace: 74, teamColor: "#C41E3A", level: "LVL 4 Bronze", xp: "750/800" },
  { name: "Maya Thompson", pos: "OH", num: "#7", ovr: 48, hit: 82, srv: 76, ast: 45, blk: 28, dig: 70, ace: 55, teamColor: "#4BB9EC", level: "LVL 3 Silver", xp: "520/600" },
  { name: "Lily Chen", pos: "MB", num: "#12", ovr: 52, hit: 72, srv: 68, ast: 30, blk: 90, dig: 55, ace: 40, teamColor: "#22C55E", level: "LVL 3 Gold", xp: "580/600" },
  { name: "Sofia Martinez", pos: "Libero", num: "#3", ovr: 45, hit: 30, srv: 85, ast: 50, blk: 10, dig: 95, ace: 65, teamColor: "#FFD700", level: "LVL 2 Bronze", xp: "380/400" },
  { name: "Emma Park", pos: "OH", num: "#5", ovr: 44, hit: 75, srv: 70, ast: 40, blk: 35, dig: 60, ace: 50, teamColor: "#C41E3A", level: "LVL 2 Silver", xp: "350/400" },
  { name: "Zoe Rodriguez", pos: "RS", num: "#9", ovr: 50, hit: 80, srv: 72, ast: 35, blk: 50, dig: 48, ace: 60, teamColor: "#8B1A2B", level: "LVL 3 Bronze", xp: "480/600" },
]

function PlayerCard({ player }: { player: typeof rosterPlayers[0] }) {
  const firstName = player.name.split(" ")[0].toUpperCase()
  const lastName = player.name.split(" ")[1].toUpperCase()
  const initials = player.name.split(" ").map(n => n[0]).join("")

  return (
    <div className="rounded-[14px] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.4)] border border-[#4BB9EC]/15 flex flex-col">
      {/* Photo area */}
      <div className="relative h-[200px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${player.teamColor}, ${player.teamColor}88, ${player.teamColor}44)` }}>
        {/* Jersey number watermark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-[180px] text-white/[0.05] leading-none select-none">{player.num.replace("#", "")}</span>
        </div>
        {/* Logo */}
        <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10">
          <span className="text-[11px] font-extrabold text-[#4BB9EC]">L</span>
        </div>
        {/* Avatar */}
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-[9px] font-bold text-white/80">{initials}</div>
        {/* Accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(90deg, ${player.teamColor}, #FFD700, ${player.teamColor})` }} />
      </div>

      {/* Info panel */}
      <div className="bg-[#0A1528] p-4 flex-1 relative">
        {/* OVR Badge */}
        <div className="absolute -top-5 right-3 w-10 h-10">
          <div className="w-full h-full bg-[#0A1528] border-2 border-[#FFD700]/50 flex flex-col items-center justify-center badge-glow" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
            <span className="font-serif text-[16px] leading-none text-[#FFD700]">{player.ovr}</span>
            <span className="text-[5px] font-bold text-[#FFD700]/50 tracking-wider">OVR</span>
          </div>
        </div>

        {/* Position badge */}
        <div className="absolute -top-3 left-3">
          <span className="text-[7px] font-bold text-[#0A1528] bg-[#4BB9EC] px-2 py-0.5 rounded-sm tracking-[0.15em] uppercase">{player.pos}</span>
        </div>

        <h3 className="font-serif text-[28px] leading-[0.9] tracking-wide text-white mt-1">{firstName}</h3>
        <h3 className="font-serif text-[28px] leading-[0.9] tracking-wide text-white">{lastName}</h3>

        <div className="flex items-center gap-1.5 mt-2 mb-3">
          <span className="text-[10px] text-white/30 font-semibold">{player.num}</span>
          <span className="w-1 h-1 rounded-full bg-white/15" />
          <span className="text-[10px] font-bold" style={{ color: player.teamColor }}>Black Hornets</span>
        </div>

        {/* Power bars */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <PowerBarSmall label="HIT" value={player.hit} />
          <PowerBarSmall label="SRV" value={player.srv} />
          <PowerBarSmall label="AST" value={player.ast} />
          <PowerBarSmall label="BLK" value={player.blk} />
          <PowerBarSmall label="DIG" value={player.dig} />
          <PowerBarSmall label="ACE" value={player.ace} />
        </div>
      </div>
    </div>
  )
}

export function D4RosterCards() {
  return (
    <div className="flex h-full min-h-[780px] bg-[#0D1B3E]">
      <SidebarNav variant="coach" activeItem="roster" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D1B3E] px-8 pt-6 pb-28 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4BB9EC]/20 to-[#10284C] border border-[#4BB9EC]/20 flex items-center justify-center text-[12px] font-bold text-[#4BB9EC]">CC</div>
              <div>
                <p className="text-[14px] font-bold text-white">Coach Carlos</p>
                <p className="text-[11px] text-white/20 font-medium">Black Hornets Elite -- 12 players</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#4BB9EC]/10 border border-[#4BB9EC]/15 text-[11px] font-bold text-[#4BB9EC]">
                <Share2 className="w-3.5 h-3.5" />
                Share Roster
              </button>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4BB9EC]/50 mb-1">Roster & Player Cards</p>
          <h1 className="font-serif text-[38px] leading-none tracking-wide text-white">BLACK HORNETS ELITE</h1>
          <p className="text-[12px] text-white/20 font-medium mt-1">Spring 2026 Season -- Volleyball</p>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#0D1B3E] px-8 -mt-20 overflow-y-auto phone-scroll">
          {/* Filters bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10284C] border border-white/[0.06]">
              <Search className="w-4 h-4 text-white/20" />
              <span className="text-[12px] text-white/20 font-medium">Search players...</span>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#10284C] border border-white/[0.06] text-[11px] font-bold text-white/30">
              <Filter className="w-3.5 h-3.5" />
              Position
              <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#10284C] border border-white/[0.06] text-[11px] font-bold text-white/30">
              Sort by OVR
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            {rosterPlayers.map((player) => (
              <PlayerCard key={player.name} player={player} />
            ))}
          </div>

          {/* Team Stats Summary */}
          <div className="rounded-[18px] bg-[#10284C] border border-white/[0.06] p-6 mb-8">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/20 mb-4">Team Overview</p>
            <div className="flex items-center gap-10">
              <div className="text-center">
                <p className="font-serif text-[36px] leading-none text-white">6</p>
                <p className="text-[10px] text-white/30 font-medium mt-1">Players</p>
              </div>
              <div className="w-px h-10 bg-white/[0.06]" />
              <div className="text-center">
                <p className="font-serif text-[36px] leading-none text-[#4BB9EC]">49.2</p>
                <p className="text-[10px] text-white/30 font-medium mt-1">Avg OVR</p>
              </div>
              <div className="w-px h-10 bg-white/[0.06]" />
              <div className="text-center">
                <p className="font-serif text-[36px] leading-none text-[#FFD700]">56</p>
                <p className="text-[10px] text-white/30 font-medium mt-1">Highest OVR</p>
              </div>
              <div className="w-px h-10 bg-white/[0.06]" />
              <div className="text-center">
                <p className="font-serif text-[36px] leading-none text-[#22C55E]">6-1</p>
                <p className="text-[10px] text-white/30 font-medium mt-1">Record</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
