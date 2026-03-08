"use client"

import { SidebarNav } from "./sidebar-nav"
import { Crown, Flame, ArrowUp, Heart, Zap, MessageCircle, Send, Trophy, Target, Award } from "lucide-react"

const leaderboard = [
  { rank: 1, name: "Ava Williams", initials: "AW", xp: 750, level: 4, streak: 3, isYou: true, color: "#FFD700", badge: "MVP" },
  { rank: 2, name: "Mia Johnson", initials: "MJ", xp: 720, level: 4, streak: 5, isYou: false, color: "#C0C0C0", badge: null },
  { rank: 3, name: "Kai Lopez", initials: "KL", xp: 680, level: 3, streak: 2, isYou: false, color: "#CD7F32", badge: null },
  { rank: 4, name: "Zoe Rodriguez", initials: "ZR", xp: 640, level: 3, streak: 0, isYou: false, color: "", badge: null },
  { rank: 5, name: "Luna Torres", initials: "LT", xp: 590, level: 3, streak: 1, isYou: false, color: "", badge: null },
  { rank: 6, name: "Emma Park", initials: "EP", xp: 560, level: 2, streak: 0, isYou: false, color: "", badge: null },
  { rank: 7, name: "Sofia Martinez", initials: "SM", xp: 530, level: 2, streak: 4, isYou: false, color: "", badge: null },
  { rank: 8, name: "Lily Chen", initials: "LC", xp: 510, level: 2, streak: 0, isYou: false, color: "", badge: null },
]

const teamWall = [
  { user: "Mia Johnson", initials: "MJ", message: "That set was filthy -- 3 aces in a row!", time: "2h ago", likes: 7 },
  { user: "Coach Carlos", initials: "CC", message: "Ava is locked in this season. MVP energy. Keep pushing!", time: "3h ago", likes: 12, isCoach: true },
  { user: "Kai Lopez", initials: "KL", message: "Nobody stopping us Saturday. Let's get this W.", time: "5h ago", likes: 4 },
  { user: "Luna Torres", initials: "LT", message: "Great practice today, defense was on fire", time: "6h ago", likes: 3 },
]

const achievements = [
  { icon: Trophy, label: "First Win", color: "#FFD700", earned: true },
  { icon: Target, label: "10 Aces", color: "#4BB9EC", earned: true },
  { icon: Flame, label: "5-Day Streak", color: "#EF4444", earned: true },
  { icon: Award, label: "Team MVP", color: "#22C55E", earned: false },
]

