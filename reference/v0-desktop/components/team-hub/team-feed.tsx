"use client"

import { useState } from "react"
import { TeamHero } from "./team-hero"
import { FeedTabs } from "./feed-tabs"
import { FeedComposer } from "./feed-composer"
import { FeedCard } from "./feed-card"

const posts = [
  {
    author: "Carlos test",
    initials: "CT",
    timeAgo: "1d ago",
    badge: "Photo",
    badgeColor: "bg-chart-3/10 text-chart-3",
    content: "Great Season!",
    image: "/images/team-photo.jpg",
    likes: 3,
    comments: 2,
    topComment: {
      author: "Coach Mike",
      initials: "CM",
      text: "Proud of every single one of you. Best season yet!",
      timeAgo: "22h ago",
    },
  },
  {
    author: "Coach Mike",
    initials: "CM",
    timeAgo: "3d ago",
    badge: "Announcement",
    badgeColor: "bg-warning/10 text-warning",
    content:
      "Practice moved to 6pm this Thursday due to gym availability. Please update your calendars!",
    likes: 5,
    comments: 3,
    topComment: {
      author: "Ava T.",
      initials: "AT",
      text: "Got it, thanks Coach!",
      timeAgo: "2d ago",
    },
  },
  {
    author: "Emma Davis",
    initials: "ED",
    timeAgo: "5d ago",
    badge: "Shoutout",
    badgeColor: "bg-accent/10 text-accent",
    content:
      "Huge shoutout to Sophia for that incredible save in the third set! You carried us to victory!",
    likes: 12,
    comments: 6,
    topComment: {
      author: "Sophia L.",
      initials: "SL",
      text: "Aw thanks Em! Couldn't have done it without the team setup!",
      timeAgo: "4d ago",
    },
  },
]

export function TeamFeed() {
  const [activeTab, setActiveTab] = useState("feed")

  return (
    <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-8">
      {/* Hero Banner */}
      <TeamHero />

      {/* Tab Navigation */}
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Composer with integrated quick actions */}
      <FeedComposer />

      {/* Feed Posts */}
      <div className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <FeedCard key={i} {...post} />
        ))}
      </div>
    </main>
  )
}
