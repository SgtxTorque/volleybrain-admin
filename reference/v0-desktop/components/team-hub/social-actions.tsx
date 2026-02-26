"use client"

import { ChevronRight } from "lucide-react"

export function SocialActions() {
  return (
    <div className="flex flex-col gap-2">
      <button className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
        <span className="text-xl" role="img" aria-label="Flexing arm">
          {"💪"}
        </span>
        <span className="flex-1 text-left text-sm font-semibold text-card-foreground">
          Give a Shoutout
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
      <button className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
        <span className="text-xl" role="img" aria-label="Trophy">
          {"🏆"}
        </span>
        <span className="flex-1 text-left text-sm font-semibold text-card-foreground">
          Create Challenge
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )
}
