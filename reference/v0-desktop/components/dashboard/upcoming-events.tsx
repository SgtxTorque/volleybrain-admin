"use client"

import { ArrowRight, Calendar } from "lucide-react"

const events = [
  {
    team: "BH Elite",
    location: "Allen Sports Complex",
    date: "Sat Mar 1",
    time: "9:00 AM",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    team: "BH Stingers",
    opponent: "Thunder",
    location: "McKinney North",
    date: "Sat Mar 1",
    time: "2:00 PM",
    iconBg: "bg-chart-3/10",
    iconColor: "text-chart-3",
  },
  {
    team: "13U",
    location: "Allen Sports Complex",
    date: "Tue Mar 4",
    time: "6:30 PM",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
]

export function UpcomingEvents() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming Events
        </h3>
        <button className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80">
          Full Calendar
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {events.map((event, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/50 ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${event.iconBg}`}>
              <Calendar className={`h-5 w-5 ${event.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-card-foreground">
                {event.team}
                {event.opponent && (
                  <>
                    {" "}
                    <span className="font-normal text-muted-foreground">vs</span>{" "}
                    <span className="text-warning">{event.opponent}</span>
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{event.location}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-card-foreground">{event.date}</p>
              <p className="text-xs text-muted-foreground">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
