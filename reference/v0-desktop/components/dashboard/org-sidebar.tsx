"use client"

import {
  AlertTriangle,
  ClipboardCheck,
  DollarSign,
  FileWarning,
  Megaphone,
  UserPlus,
  CreditCard,
} from "lucide-react"

export function OrgSidebar() {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-border py-8 pl-6 pr-4">
      {/* Org Card */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
          BH
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold text-card-foreground">Black Hornets Athletics</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Spring 2026 &middot; Active</p>
        </div>
        <div className="flex w-full items-center justify-around pt-2">
          <StatItem value="17" label="PLAYERS" />
          <StatItem value="4" label="TEAMS" />
          <StatItem value="5" label="COACHES" />
        </div>
      </div>

      {/* Collections Progress */}
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-card-foreground">Collections</span>
          <span className="text-sm font-semibold text-accent">31%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[31%] rounded-full bg-accent transition-all" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">$1,875 / $6,030</p>
      </div>

      {/* Needs Attention */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 px-1 pb-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Needs Attention
          </span>
        </div>
        <AttentionItem
          icon={<ClipboardCheck className="h-4 w-4" />}
          label="Pending registrations"
          badge="4"
          badgeColor="bg-warning/15 text-warning"
        />
        <AttentionItem
          icon={<DollarSign className="h-4 w-4" />}
          label="Overdue payments"
          badge="$4,155"
          badgeColor="bg-destructive/10 text-destructive"
        />
        <AttentionItem
          icon={<FileWarning className="h-4 w-4" />}
          label="Unsigned waivers"
          badge="2"
          badgeColor="bg-chart-3/15 text-chart-3"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </span>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon={<ClipboardCheck className="h-5 w-5 text-accent" />}
            label="Regs"
            badge={4}
          />
          <QuickAction
            icon={<CreditCard className="h-5 w-5 text-chart-3" />}
            label="Payments"
          />
          <QuickAction
            icon={<UserPlus className="h-5 w-5 text-primary" />}
            label="Invite"
          />
          <QuickAction
            icon={<Megaphone className="h-5 w-5 text-chart-5" />}
            label="Blast"
          />
        </div>
      </div>
    </aside>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-card-foreground">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function AttentionItem({
  icon,
  label,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode
  label: string
  badge: string
  badgeColor: string
}) {
  return (
    <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm font-medium text-card-foreground">{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
        {badge}
      </span>
    </button>
  )
}

function QuickAction({
  icon,
  label,
  badge,
}: {
  icon: React.ReactNode
  label: string
  badge?: number
}) {
  return (
    <button className="relative flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      {badge !== undefined && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {badge}
        </span>
      )}
      {icon}
      <span className="text-xs font-medium text-card-foreground">{label}</span>
    </button>
  )
}
