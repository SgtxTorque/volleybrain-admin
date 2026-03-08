"use client"

import { SidebarNav } from "./sidebar-nav"
import { ChevronRight, StickyNote, ChevronLeft, Star, Search } from "lucide-react"

const players = [
  { name: "Ava Williams", pos: "Setter", age: 13, grade: "7th", status: "done", score: 4.2 },
  { name: "Lily Chen", pos: "MB", age: 13, grade: "7th", status: "done", score: 3.8 },
  { name: "Zoe Rodriguez", pos: "OH", age: 13, grade: "7th", status: "done", score: 4.5 },
  { name: "Mia Anderson", pos: "OH", age: 13, grade: "7th", status: "active", score: null },
  { name: "Emma Park", pos: "RS", age: 12, grade: "6th", status: "todo", score: null },
  { name: "Sofia Martinez", pos: "L", age: 13, grade: "7th", status: "todo", score: null },
  { name: "Maya Thompson", pos: "OH", age: 14, grade: "8th", status: "todo", score: null },
  { name: "Ella Kim", pos: "S", age: 13, grade: "7th", status: "todo", score: null },
  { name: "Chloe Davis", pos: "MB", age: 12, grade: "6th", status: "todo", score: null },
  { name: "Hana Lee", pos: "OH", age: 13, grade: "7th", status: "todo", score: null },
]

const skills = [
  { name: "Serving", rated: 4 },
  { name: "Passing", rated: 3 },
  { name: "Hitting", rated: null },
  { name: "Setting", rated: null },
  { name: "Court Awareness", rated: null },
  { name: "Hustle / Attitude", rated: null },
]

