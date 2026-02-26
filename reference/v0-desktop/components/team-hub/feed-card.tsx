"use client"

import { MoreHorizontal, ThumbsUp, MessageCircle, Share2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"

interface Comment {
  author: string
  initials: string
  text: string
  timeAgo: string
}

interface FeedCardProps {
  author: string
  initials: string
  timeAgo: string
  badge?: string
  badgeColor?: string
  content: string
  image?: string
  likes: number
  comments: number
  topComment?: Comment
}

export function FeedCard({
  author,
  initials,
  timeAgo,
  badge,
  badgeColor = "bg-chart-3/10 text-chart-3",
  content,
  image,
  likes,
  comments,
  topComment,
}: FeedCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-card-foreground">{author}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {badge && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
        <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-card-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-sm text-card-foreground leading-relaxed">{content}</p>
      </div>

      {/* Full-bleed Image */}
      {image && (
        <div className="relative h-72 w-full bg-primary/5">
          <Image
            src={image}
            alt="Post image"
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Engagement summary */}
      <div className="flex items-center gap-4 px-5 py-2.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className="h-3.5 w-3.5 text-warning" />
          {likes}
        </span>
        <span className="text-xs text-muted-foreground">
          {comments} {comments === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* Action bar */}
      <div className="flex items-center border-t border-border">
        <button className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-card-foreground">
          <ThumbsUp className="h-[18px] w-[18px]" />
          <span>Like</span>
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-card-foreground">
          <MessageCircle className="h-[18px] w-[18px]" />
          <span>Comment</span>
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-card-foreground">
          <Share2 className="h-[18px] w-[18px]" />
          <span>Share</span>
        </button>
      </div>

      {/* Inline top comment */}
      {topComment && (
        <div className="flex gap-3 border-t border-border px-5 py-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-secondary text-xs font-semibold text-muted-foreground">
              {topComment.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 rounded-xl bg-secondary/60 px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-card-foreground">{topComment.author}</span>
              <span className="text-[11px] text-muted-foreground">{topComment.timeAgo}</span>
            </div>
            <p className="mt-0.5 text-xs text-card-foreground leading-relaxed">{topComment.text}</p>
          </div>
        </div>
      )}
    </div>
  )
}
