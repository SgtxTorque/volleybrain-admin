"use client"

import { Camera, Users, Award } from "lucide-react"
import Image from "next/image"

export function TeamHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-md">
      {/* Hero Image */}
      <div className="relative h-56">
        <Image
          src="/images/team-photo.jpg"
          alt="BH Elite team photo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />

        {/* Camera icon overlay */}
        <button className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-card/20 text-card backdrop-blur-sm transition-colors hover:bg-card/30">
          <Camera className="h-4 w-4" />
        </button>

        {/* Team info overlay */}
        <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg">
              BH
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card">
                BLACK HORNETS <span className="italic text-card/80">ELITE</span>
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-card/80">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  12 Players &middot; 2 Coaches
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Spring 2026
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Join Huddle Button */}
          <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:-translate-y-0.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            Join Huddle
          </button>
        </div>
      </div>
    </div>
  )
}
