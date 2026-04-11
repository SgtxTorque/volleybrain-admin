# PARITY LOG — Web / Mobile Sync Notes

Track web-only changes that may need mobile counterparts.

### April 10, 2026 (Feature Lockdown)
- WEB: Feature flag system added (src/config/feature-flags.js) — 14 advanced features hidden from nav, 3 kept visible (coachAvailability, jerseys, registrationFunnel)
- WEB: Locked features: gamePrep, standings, leaderboards, achievements, playerStats, playerPass, playerDashboard, engagement, drillLibrary, coachReflection, archives, dataExport, subscription, teamWall
- WEB: Kept visible (not core but useful now): coachAvailability, jerseys, registrationFunnel
- WEB: Core features remain: dashboard, teams, coaches, registrations, payments, schedule, attendance, chat, blasts, reports, settings, setup, roster, programs, notifications
- WEB: Platform Admin mode now has amber banner + hidden on mobile — No mobile action needed
- NOTE: Mobile should consider similar feature lockdown approach — hide advanced features until core basics are solid

### April 10, 2026
- WEB: Duplicate registration pre-check added to RegistrationCartPage and PublicRegistrationPage → Mobile registration flows should also check for existing registrations before insert
- WEB: RSVP changed from insert to upsert on AttendancePage → Mobile RSVP flows should verify they use upsert pattern
- WEB: Reports "All Seasons" mode now loads data → No mobile action needed (mobile has different reports architecture)
