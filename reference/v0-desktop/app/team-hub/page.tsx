import { TopNav } from "@/components/dashboard/top-nav"
import { RosterSidebar } from "@/components/team-hub/roster-sidebar"
import { TeamFeed } from "@/components/team-hub/team-feed"
import { TeamWidgets } from "@/components/team-hub/team-widgets"

export default function TeamHubPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <RosterSidebar />
        <TeamFeed />
        <TeamWidgets />
      </div>
    </div>
  )
}