function RatingBar({ name, rated }: { name: string; rated: number | null }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-semibold text-[#0D1B3E]/60">{name}</span>
        {rated !== null && <span className="text-[12px] font-bold text-[#0D1B3E]/80">{rated}/5</span>}
      </div>
      <div className="flex gap-2 mb-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`flex-1 h-11 rounded-xl text-[14px] font-bold transition-all ${
              rated !== null && n <= rated
                ? "bg-[#4BB9EC] text-white shadow-sm"
                : "bg-[#F0F3F7] text-[#0D1B3E]/20 hover:bg-[#E8ECF2]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="h-[6px] bg-[rgba(16,40,76,0.06)] rounded-full overflow-hidden">
        {rated !== null && (
          <div
            className={`h-full rounded-full transition-all ${
              rated >= 4 ? "bg-gradient-to-r from-[#4BB9EC] to-[#FFD700]" :
              rated >= 3 ? "bg-[#4BB9EC]" :
              rated >= 2 ? "bg-[#6AC4EE]/60" :
              "bg-[#64748B]"
            }`}
            style={{ width: `${(rated / 5) * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

export function D3TryoutEval() {
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
                <p className="text-[11px] text-white/20 font-medium">Black Hornets Athletics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white/20 bg-white/5 px-3 py-1 rounded-full border border-white/5">13U Evaluation</span>
              <span className="text-[10px] font-bold text-[#4BB9EC] bg-[#4BB9EC]/10 px-3 py-1 rounded-full border border-[#4BB9EC]/15">4 of 10</span>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4BB9EC]/50 mb-1">Tryout Evaluation Mode</p>
          <h1 className="font-serif text-[38px] leading-none tracking-wide text-white">SPRING 2026 TRYOUTS</h1>
          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3 max-w-[500px]">
            <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#4BB9EC] to-[#22C55E] rounded-full" style={{ width: "40%" }} />
            </div>
            <span className="text-[11px] font-bold text-white/40">40%</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#F6F8FB] px-8 -mt-20 overflow-y-auto phone-scroll">
          <div className="flex gap-5 mb-8">
            {/* Left Panel: Player List */}
            <div className="w-[320px] shrink-0 flex flex-col gap-5">
              {/* Search */}
              <div className="rounded-[14px] bg-white border border-[#E8ECF2] p-3 flex items-center gap-2 shadow-sm">
                <Search className="w-4 h-4 text-[#0D1B3E]/20" />
                <span className="text-[12px] text-[#0D1B3E]/25 font-medium">Search players...</span>
              </div>

              {/* Player Queue */}
              <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-4 shadow-sm">
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0D1B3E]/30 mb-3">Player Queue</p>
                <div className="flex flex-col gap-1.5">
                  {players.map((p, i) => (
                    <button
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        p.status === "active"
                          ? "bg-[#4BB9EC]/10 border border-[#4BB9EC]/20"
                          : p.status === "done"
                          ? "bg-[#F6F8FB] border border-transparent"
                          : "border border-transparent hover:bg-[#F6F8FB]"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        p.status === "done"
                          ? "bg-[#22C55E]/10 text-[#22C55E] border-2 border-[#22C55E]"
                          : p.status === "active"
                          ? "bg-[#4BB9EC] text-white border-2 border-[#4BB9EC]"
                          : "bg-[#F0F3F7] text-[#0D1B3E]/25 border-2 border-[#E8ECF2]"
                      }`}>
                        {p.status === "done" ? (
                          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                        ) : p.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-[12px] font-semibold truncate ${
                          p.status === "active" ? "text-[#4BB9EC]" : p.status === "done" ? "text-[#0D1B3E]/50" : "text-[#0D1B3E]/40"
                        }`}>{p.name}</p>
                        <p className="text-[10px] text-[#0D1B3E]/25 font-medium">{p.pos} -- Age {p.age}</p>
                      </div>
                      {p.score !== null && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-[#FFD700]" fill="#FFD700" />
                          <span className="text-[11px] font-bold text-[#0D1B3E]/50">{p.score}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Rankings Button */}
              <button className="w-full py-3 rounded-xl border-2 border-dashed border-[#4BB9EC]/30 text-[12px] font-bold text-[#4BB9EC] tracking-wider uppercase hover:bg-[#4BB9EC]/5 transition-colors">
                View Rankings Board
              </button>
            </div>

            {/* Right Panel: Evaluation Form */}
            <div className="flex-1 flex flex-col gap-5">
              {/* Player Header Card */}
              <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-6 shadow-sm">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h2 className="text-[28px] font-extrabold text-[#0D1B3E] leading-tight">Mia Anderson</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] font-bold text-[#4BB9EC] bg-[#4BB9EC]/10 px-2.5 py-0.5 rounded-full">Outside Hitter</span>
                      <span className="text-[12px] text-[#0D1B3E]/30 font-medium">Age 13 -- 7th Grade</span>
                      <span className="text-[12px] text-[#0D1B3E]/30 font-medium">Black Hornets Athletics</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4BB9EC]/15 to-[#F0F3F7] flex items-center justify-center text-[20px] font-bold text-[#4BB9EC] border border-[#4BB9EC]/15">
                    MA
                  </div>
                </div>

                {/* Nav between previous / next */}
                <div className="flex items-center gap-3 mt-4">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F6F8FB] border border-[#E8ECF2] text-[11px] font-bold text-[#0D1B3E]/40 hover:bg-[#E8ECF2] transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Zoe Rodriguez
                  </button>
                  <div className="flex-1" />
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F6F8FB] border border-[#E8ECF2] text-[11px] font-bold text-[#0D1B3E]/40 hover:bg-[#E8ECF2] transition-colors">
                    Emma Park
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Skill Ratings */}
              <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-6 shadow-sm">
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0D1B3E]/30 mb-4">Skill Evaluation</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {skills.map((skill) => (
                    <RatingBar key={skill.name} name={skill.name} rated={skill.rated} />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-[#0D1B3E]/20" />
                  <p className="text-[12px] font-bold text-[#0D1B3E]/60">Evaluation Notes</p>
                </div>
                <div className="w-full h-[80px] rounded-xl bg-[#F6F8FB] border border-[#E8ECF2] p-3">
                  <p className="text-[12px] text-[#0D1B3E]/25 font-medium">Add notes about this player's performance...</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#4BB9EC] text-white text-[14px] font-bold shadow-sm hover:bg-[#3BA8DB] transition-colors">
                  Save & Next Player
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button className="px-6 py-4 rounded-xl bg-white border border-[#E8ECF2] text-[#0D1B3E]/50 text-[14px] font-bold hover:bg-[#F6F8FB] transition-colors">
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
