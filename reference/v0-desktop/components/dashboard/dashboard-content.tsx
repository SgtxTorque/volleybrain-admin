"use client"

import { TeamSnapshot } from "./team-snapshot"
import { RegistrationStats } from "./registration-stats"
import { PaymentSummary } from "./payment-summary"
import { UpcomingEvents } from "./upcoming-events"

export function DashboardContent() {
  return (
    <main className="flex flex-1 flex-col gap-8 overflow-y-auto py-8 px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Good evening, Carlos. Here&apos;s your overview.
        </p>
      </div>

      {/* Team Snapshot */}
      <TeamSnapshot />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-6">
        <RegistrationStats />
        <PaymentSummary />
      </div>

      {/* Upcoming Events */}
      <UpcomingEvents />
    </main>
  )
}
