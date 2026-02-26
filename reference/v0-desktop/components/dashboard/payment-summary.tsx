"use client"

import { ArrowRight } from "lucide-react"

const recentPayments = [
  { name: "Ava Test", amount: "$150" },
  { name: "Ava Test", amount: "$35" },
  { name: "Mia Anderson", amount: "$17" },
]

export function PaymentSummary() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Payment Summary
        </h3>
        <button className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80">
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-card-foreground">$1,875</span>
          <span className="text-base text-muted-foreground">/ $6,000</span>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[31%] rounded-full bg-accent transition-all" />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">31% collected</span>
          <span className="text-xs font-semibold text-destructive">$4,155 overdue</span>
        </div>
      </div>

      <div className="flex flex-col gap-0">
        <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent
        </span>
        {recentPayments.map((payment, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-t border-border py-3"
          >
            <span className="text-sm text-card-foreground">{payment.name}</span>
            <span className="text-sm font-semibold text-card-foreground">{payment.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
