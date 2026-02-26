"use client"

import { Camera, BarChart3, Trophy, Award } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const quickActions = [
  { icon: Camera, label: "Photo/Video", color: "text-accent hover:bg-accent/10" },
  { icon: BarChart3, label: "Poll", color: "text-chart-3 hover:bg-chart-3/10" },
  { icon: Award, label: "Shoutout", color: "text-warning hover:bg-warning/10" },
  { icon: Trophy, label: "Challenge", color: "text-chart-5 hover:bg-chart-5/10" },
]

export function FeedComposer() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
      {/* Input row */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">
            CT
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 items-center rounded-xl border border-border bg-secondary/50 px-4 py-2.5">
          <input
            type="text"
            placeholder="What's on your mind?"
            className="flex-1 bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Quick action row */}
      <div className="flex items-center gap-1 border-t border-border px-5 py-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${action.color}`}
          >
            <action.icon className="h-[18px] w-[18px]" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
