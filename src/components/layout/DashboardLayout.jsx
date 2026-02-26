// =============================================================================
// DashboardLayout — 3-column wrapper matching v0 page.tsx pattern
// Left sidebar (280px) | Center (flex-1) | Right sidebar (300px)
// Each column scrolls independently via overflow-y-auto
// =============================================================================

import React from 'react'

export default function DashboardLayout({ leftSidebar, rightSidebar, children }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Sidebar — 280px, hidden below xl */}
      {leftSidebar && (
        <div className="hidden xl:contents">
          {leftSidebar}
        </div>
      )}

      {/* Center Content — flex-1, scrollable */}
      <main className="flex flex-1 flex-col gap-8 overflow-y-auto py-8 px-8">
        {children}
      </main>

      {/* Right Sidebar — 300px, hidden below lg */}
      {rightSidebar && (
        <div className="hidden lg:contents">
          {rightSidebar}
        </div>
      )}
    </div>
  )
}
