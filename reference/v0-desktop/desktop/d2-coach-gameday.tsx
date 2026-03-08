"use client"

import { SidebarNav } from "./sidebar-nav"
import { Clock, ArrowRightLeft, PenLine, ListOrdered, Plus, Minus } from "lucide-react"

const courtPositions = [
  { pos: "Front Left", num: "#7", name: "Maya", role: "OH", active: false },
  { pos: "Front Center", num: "#12", name: "Lily", role: "MB", active: false },
  { pos: "Front Right", num: "#1", name: "Ava", role: "S", active: true },
  { pos: "Back Left", num: "#3", name: "Sofia", role: "L", active: false },
  { pos: "Back Center", num: "#5", name: "Emma", role: "OH", active: false },
  { pos: "Back Right", num: "#9", name: "Zoe", role: "RS", active: false },
]

const statFeed = [
  { time: "14:32", text: "Ava #1 -- Assist", type: "assist" },
  { time: "14:28", text: "Maya #7 -- Kill", type: "kill" },
  { time: "14:25", text: "Timeout called -- BHE", type: "timeout" },
  { time: "14:20", text: "Lily #12 -- Block", type: "block" },
  { time: "14:15", text: "Emma #5 -- Dig", type: "dig" },
  { time: "14:12", text: "Ava #1 -- Ace", type: "ace" },
  { time: "14:08", text: "Zoe #9 -- Kill", type: "kill" },
  { time: "14:02", text: "Sofia #3 -- Dig", type: "dig" },
]

const rosterData = [
  { name: "Leo", num: "#1", status: "IN-GAME", statusColor: "#22C55E" },
  { name: "Max", num: "#7", status: "SUB IN", statusColor: "#4BB9EC" },
  { name: "Alex", num: "#3", status: "BENCH", statusColor: "#FFD700" },
]

