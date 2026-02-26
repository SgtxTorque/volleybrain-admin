import { TopNav } from "@/components/dashboard/top-nav"
import { OrgSidebar } from "@/components/dashboard/org-sidebar"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { LiveActivity } from "@/components/dashboard/live-activity"

export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <OrgSidebar />
        <DashboardContent />
        <LiveActivity />
      </div>
    </div>
  )
}
