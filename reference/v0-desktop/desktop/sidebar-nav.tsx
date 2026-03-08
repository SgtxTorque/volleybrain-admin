"use client"

import { Home, Users, UserCircle, CreditCard, Calendar, MessageCircle, Settings, BarChart3, Zap, Trophy } from "lucide-react"

interface SidebarNavProps {
  activeItem?: string
  variant?: "admin" | "coach" | "player"
}

const adminItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "teams", icon: Users, label: "Teams" },
  { id: "players", icon: UserCircle, label: "Players" },
  { id: "payments", icon: CreditCard, label: "Payments" },
  { id: "schedule", icon: Calendar, label: "Schedule" },
  { id: "chat", icon: MessageCircle, label: "Chat", badge: 3 },
  { id: "settings", icon: Settings, label: "Settings" },
]

const coachItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "gameday", icon: Zap, label: "Game Day" },
  { id: "roster", icon: Users, label: "Roster" },
  { id: "stats", icon: BarChart3, label: "Stats" },
  { id: "schedule", icon: Calendar, label: "Schedule" },
  { id: "chat", icon: MessageCircle, label: "Chat", badge: 2 },
  { id: "settings", icon: Settings, label: "Settings" },
]

const playerItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "gameday", icon: Zap, label: "Game Day" },
  { id: "roster", icon: Users, label: "Roster" },
  { id: "badges", icon: Trophy, label: "Badges" },
  { id: "chat", icon: MessageCircle, label: "Chat", badge: 1 },
  { id: "settings", icon: Settings, label: "Settings" },
]

export function SidebarNav({ activeItem = "home", variant = "admin" }: SidebarNavProps) {
  const items = variant === "admin" ? adminItems : variant === "coach" ? coachItems : playerItems

  return (
    <div className="w-[64px] bg-[#0A1528] border-r border-white/[0.06] flex flex-col items-center py-5 shrink-0 h-full">
      {/* Lynx logo */}
      <div className="w-9 h-9 rounded-xl bg-[#4BB9EC]/10 flex items-center justify-center mb-6 border border-[#4BB9EC]/15">
        <span className="text-[14px] font-extrabold text-[#4BB9EC]">L</span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {items.map((item) => {
          const isActive = item.id === activeItem
          return (
            <div key={item.id} className="relative group">
              <button
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[#4BB9EC]/15 text-[#4BB9EC]"
                    : "text-white/20 hover:text-white/40 hover:bg-white/[0.03]"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
              </button>
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#4BB9EC]" />
              )}
              {/* Badge */}
              {item.badge && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#EF4444] rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#1a1a1a] rounded-md text-[10px] font-semibold text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/[0.06]">
                {item.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* User avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4BB9EC]/20 to-[#10284C] border border-[#4BB9EC]/20 flex items-center justify-center text-[10px] font-bold text-[#4BB9EC]">
        SJ
      </div>
    </div>
  )
}