export function D5TeamPulse() {
  return (
    <div className="flex h-full min-h-[780px] bg-[#0D1B3E]">
      <SidebarNav variant="player" activeItem="home" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D1B3E] px-8 pt-6 pb-28 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700]/25 to-[#10284C] border-2 border-[#FFD700]/40 flex items-center justify-center text-[12px] font-bold text-[#FFD700] badge-glow">AW</div>
              <div>
                <p className="text-[14px] font-bold text-white">Ava Williams</p>
                <p className="text-[11px] text-white/20 font-medium">LVL 4 Bronze -- 750 / 800 XP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[#FFD700]">
                <Flame className="w-4 h-4" />
                <span className="text-[12px] font-bold">3 day streak</span>
              </div>
              <span className="text-[10px] font-bold text-white/20 bg-white/5 px-3 py-1 rounded-full border border-white/5">Spring 2026</span>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4BB9EC]/50 mb-1">Player Dashboard</p>
          <div className="flex items-baseline gap-4">
            <h1 className="font-serif text-[38px] leading-none tracking-wide text-white">TEAM</h1>
            <h1 className="font-serif text-[38px] leading-none tracking-wide text-[#4BB9EC]">PULSE</h1>
          </div>
          <p className="text-[12px] text-white/20 font-medium mt-1">Black Hornets Elite -- Live feed</p>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#0D1B3E] px-8 -mt-20 overflow-y-auto phone-scroll">
          <div className="flex gap-5 mb-8">
            {/* Left: Leaderboard + Achievements */}
            <div className="flex-[2] flex flex-col gap-5">
              {/* Podium Card */}
              <div className="rounded-[22px] bg-gradient-to-b from-[#162848] to-[#10284C] border border-[#FFD700]/10 p-6">
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 mb-5">XP Leaderboard</p>
                <div className="flex items-end justify-center gap-4 mb-5">
                  {/* 2nd */}
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C0C0C0]/20 to-[#10284C] border-2 border-[#C0C0C0]/25 flex items-center justify-center text-[14px] font-bold text-white/60 mb-1">MJ</div>
                    <p className="text-[11px] font-semibold text-white/40 mb-1">Mia J.</p>
                    <div className="w-16 h-20 bg-[#C0C0C0]/8 rounded-t-xl flex flex-col items-center justify-end pb-3 border-t-2 border-[#C0C0C0]/20">
                      <span className="font-serif text-[22px] text-[#C0C0C0] leading-none">2</span>
                      <span className="text-[9px] text-white/20 font-medium">720 XP</span>
                    </div>
                  </div>
                  {/* 1st */}
                  <div className="flex flex-col items-center -mt-4">
                    <Crown className="w-6 h-6 text-[#FFD700] mb-1" />
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD700]/25 to-[#10284C] border-2 border-[#FFD700]/40 flex items-center justify-center text-[15px] font-bold text-[#FFD700] mb-1 badge-glow">AW</div>
                    <p className="text-[11px] font-bold text-[#FFD700] mb-1">Ava W. (You)</p>
                    <div className="w-20 h-24 bg-[#FFD700]/8 rounded-t-xl flex flex-col items-center justify-end pb-3 border-t-2 border-[#FFD700]/30">
                      <span className="font-serif text-[24px] text-[#FFD700] leading-none">1</span>
                      <span className="text-[9px] text-[#FFD700]/40 font-medium">750 XP</span>
                    </div>
                  </div>
                  {/* 3rd */}
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#CD7F32]/20 to-[#10284C] border-2 border-[#CD7F32]/25 flex items-center justify-center text-[14px] font-bold text-white/60 mb-1">KL</div>
                    <p className="text-[11px] font-semibold text-white/40 mb-1">Kai L.</p>
                    <div className="w-16 h-16 bg-[#CD7F32]/8 rounded-t-xl flex flex-col items-center justify-end pb-3 border-t-2 border-[#CD7F32]/20">
                      <span className="font-serif text-[22px] text-[#CD7F32] leading-none">3</span>
                      <span className="text-[9px] text-white/20 font-medium">680 XP</span>
                    </div>
                  </div>
                </div>

                {/* Full list */}
                <div className="flex flex-col gap-2">
                  {leaderboard.map((player) => (
                    <div
                      key={player.rank}
                      className={`rounded-[14px] p-3 flex items-center gap-3 ${
                        player.isYou ? "bg-[#4BB9EC]/10 border border-[#4BB9EC]/15" : "bg-[#10284C]/50 border border-white/5"
                      }`}
                    >
                      <span className={`text-[14px] font-bold w-6 text-center ${player.rank <= 3 ? "" : "text-white/20"}`} style={player.rank <= 3 ? { color: player.color } : {}}>
                        {player.rank}
                      </span>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        player.isYou ? "bg-[#4BB9EC]/20 text-[#4BB9EC] border border-[#4BB9EC]/25" : "bg-white/5 text-white/30 border border-white/5"
                      }`}>
                        {player.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[12px] font-bold truncate ${player.isYou ? "text-white" : "text-white/60"}`}>
                            {player.name}
                            {player.isYou && <span className="text-[#4BB9EC] ml-1 text-[10px]">(You)</span>}
                          </p>
                          {player.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-[#FFD700]">
                              <Flame className="w-3 h-3" />
                              <span className="text-[9px] font-bold">{player.streak}</span>
                            </span>
                          )}
                          {player.badge && (
                            <span className="text-[8px] font-bold text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.5 rounded-full">{player.badge}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/20 font-medium">Lvl {player.level} -- {player.xp} XP</p>
                      </div>
                      {player.isYou && (
                        <div className="flex items-center gap-0.5 text-[#22C55E]">
                          <ArrowUp className="w-3 h-3" />
                          <span className="text-[10px] font-bold">1</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="rounded-[18px] bg-[#10284C] border border-white/[0.06] p-5">
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 mb-4">Achievements</p>
                <div className="grid grid-cols-4 gap-3">
                  {achievements.map((a) => (
                    <div key={a.label} className={`flex flex-col items-center gap-2 py-4 rounded-[14px] ${a.earned ? "bg-white/5 border border-white/5" : "bg-white/[0.02] border border-white/[0.03] opacity-40"}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: a.earned ? `${a.color}15` : "rgba(255,255,255,0.03)" }}>
                        <a.icon className="w-5 h-5" style={{ color: a.earned ? a.color : "rgba(255,255,255,0.1)" }} />
                      </div>
                      <span className="text-[10px] font-bold text-white/40">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Team Wall + Shoutout */}
            <div className="flex-[1.5] flex flex-col gap-5">
              {/* Quick Shoutout */}
              <div className="rounded-[18px] bg-gradient-to-r from-[#FFD700]/8 to-[#10284C] border border-[#FFD700]/15 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-white/60">Give a teammate props</p>
                    <p className="text-[11px] text-white/25 font-medium">0 shoutouts given this week</p>
                  </div>
                  <button className="px-4 py-2 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/20 text-[11px] font-bold text-[#FFD700]">
                    Shout
                  </button>
                </div>
              </div>

              {/* Team Wall */}
              <div className="rounded-[18px] bg-[#10284C] border border-white/[0.06] p-5 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20">Team Wall</p>
                  <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/30">
                    <MessageCircle className="w-3 h-3" />
                    Post
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {teamWall.map((r, i) => (
                    <div key={i} className="rounded-[16px] bg-[#0D1B3E]/60 border border-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          r.isCoach ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20" : "bg-[#4BB9EC]/10 text-[#4BB9EC]"
                        }`}>
                          {r.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[11px] font-bold text-white/60">{r.user}</p>
                            {r.isCoach && <span className="text-[8px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded-full">Coach</span>}
                            <span className="text-[9px] text-white/15 font-medium">{r.time}</span>
                          </div>
                          <p className="text-[13px] text-white/80 font-medium leading-snug">{r.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2.5 ml-12">
                        <button className="flex items-center gap-1 text-white/15 hover:text-[#EF4444] transition-colors">
                          <Heart className="w-3 h-3" />
                          <span className="text-[9px] font-semibold">{r.likes}</span>
                        </button>
                        <button className="text-[9px] font-semibold text-white/15">Reply</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat input */}
                <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl bg-[#0D1B3E]/60 border border-white/5">
                  <span className="text-[12px] text-white/20 font-medium flex-1">Write something...</span>
                  <button className="w-7 h-7 rounded-lg bg-[#4BB9EC]/10 flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-[#4BB9EC]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
