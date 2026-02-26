"use client"

import { ArrowRight } from "lucide-react"
import Image from "next/image"

const galleryImages = [
  "/images/gallery-1.jpg",
  "/images/gallery-2.jpg",
  "/images/gallery-3.jpg",
  "/images/team-photo.jpg",
  "/images/gallery-1.jpg",
  "/images/gallery-2.jpg",
]

const upcomingEvents = [
  { title: "Practice", date: "Sat Mar 1", time: "9:00 AM" },
  { title: "Game vs Thunder", date: "Sat Mar 8", time: "2:00 PM", highlight: "Thunder" },
  { title: "Practice", date: "Tue Mar 11", time: "6:30 PM" },
]

export function TeamWidgets() {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-border py-8 pl-6 pr-6">
      {/* Upcoming Events */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming
          </h3>
          <button className="flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80">
            Full Calendar
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {upcomingEvents.map((event, i) => (
            <div
              key={i}
              className="rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md"
            >
              <p className="text-sm font-semibold text-card-foreground">
                {event.highlight ? (
                  <>
                    {"Game vs "}
                    <span className="text-accent">{event.highlight}</span>
                  </>
                ) : (
                  event.title
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.date} &middot; {event.time}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Season Record */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Season Record
        </h3>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-accent">3</span>
            <span className="text-lg text-muted-foreground">&mdash;</span>
            <span className="text-4xl font-bold text-destructive">1</span>
          </div>
          <p className="text-sm text-muted-foreground">75% win rate</p>
        </div>
      </section>

      {/* Gallery */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Gallery
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {galleryImages.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl transition-all hover:opacity-80"
            >
              <Image
                src={src}
                alt={`Gallery photo ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
