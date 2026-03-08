"use client"

import { SidebarNav } from "./sidebar-nav"
import { CheckCircle2, DollarSign, Link2, Megaphone, CreditCard, Users, Send, AlertCircle, TrendingUp, FileText, MapPin } from "lucide-react"

const activityFeed = [
  { user: "Liam Dawson", initials: "LD", action: "Registration Approved for Liam G.", time: "1 hour ago" },
  { user: "Sarah Johnson", initials: "SJ", action: "Registration Approved for Liam G.", time: "1 hour ago" },
  { user: "Jason Montoya", initials: "JM", action: "Registration Approved for Liam H.", time: "2 hours ago" },
  { user: "Liam Dawson", initials: "LD", action: "Registration Approved for Liam A.", time: "3 hours ago" },
  { user: "Sloan Bennet", initials: "SB", action: "Registration Approved for Sloan B.", time: "3 hours ago" },
]

const pendingTasks = [
  { icon: FileText, text: "Process CSV Roster Upload", color: "#4BB9EC" },
  { icon: MapPin, text: "Field Availability Conflict", color: "#EF4444" },
  { icon: MapPin, text: "Field Availability Conflict", color: "#EF4444" },
  { icon: FileText, text: "Registration Tasks", color: "#4BB9EC" },
]

const chartData = [
  { month: "Jan", navy: 180, sky: 200 },
  { month: "Feb", navy: 320, sky: 280 },
  { month: "Mar", navy: 480, sky: 420 },
  { month: "Apr", navy: 580, sky: 520 },
  { month: "May", navy: 650, sky: 700 },
  { month: "Jun", navy: 590, sky: 650 },
  { month: "Jul", navy: 620, sky: 780 },
  { month: "Aug", navy: 700, sky: 900 },
  { month: "Sep", navy: 0, sky: 0 },
  { month: "Oct", navy: 0, sky: 0 },
  { month: "Nov", navy: 0, sky: 0 },
  { month: "Dec", navy: 0, sky: 0 },
]

function MiniChart() {
  const maxVal = 1000
  const activeData = chartData.filter(d => d.navy > 0 || d.sky > 0)
  const chartW = 440
  const chartH = 160
  const padX = 30
  const padY = 20

  function toX(i: number) { return padX + (i / (chartData.length - 1)) * (chartW - padX * 2) }
  function toY(val: number) { return chartH - padY - (val / maxVal) * (chartH - padY * 2) }

  const navyPath = activeData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.navy)}`).join(' ')
  const skyPath = activeData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.sky)}`).join(' ')

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0D1B3E]" />
          <span className="text-[11px] font-semibold text-[#0D1B3E]/50">Midnight Navy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4BB9EC]" />
          <span className="text-[11px] font-semibold text-[#0D1B3E]/50">Electric Blue</span>
        </div>
        <div className="ml-auto">
          <button className="text-[#0D1B3E]/20">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/></svg>
          </button>
        </div>
      </div>
      <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {/* Y-axis lines */}
        {[0, 200, 400, 600, 800, 1000].map((val) => (
          <g key={val}>
            <line x1={padX} y1={toY(val)} x2={chartW - padX} y2={toY(val)} stroke="rgba(13,27,62,0.06)" strokeWidth="1" />
            <text x={padX - 6} y={toY(val) + 3} fill="rgba(13,27,62,0.25)" fontSize="9" textAnchor="end" fontWeight="600">{val}</text>
          </g>
        ))}
        {/* X-axis labels */}
        {chartData.map((d, i) => (
          <text key={d.month} x={toX(i)} y={chartH - 4} fill="rgba(13,27,62,0.25)" fontSize="9" textAnchor="middle" fontWeight="600">{d.month}</text>
        ))}
        {/* Lines */}
        <path d={navyPath} fill="none" stroke="#0D1B3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={skyPath} fill="none" stroke="#4BB9EC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* End dots */}
        {activeData.length > 0 && (
          <>
            <circle cx={toX(activeData.length - 1)} cy={toY(activeData[activeData.length - 1].navy)} r="4" fill="#0D1B3E" />
            <circle cx={toX(activeData.length - 1)} cy={toY(activeData[activeData.length - 1].sky)} r="4" fill="#4BB9EC" />
          </>
        )}
      </svg>
    </div>
  )
}

