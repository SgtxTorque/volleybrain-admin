"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ChevronDown, Globe } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { label: "Admin Dashboard", href: "/" },
  { label: "Team Hub", href: "/team-hub" },
  { label: "Parent View", href: "/parent-view" },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-nav px-6 text-nav-foreground shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nav-foreground/10">
          <Globe className="h-4 w-4" />
        </div>
        <span className="text-base font-bold tracking-widest">VOLLEYBRAIN</span>
      </div>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-nav-foreground/15 text-nav-foreground"
                  : "text-nav-foreground/70 hover:bg-nav-foreground/10 hover:text-nav-foreground"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-4">
        <span className="text-sm text-nav-foreground/70">Spring 2026</span>
        <button className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90">
          Admin
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button className="relative rounded-full p-2 transition-colors hover:bg-nav-foreground/10">
          <Bell className="h-5 w-5" />
        </button>
        <Avatar className="h-9 w-9 border-2 border-nav-foreground/20">
          <AvatarFallback className="bg-warning text-sm font-semibold text-warning-foreground">
            CT
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
