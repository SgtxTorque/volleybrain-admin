"use client"

import { DollarSign, ClipboardCheck, FileCheck, Trophy } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const activities = [
  {
    type: "payment",
    text: "Payment received",
    detail: "$150",
    person: "Ava Test",
    time: "25d ago",
    initials: "AT",
    icon: <DollarSign className="h-3.5 w-3.5" />,
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
  },
  {
    type: "payment",
    text: "Payment received",
    detail: "$35",
    person: "Ava Test",
    time: "25d ago",
    initials: "AT",
    icon: <DollarSign className="h-3.5 w-3.5" />,
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
  },
  {
    type: "payment",
    text: "Payment received",
    detail: "$17",
    person: "Ava Test",
    time: "25d ago",
    initials: "AT",
    icon: <DollarSign className="h-3.5 w-3.5" />,
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
  },
  {
    type: "registration",
    text: "Registration assigned",
    person: "Charlotte Wilson",
    time: "30d ago",
    initials: "CW",
    icon: <ClipboardCheck className="h-3.5 w-3.5" />,
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    type: "registration",
    text: "Registration assigned",
    person: "Mia Anderson",
    time: "30d ago",
    initials: "MA",
    icon: <ClipboardCheck className="h-3.5 w-3.5" />,
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    type: "registration",
    text: "Registration assigned",
    person: "Emma Davis",
    time: "30d ago",
    initials: "ED",
    icon: <ClipboardCheck className="h-3.5 w-3.5" />,
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    type: "waiver",
    text: "Waiver signed",
    person: "Ava Test",
    time: "32d ago",
    initials: "AT",
    icon: <FileCheck className="h-3.5 w-3.5" />,
    iconBg: "bg-success/15",
    iconColor: "text-success",
  },
  {
    type: "game",
    text: "Game completed",
    person: "BH Elite vs Thunder",
    time: "35d ago",
    initials: "GC",
    icon: <Trophy className="h-3.5 w-3.5" />,
    iconBg: "bg-chart-5/15",
    iconColor: "text-chart-5",
  },
]

export function LiveActivity() {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-border py-8 pl-6 pr-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Live Activity
      </h3>
      <div className="flex flex-col">
        {activities.map((activity, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 py-4 ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback
                className={`${activity.iconBg} ${activity.iconColor} text-xs font-medium`}
              >
                {activity.icon}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-card-foreground">
                {activity.text}
                {activity.detail && (
                  <span className="text-card-foreground"> &mdash; {activity.detail}</span>
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {activity.person} &middot; {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