export function D1AdminCommand() {
  return (
    <div className="flex h-full min-h-[780px] bg-[#0D1B3E]">
      <SidebarNav variant="admin" activeItem="home" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dark Navy Header Band */}
        <div className="bg-[#0D1B3E] px-8 pt-6 pb-28 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4BB9EC]/20 to-[#10284C] border border-[#4BB9EC]/20 flex items-center justify-center text-[12px] font-bold text-[#4BB9EC]">SJ</div>
              <div>
                <p className="text-[11px] text-white/30 font-medium">Account Info</p>
                <p className="text-[14px] font-bold text-white">Sarah Johnson</p>
                <p className="text-[11px] text-white/20 font-medium">sarah@email.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white/20 bg-white/5 px-3 py-1 rounded-full border border-white/5">Spring 2026</span>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4BB9EC]/50 mb-1">Admin Command Center</p>
          <h1 className="font-serif text-[38px] leading-none tracking-wide text-white">FINANCIAL HEALTH & REVENUE</h1>
        </div>

        {/* Floating Cards Area */}
        <div className="flex-1 bg-[#F6F8FB] px-8 -mt-20 overflow-y-auto phone-scroll">
          {/* Top row: 2 columns */}
          <div className="flex gap-5 mb-5">
            {/* Left wide: Health + Chart */}
            <div className="flex-[2] flex flex-col gap-5">
              {/* Overall League Health */}
              <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
                <p className="text-[13px] font-bold text-[#0D1B3E] mb-4">Overall League Health</p>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-[11px] text-[#0D1B3E]/30 font-medium mb-1">Total Athletes</p>
                    <p className="font-serif text-[36px] leading-none text-[#0D1B3E]">4,203</p>
                  </div>
                  <div className="w-px h-12 bg-[#E8ECF2]" />
                  <div className="text-center">
                    <p className="text-[11px] text-[#0D1B3E]/30 font-medium mb-1">Leagues</p>
                    <p className="font-serif text-[36px] leading-none text-[#0D1B3E]">40</p>
                  </div>
                  <div className="w-px h-12 bg-[#E8ECF2]" />
                  <div className="text-center">
                    <p className="text-[11px] text-[#0D1B3E]/30 font-medium mb-1">Revenue</p>
                    <p className="font-serif text-[36px] leading-none text-[#0D1B3E]">$185,250</p>
                  </div>
                </div>
              </div>

              {/* Registration Velocity Chart */}
              <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
                <p className="text-[13px] font-bold text-[#0D1B3E] mb-1">Registration Velocity</p>
                <MiniChart />
              </div>
            </div>

            {/* Right column: Activity Feed */}
            <div className="flex-[1] flex flex-col gap-5">
              <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm flex-1">
                <p className="text-[13px] font-bold text-[#0D1B3E] mb-3">Recent Activity Feed</p>
                <div className="flex flex-col gap-3">
                  {activityFeed.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4BB9EC]/10 flex items-center justify-center text-[9px] font-bold text-[#4BB9EC] shrink-0">{item.initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-[#0D1B3E]/60 truncate">{item.user}</p>
                        <p className="text-[11px] text-[#0D1B3E]/40 font-medium truncate">{item.action}</p>
                      </div>
                      <span className="text-[9px] text-[#0D1B3E]/20 font-medium shrink-0 whitespace-nowrap">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status + League-Level Metrics Row */}
          <div className="flex gap-5 mb-5">
            <div className="flex-[2] rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0D1B3E]/30 mb-3">Payment Status Dashboard</p>
              <div className="flex items-end gap-10">
                <div>
                  <p className="text-[11px] text-[#22C55E] font-semibold mb-0.5">Paid</p>
                  <p className="font-serif text-[42px] leading-none text-[#0D1B3E]">$40,000</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#EF4444] font-semibold mb-0.5">Unpaid</p>
                  <p className="font-serif text-[42px] leading-none text-[#EF4444]">$5,200</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-3 bg-[#E8ECF2] rounded-full overflow-hidden mt-4">
                <div className="h-full bg-gradient-to-r from-[#22C55E] to-[#4BB9EC] rounded-full" style={{ width: '88%' }} />
              </div>
              <p className="text-[11px] text-[#22C55E] font-semibold mt-2">88% collected</p>
            </div>
            <div className="flex-[1] rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0D1B3E]/30 mb-3">League-Level Metrics</p>
              <div>
                <p className="text-[11px] text-[#0D1B3E]/40 font-medium mb-0.5">Revenue</p>
                <p className="font-serif text-[42px] leading-none text-[#0D1B3E]">$4.38%</p>
                <p className="text-[11px] text-[#0D1B3E]/30 font-medium mt-1">Metrics</p>
              </div>
            </div>
          </div>

          {/* Bottom row: Activity + Pending */}
          <div className="flex gap-5 mb-5">
            <div className="flex-1 rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-[#0D1B3E]">Recent Activity Feed</p>
                <button className="text-[#0D1B3E]/20">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/></svg>
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {activityFeed.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4BB9EC]/10 flex items-center justify-center text-[9px] font-bold text-[#4BB9EC] shrink-0">{item.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#0D1B3E]/60 truncate">{item.user}</p>
                      <p className="text-[11px] text-[#0D1B3E]/40 font-medium truncate">{item.action}</p>
                      <p className="text-[9px] text-[#0D1B3E]/20 font-medium mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm">
              <p className="text-[13px] font-bold text-[#0D1B3E] mb-3">Pending Tasks</p>
              <div className="flex flex-col gap-2.5">
                {pendingTasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[#F6F8FB] border border-[#E8ECF2]">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${task.color}10` }}>
                      <task.icon className="w-3.5 h-3.5" style={{ color: task.color }} />
                    </div>
                    <p className="text-[12px] font-semibold text-[#0D1B3E]/60">{task.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-3 mb-5">
            {[
              { icon: CheckCircle2, label: "Approve Registrations", color: "#4BB9EC", badge: "3" },
              { icon: Send, label: "Send Payment Reminders", color: "#FFD700" },
              { icon: CreditCard, label: "Process Payments", color: "#22C55E" },
              { icon: Megaphone, label: "Send Blast", color: "#EF4444" },
            ].map((a) => (
              <button key={a.label} className="flex-1 flex items-center gap-3 py-3.5 px-4 rounded-[14px] bg-white border border-[#E8ECF2] hover:border-[#4BB9EC]/20 transition-colors shadow-sm relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${a.color}10` }}>
                  <a.icon className="w-4 h-4" style={{ color: a.color }} />
                </div>
                <span className="text-[12px] font-bold text-[#0D1B3E]/60">{a.label}</span>
                {a.badge && (
                  <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-[#EF4444] rounded-full text-[9px] font-bold text-white flex items-center justify-center">{a.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Payment Table */}
          <div className="rounded-[18px] bg-white border border-[#E8ECF2] p-5 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0D1B3E]/30">Payment Status Metrics</p>
              <div className="flex items-center gap-2">
                <select className="text-[11px] font-medium text-[#0D1B3E]/40 bg-[#F6F8FB] border border-[#E8ECF2] rounded-lg px-3 py-1.5">
                  <option>Payment Status</option>
                </select>
                <select className="text-[11px] font-medium text-[#0D1B3E]/40 bg-[#F6F8FB] border border-[#E8ECF2] rounded-lg px-3 py-1.5">
                  <option>Filters</option>
                </select>
                <button className="px-4 py-1.5 rounded-lg bg-[#4BB9EC] text-white text-[11px] font-bold">Send Payment Reminders</button>
                <button className="px-4 py-1.5 rounded-lg bg-[#0D1B3E] text-white text-[11px] font-bold">Process CSV Roster D...</button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-[#E8ECF2]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F6F8FB]">
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider w-8"><input type="checkbox" className="w-3 h-3 rounded" /></th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Name</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Status</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Revenue</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Date</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Unbalanced</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-[#0D1B3E]/30 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Central Bears", status: "Lev 3", revenue: "$40,000", date: "$15.20M", unbal: "$40,000", balance: "" },
                    { name: "Central Boar", status: "Leo 3", revenue: "$40,000", date: "$19.20M", unbal: "$40,000", balance: "$5", color: "#EF4444" },
                    { name: "Max Johnson", status: "Bench", revenue: "$40,500", date: "$10.20M", unbal: "$46,000", balance: "" },
                    { name: "Sara Polvers", status: "Lvnch 2", revenue: "$40,500", date: "$19.20M", unbal: "$40,000", balance: "$5", color: "#EF4444" },
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-[#E8ECF2] hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4"><input type="checkbox" className="w-3 h-3 rounded" /></td>
                      <td className="py-3 px-4 text-[12px] font-semibold text-[#0D1B3E]/70">{row.name}</td>
                      <td className="py-3 px-4 text-[11px] font-medium text-[#0D1B3E]/40">{row.status}</td>
                      <td className="py-3 px-4 text-[12px] font-semibold text-[#0D1B3E]/70">{row.revenue}</td>
                      <td className="py-3 px-4 text-[12px] font-medium text-[#0D1B3E]/40">{row.date}</td>
                      <td className="py-3 px-4 text-[12px] font-semibold text-[#0D1B3E]/70">{row.unbal}</td>
                      <td className="py-3 px-4 text-[12px] font-bold" style={{ color: row.color || '#0D1B3E' }}>{row.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