export function D2CoachGameday() {
  return (
    <div className="flex h-full min-h-[780px] bg-[#0D1B3E]">
      <SidebarNav variant="coach" activeItem="gameday" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dark Header Band */}
        <div className="bg-[#0D1B3E] px-8 pt-6 pb-28 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4BB9EC]/20 to-[#10284C] border border-[#4BB9EC]/20 flex items-center justify-center text-[12px] font-bold text-[#4BB9EC]">CC</div>
              <div>
                <p className="text-[14px] font-bold text-white">Coach Carlos</p>
                <p className="text-[11px] text-white/20 font-medium">Justin Nguyen</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
                <span className="text-[11px] font-bold text-[#EF4444] uppercase tracking-wider">Live</span>
              </div>
              <span className="text-[10px] font-bold text-white/20 bg-white/5 px-3 py-1 rounded-full border border-white/5">Set 2 of 3</span>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4BB9EC]/50 mb-1">Coach Command Center</p>
          <h1 className="font-serif text-[38px] leading-none tracking-wide text-white">GAME DAY OPERATION</h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#F6F8FB] px-8 -mt-20 overflow-y-auto phone-scroll">
          {/* Top Row: Score + Next Game + Practice */}
          <div className="flex gap-5 mb-5">
            {/* Live Scoring */}
            <div className="flex-[3] rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-bold text-[#0D1B3E]">Live Scoring</p>
                <button className="text-[#0D1B3E]/20">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/></svg>
                </button>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/20">
                    <span className="text-[14px] font-extrabold text-[#FFD700]">J</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-bold text-[#0D1B3E]/50 mb-0.5">Jaguars</p>
                    <div className="flex items-center gap-3">
                      <button className="w-8 h-8 rounded-lg bg-[#F6F8FB] border border-[#E8ECF2] flex items-center justify-center text-[#0D1B3E]/30 hover:bg-[#E8ECF2] transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <p className="font-serif text-[56px] leading-none text-[#0D1B3E]">10</p>
                      <button className="w-8 h-8 rounded-lg bg-[#4BB9EC]/10 border border-[#4BB9EC]/20 flex items-center justify-center text-[#4BB9EC] hover:bg-[#4BB9EC]/20 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center px-4">
                  <p className="text-[10px] font-bold text-[#0D1B3E]/20 tracking-wider mb-1">SET 2</p>
                  <div className="w-px h-8 bg-[#E8ECF2]" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[12px] font-bold text-[#0D1B3E]/50 mb-0.5">Panthers</p>
                    <div className="flex items-center gap-3">
                      <button className="w-8 h-8 rounded-lg bg-[#F6F8FB] border border-[#E8ECF2] flex items-center justify-center text-[#0D1B3E]/30">
                        <Minus className="w-4 h-4" />
                      </button>
                      <p className="font-serif text-[56px] leading-none text-[#0D1B3E]">12</p>
                      <button className="w-8 h-8 rounded-lg bg-[#4BB9EC]/10 border border-[#4BB9EC]/20 flex items-center justify-center text-[#4BB9EC]">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#0D1B3E]/5 flex items-center justify-center border border-[#0D1B3E]/10">
                    <span className="text-[14px] font-extrabold text-[#0D1B3E]/50">P</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Game */}
            <div className="flex-[2] rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
              <p className="text-[13px] font-bold text-[#0D1B3E] mb-2">Next Game</p>
              <p className="text-[11px] font-bold text-[#0D1B3E]/40 uppercase tracking-wider mb-3">Saturday 10:00 AM</p>
              <p className="font-serif text-[36px] leading-none text-[#0D1B3E] tracking-wide mb-3">00:00:17:57</p>
              <button className="w-full py-2 rounded-xl bg-[#F6F8FB] border border-[#E8ECF2] text-[11px] font-bold text-[#0D1B3E]/40 hover:bg-[#E8ECF2] transition-colors">
                Opera/dovs-Item
              </button>
            </div>
          </div>

          {/* Middle Row: Roster + Practice Plan */}
          <div className="flex gap-5 mb-5">
            {/* Roster Management */}
            <div className="flex-[3] rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-bold text-[#0D1B3E]">Roster Management</p>
                <button className="text-[#0D1B3E]/20">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/></svg>
                </button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E8ECF2]">
                    <th className="py-2 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Status</th>
                    <th className="py-2 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Status</th>
                    <th className="py-2 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterData.map((p, i) => (
                    <tr key={i} className="border-b border-[#E8ECF2] last:border-b-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#4BB9EC]/10 flex items-center justify-center text-[10px] font-bold text-[#4BB9EC]">{p.name[0]}</div>
                          <div>
                            <p className="text-[12px] font-semibold text-[#0D1B3E]/70">{p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.statusColor }} />
                      </td>
                      <td className="py-3">
                        <select className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-[#E8ECF2] bg-[#F6F8FB]" style={{ color: p.statusColor }}>
                          <option>{p.status}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Practice Plan */}
            <div className="flex-[2] rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-[#0D1B3E]">Practice Plan</p>
                <button className="text-[#0D1B3E]/20">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/></svg>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Practice Plan", time: "" },
                  { label: "Warm-Up: 5/40", time: "" },
                  { label: "Bench Tracker", time: "" },
                  { label: "Field: Sparks", time: "" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[#F6F8FB] border border-[#E8ECF2]">
                    <div className="w-2 h-2 rounded-full bg-[#4BB9EC]/40" />
                    <p className="text-[12px] font-medium text-[#0D1B3E]/50">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Liver Scoring Buttons */}
          <div className="mb-5">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0D1B3E]/30 mb-3">Live Scoring</p>
            <div className="flex gap-3">
              {[
                { icon: "football", label: "Touchdown", color: "#4BB9EC", iconElement: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><ellipse cx="10" cy="10" rx="8" ry="5" stroke="#4BB9EC" strokeWidth="1.5" /><path d="M6 10h8M10 7v6" stroke="#4BB9EC" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                { icon: "goal", label: "Field Goal", color: "#22C55E", iconElement: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 4v12M14 4v12M6 8h8" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                { icon: "flag", label: "Penalty", color: "#FFD700", iconElement: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 3v14M5 3h8l-3 4 3 4H5" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                { icon: "x", label: "Out-of-bounds", color: "#EF4444", iconElement: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" /></svg> },
              ].map((a) => (
                <button key={a.label} className="flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[16px] bg-white border border-[#E8ECF2] hover:border-[#4BB9EC]/20 transition-colors shadow-sm">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${a.color}10` }}>
                    {a.iconElement}
                  </div>
                  <span className="text-[12px] font-bold text-[#0D1B3E]/60">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Stat Feed */}
          <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm mb-8">
            <p className="text-[13px] font-bold text-[#0D1B3E] mb-3">Live Stat Feed</p>
            <div className="grid grid-cols-2 gap-x-6">
              {statFeed.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#E8ECF2] last:border-b-0">
                  <span className="text-[11px] text-[#0D1B3E]/20 font-mono font-medium w-12">{item.time}</span>
                  <span className="text-[12px] font-semibold text-[#0D1B3E]/70 flex-1">{item.text}</span>
                  <div className="w-5 h-5 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#22C55E" strokeWidth="1.5" fill="none" /></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
