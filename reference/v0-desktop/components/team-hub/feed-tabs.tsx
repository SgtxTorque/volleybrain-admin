"use client"

import { useState } from "react"
import { FileText, Calendar, Trophy, BarChart3 } from "lucide-react"

const tabs = [
  { id: "feed", label: "Feed", icon: FileText },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "stats", label: "Stats", icon: BarChart3 },
]

export function FeedTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  return (
    <div className="flex items-center rounded-2xl bg-card p-1.5 shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
