// =============================================================================
// LandingPage — Lynx Beta public landing page
// Shown when no user is authenticated. Routes to login/signup via onNavigate.
// =============================================================================

import { useState, useEffect } from 'react'

// V2 Design tokens
const NAVY = '#0B1628'
const NAVY_MID = '#10284C'
const SKY = '#4BB9EC'
const GOLD = '#FFD700'
const OFF_WHITE = '#F5F6F8'

export function LandingPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="bg-[#F5F6F8]" style={{ fontFamily: "var(--v2-font, 'Plus Jakarta Sans'), 'Inter', system-ui, sans-serif" }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* ─── 1. Sticky Nav Bar ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b border-black/[0.06] transition-all duration-300 backdrop-blur-[20px] ${scrolled ? 'bg-white/95' : 'bg-white/80'}`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/lynx-logo.png" alt="Lynx" className="h-8" />
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-white px-3 py-1 rounded-full"
              style={{ background: `linear-gradient(135deg, ${SKY}, #3B9FD4)` }}>
              Early Access
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('login')}
              className="text-sm font-semibold text-[#0B1628] px-4 py-2 hover:opacity-70 transition"
            >
              Log In
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="text-sm font-bold text-white bg-lynx-navy-subtle px-6 py-2.5 rounded-full hover:brightness-110 transition"
            >
              Secure Your Spot
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* ─── 2. Big Logo Section ─── */}
      <section className="text-center pt-16 pb-10 px-6">
        <img
          src="/lynx-logo.png"
          alt="Lynx"
          className="h-[100px] mx-auto drop-shadow-lg"
        />
      </section>

      {/* ─── 3. Get Started Card ─── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-10">
        <div className="bg-white rounded-[28px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap min-h-[420px]">
            {/* Left — Copy */}
            <div style={{ flex: '1 1 400px' }} className="p-12 flex flex-col justify-center">
              <span className="inline-block w-fit text-xs font-extrabold uppercase tracking-wide px-4 py-1.5 rounded-full mb-5 border"
                style={{ background: `${SKY}15`, color: SKY, borderColor: `${SKY}30` }}>
                Beta Now Live
              </span>
              <h1 className="text-[clamp(32px,4vw,48px)] font-black text-[#0B1628] leading-[1.1] mb-4" style={{ fontFamily: 'var(--v2-font)' }}>
                Your club.<br />Powered up.
              </h1>
              <p className="text-base text-slate-500 leading-relaxed mb-8 max-w-[440px]">
                The all-in-one platform for youth sports clubs. Registration, rostering, payments,
                game day, stats, and parent communication — all in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-[15px] font-extrabold text-white px-8 py-3.5 rounded-full hover:brightness-110 hover:scale-[1.03] transition-all"
                  style={{ background: SKY, boxShadow: `0 4px 16px ${SKY}40` }}
                >
                  Secure Your Spot on the Roster &rarr;
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-[15px] font-bold text-[#0B1628] px-8 py-3.5 rounded-full border-2 border-[#0B1628]/20 hover:border-[#0B1628] transition-all"
                >
                  Log In
                </button>
              </div>
            </div>

            {/* Right — Dark hero card with mascot */}
            <div style={{ flex: '1 1 380px' }} className="min-h-[400px] relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0B1628] via-[#10284C] to-[#163A6A]">
              <FloatingBadge top="15%" left="8%" label="Game Day Ready" icon="🏐" delay={0} />
              <FloatingBadge top="12%" right="12%" label="Beta Tester" icon="⚡" delay={0.3} />
              <FloatingBadge bottom="20%" left="5%" label="Rosters Live" icon="📋" delay={0.6} />
              <FloatingBadge bottom="15%" right="8%" label="Player Stats" icon="📊" delay={0.9} />

              <img
                src="/images/celebrate.png"
                alt="Celebrating Lynx mascot"
                className="h-[85%] max-h-[360px] object-contain relative z-[2] drop-shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Feature Card ─── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-10">
        <div className="bg-white rounded-[28px] p-[clamp(32px,4vw,48px)] shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h2 className="text-[clamp(24px,3vw,36px)] font-black text-[#0B1628] text-center mb-10" style={{ fontFamily: 'var(--v2-font)' }}>
            Built for every role on the team.
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
            <FeatureSubCard
              emoji="🎯"
              title="Admin Command Center"
              description="Run the show. See everything."
              tags={['Registration', 'Payments', 'Season Setup', 'Org Dashboard']}
            />
            <FeatureSubCard
              emoji="📋"
              title="Coach's Toolkit"
              description="Your assistant coach — in your pocket."
              tags={['Lineup Builder', 'Player Evals', 'Game Day', 'Attendance']}
            />
            <FeatureSubCard
              emoji="👨‍👩‍👧"
              title="Parent Hub"
              description="Two taps. Done."
              tags={['Schedule', 'RSVP', 'Payments', 'Shoutouts']}
            />
            <FeatureSubCard
              emoji="⭐"
              title="Player Experience"
              description="Every athlete deserves to be seen."
              tags={['XP & Badges', 'Challenges', 'Streaks', 'Leaderboard']}
            />
          </div>
        </div>
      </section>

      {/* ─── 5. One Platform Card (dark) ─── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-10">
        <div className="bg-lynx-navy rounded-[28px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
          <div className="flex flex-wrap items-center min-h-[380px]">
            <div style={{ flex: '1 1 300px' }} className="flex justify-center p-10">
              <img src="/images/celebrate.png" alt="Lynx mascot" className="h-[280px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]" />
            </div>
            <div style={{ flex: '1 1 400px' }} className="py-12 pr-12 pl-6">
              <h2 className="text-[clamp(24px,3vw,36px)] font-black text-white leading-tight mb-4" style={{ fontFamily: 'var(--v2-font)' }}>
                One platform.<br />Every whistle to every trophy.
              </h2>
              <p className="text-[15px] text-white/65 leading-relaxed mb-3">
                From the first registration to the last game of the season — Lynx keeps everyone connected.
                Coaches prep. Parents stay informed. Players grow. Admins sleep at night.
              </p>
              <p className="text-[15px] text-white/65 leading-relaxed mb-7">
                No more juggling apps, spreadsheets, and group texts. One home for your entire club.
              </p>
              <button
                onClick={() => onNavigate('signup')}
                className="text-[15px] font-extrabold text-white px-8 py-3.5 rounded-full hover:brightness-110 hover:scale-[1.03] transition-all"
                style={{ background: SKY, boxShadow: `0 4px 16px ${SKY}40` }}
              >
                Get In Early &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. Starting Lineup Card (dark) ─── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-10">
        <div className="bg-lynx-navy rounded-[28px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
          <div className="flex flex-wrap items-center min-h-[380px]">
            <div style={{ flex: '1 1 300px' }} className="flex justify-center p-10">
              <img src="/images/laptoplynx.png" alt="Lynx with laptop" className="h-[280px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]" />
            </div>
            <div style={{ flex: '1 1 400px' }} className="py-12 pr-12 pl-6">
              <h2 className="text-[clamp(24px,3vw,32px)] font-black text-white leading-tight mb-4" style={{ fontFamily: 'var(--v2-font)' }}>
                You're in the starting lineup.
              </h2>
              <p className="text-[15px] text-white/65 leading-relaxed mb-6">
                Beta testers aren't just early users — you're co-builders. Your feedback shapes every feature.
                You'll get direct access to the team building Lynx, and a permanent Founding Tester badge
                in the app.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {['Early Access', 'Direct Feedback Line', 'Shape the Roadmap', 'Founding Tester Badge'].map(perk => (
                  <span key={perk} className="text-xs font-bold text-white/85 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10">
                    {perk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. Family Card (light) ─── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-10">
        <div className="bg-white rounded-[28px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center min-h-[340px]">
            <div style={{ flex: '1 1 300px' }} className="flex justify-center gap-4 p-10">
              <img src="/images/HiLynx.png" alt="Lynx waving" className="h-[200px] object-contain drop-shadow-md" />
              <img src="/images/Meet-Lynx.png" alt="Meet Lynx" className="h-[200px] object-contain drop-shadow-md" />
            </div>
            <div style={{ flex: '1 1 400px' }} className="py-12 pr-12 pl-6">
              <h2 className="text-[clamp(24px,3vw,32px)] font-black text-[#0B1628] leading-tight mb-4" style={{ fontFamily: 'var(--v2-font)' }}>
                Built for clubs.<br />Powered by families.
              </h2>
              <p className="text-[15px] text-slate-500 leading-relaxed mb-3">
                Every feature in Lynx was designed with real club directors, coaches, and parents.
                We didn't build for "youth sports" in general — we built for YOUR club.
              </p>
              <p className="text-[15px] text-slate-500 leading-relaxed">
                From the first practice to the championship match, Lynx keeps your community connected,
                your operations smooth, and your athletes growing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. Footer ─── */}
      <footer className="text-center py-10 px-6">
        <img src="/lynx-logo.png" alt="Lynx" className="h-8 opacity-50 mx-auto mb-4" />
        <p className="text-[13px] text-slate-400">
          &copy; 2026 Lynx &middot; thelynxapp.com &middot; Powered by data. Driven by heart.
        </p>
      </footer>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FloatingBadge({ label, icon, top, bottom, left, right, delay = 0 }) {
  return (
    <div className="absolute z-[3] bg-white/10 backdrop-blur-[8px] rounded-[14px] px-3.5 py-2 border border-white/[0.12] flex items-center gap-2 whitespace-nowrap"
      style={{ top, bottom, left, right, animation: `floatBadge 3s ease-in-out ${delay}s infinite alternate` }}>
      <span className="text-sm">{icon}</span>
      <span className="text-[11px] font-bold text-white/90 tracking-wide">{label}</span>
      <style>{`
        @keyframes floatBadge {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}

function FeatureSubCard({ emoji, title, description, tags }) {
  return (
    <div className="bg-[#F5F6F8] rounded-[18px] p-7 border border-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <span className="text-[28px] block mb-3">{emoji}</span>
      <h3 className="text-lg font-extrabold text-[#0B1628] mb-1.5" style={{ fontFamily: 'var(--v2-font)' }}>{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
            style={{ background: `${SKY}15`, color: SKY, borderColor: `${SKY}25` }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
