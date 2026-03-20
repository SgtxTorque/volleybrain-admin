// =============================================================================
// LandingPage — Lynx Beta public landing page
// Shown when no user is authenticated. Routes to login/signup via onNavigate.
// =============================================================================

import { useState, useEffect } from 'react'

// Design tokens
const NAVY = '#0B1628'
const NAVY_MID = '#10284C'
const SKY = '#5BCBFA'
const GOLD = '#FFD700'
const OFF_WHITE = '#F4F7FA'

export function LandingPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", background: OFF_WHITE }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* ─── 1. Sticky Nav Bar ─── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/lynx-logo.png" alt="Lynx" style={{ height: 32 }} />
            <span style={{
              background: `linear-gradient(135deg, ${SKY}, #3B9FD4)`, color: '#fff',
              fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100,
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              Early Access
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => onNavigate('login')}
              style={{ background: 'none', border: 'none', color: NAVY, fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '8px 16px' }}
            >
              Log In
            </button>
            <button
              onClick={() => onNavigate('signup')}
              style={{
                background: NAVY, color: '#fff', border: 'none', fontWeight: 700,
                fontSize: 14, padding: '10px 24px', borderRadius: 100, cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Secure Your Spot
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div style={{ height: 64 }} />

      {/* ─── 2. Big Logo Section ─── */}
      <section style={{ textAlign: 'center', padding: '60px 24px 40px' }}>
        <img
          src="/lynx-logo.png"
          alt="Lynx"
          style={{ height: 100, margin: '0 auto', filter: 'drop-shadow(0 8px 24px rgba(11,22,40,0.15))' }}
        />
      </section>

      {/* ─── 3. Get Started Card ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: 420 }}>
            {/* Left — Copy */}
            <div style={{ flex: '1 1 400px', padding: '48px 48px 48px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{
                display: 'inline-block', width: 'fit-content',
                background: `linear-gradient(135deg, ${SKY}20, ${SKY}10)`,
                color: SKY, fontSize: 12, fontWeight: 800, padding: '6px 16px',
                borderRadius: 100, letterSpacing: '0.5px', textTransform: 'uppercase',
                marginBottom: 20, border: `1px solid ${SKY}30`,
              }}>
                Beta Now Live
              </span>
              <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, color: NAVY, lineHeight: 1.1, margin: '0 0 16px' }}>
                Your club.<br />Powered up.
              </h1>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, margin: '0 0 32px', maxWidth: 440 }}>
                The all-in-one platform for youth sports clubs. Registration, rostering, payments,
                game day, stats, and parent communication — all in one place.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  onClick={() => onNavigate('signup')}
                  style={{
                    background: SKY, color: '#fff', border: 'none', fontWeight: 800,
                    fontSize: 15, padding: '14px 32px', borderRadius: 100, cursor: 'pointer',
                    transition: 'all 0.2s', boxShadow: `0 4px 16px ${SKY}40`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 6px 20px ${SKY}50` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 16px ${SKY}40` }}
                >
                  Secure Your Spot on the Roster &rarr;
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  style={{
                    background: 'transparent', color: NAVY, fontWeight: 700,
                    fontSize: 15, padding: '14px 32px', borderRadius: 100, cursor: 'pointer',
                    border: `2px solid ${NAVY}20`, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = NAVY}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${NAVY}20`}
                >
                  Log In
                </button>
              </div>
            </div>

            {/* Right — Dark hero card with mascot */}
            <div style={{
              flex: '1 1 380px', minHeight: 400, position: 'relative', overflow: 'hidden',
              background: `linear-gradient(160deg, ${NAVY}, ${NAVY_MID}, #163A6A)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Floating badges */}
              <FloatingBadge top="15%" left="8%" label="Game Day Ready" icon="🏐" delay={0} />
              <FloatingBadge top="12%" right="12%" label="Beta Tester" icon="⚡" delay={0.3} />
              <FloatingBadge bottom="20%" left="5%" label="Rosters Live" icon="📋" delay={0.6} />
              <FloatingBadge bottom="15%" right="8%" label="Player Stats" icon="📊" delay={0.9} />

              <img
                src="/images/celebrate.png"
                alt="Celebrating Lynx mascot"
                style={{ height: '85%', maxHeight: 360, objectFit: 'contain', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Feature Card ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ background: '#fff', borderRadius: 28, padding: 'clamp(32px, 4vw, 48px)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: NAVY, textAlign: 'center', margin: '0 0 40px' }}>
            Built for every role on the team.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
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
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{
          background: `linear-gradient(135deg, ${NAVY}, ${NAVY_MID})`,
          borderRadius: 28, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', minHeight: 380 }}>
            <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', padding: 40 }}>
              <img
                src="/images/celebrate.png"
                alt="Lynx mascot"
                style={{ height: 280, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
              />
            </div>
            <div style={{ flex: '1 1 400px', padding: '48px 48px 48px 24px' }}>
              <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
                One platform.<br />Every whistle to every trophy.
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: '0 0 12px' }}>
                From the first registration to the last game of the season — Lynx keeps everyone connected.
                Coaches prep. Parents stay informed. Players grow. Admins sleep at night.
              </p>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: '0 0 28px' }}>
                No more juggling apps, spreadsheets, and group texts. One home for your entire club.
              </p>
              <button
                onClick={() => onNavigate('signup')}
                style={{
                  background: SKY, color: '#fff', border: 'none', fontWeight: 800,
                  fontSize: 15, padding: '14px 32px', borderRadius: 100, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: `0 4px 16px ${SKY}40`,
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Get In Early &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. Starting Lineup Card (dark) ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{
          background: `linear-gradient(135deg, ${NAVY_MID}, ${NAVY})`,
          borderRadius: 28, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', minHeight: 380 }}>
            <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', padding: 40 }}>
              <img
                src="/images/laptoplynx.png"
                alt="Lynx with laptop"
                style={{ height: 280, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
              />
            </div>
            <div style={{ flex: '1 1 400px', padding: '48px 48px 48px 24px' }}>
              <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
                You're in the starting lineup.
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: '0 0 24px' }}>
                Beta testers aren't just early users — you're co-builders. Your feedback shapes every feature.
                You'll get direct access to the team building Lynx, and a permanent Founding Tester badge
                in the app.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['Early Access', 'Direct Feedback Line', 'Shape the Roadmap', 'Founding Tester Badge'].map(perk => (
                  <span
                    key={perk}
                    style={{
                      background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
                      fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 100,
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    {perk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. Family Card (light) ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{
          background: '#fff', borderRadius: 28, overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', minHeight: 340 }}>
            <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', gap: 16, padding: 40 }}>
              <img
                src="/images/HiLynx.png"
                alt="Lynx waving"
                style={{ height: 200, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
              />
              <img
                src="/images/Meet-Lynx.png"
                alt="Meet Lynx"
                style={{ height: 200, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
              />
            </div>
            <div style={{ flex: '1 1 400px', padding: '48px 48px 48px 24px' }}>
              <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, color: NAVY, lineHeight: 1.2, margin: '0 0 16px' }}>
                Built for clubs.<br />Powered by families.
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8, margin: '0 0 12px' }}>
                Every feature in Lynx was designed with real club directors, coaches, and parents.
                We didn't build for "youth sports" in general — we built for YOUR club.
              </p>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8, margin: 0 }}>
                From the first practice to the championship match, Lynx keeps your community connected,
                your operations smooth, and your athletes growing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. Footer ─── */}
      <footer style={{ textAlign: 'center', padding: '40px 24px 48px' }}>
        <img
          src="/lynx-logo.png"
          alt="Lynx"
          style={{ height: 32, opacity: 0.5, margin: '0 auto 16px' }}
        />
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          &copy; 2026 Lynx &middot; thelynxapp.com &middot; Powered by data. Driven by heart.
        </p>
      </footer>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FloatingBadge({ label, icon, top, bottom, left, right, delay = 0 }) {
  return (
    <div style={{
      position: 'absolute', top, bottom, left, right, zIndex: 3,
      background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)',
      borderRadius: 14, padding: '8px 14px', border: '1px solid rgba(255,255,255,0.12)',
      display: 'flex', alignItems: 'center', gap: 8,
      animation: `floatBadge 3s ease-in-out ${delay}s infinite alternate`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.90)', letterSpacing: '0.3px' }}>
        {label}
      </span>
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
    <div style={{
      background: OFF_WHITE, borderRadius: 18, padding: 28,
      border: '1px solid rgba(0,0,0,0.04)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>{emoji}</span>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: '0 0 6px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>{description}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map(tag => (
          <span
            key={tag}
            style={{
              background: `${SKY}15`, color: SKY, fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 100, border: `1px solid ${SKY}25`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
