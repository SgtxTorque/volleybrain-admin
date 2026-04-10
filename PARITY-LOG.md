# PARITY LOG — Web / Mobile Sync Notes

Track web-only changes that may need mobile counterparts.

### April 10, 2026
- WEB: Duplicate registration pre-check added to RegistrationCartPage and PublicRegistrationPage → Mobile registration flows should also check for existing registrations before insert
- WEB: RSVP changed from insert to upsert on AttendancePage → Mobile RSVP flows should verify they use upsert pattern
- WEB: Reports "All Seasons" mode now loads data → No mobile action needed (mobile has different reports architecture)
