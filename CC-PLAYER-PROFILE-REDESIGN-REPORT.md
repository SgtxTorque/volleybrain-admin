# Player Profile Redesign — Build Report

## Completed
- Two-column layout: photo gallery (360px) left, name banner + tabs right
- Removed PageShell wrapper — page now uses full viewport height
- Navy gradient name banner with all-caps first/last name, pill badges (jersey, position, status)
- Sky blue active tab underline + tab text color
- Primary photo upload wired to Supabase `media` bucket → `players.photo_url`
- Hover overlay on primary photo ("Change Photo" / "Upload Photo")
- 3 gallery placeholder slots with "coming soon" toast
- InfoTab: dense 2-column read-only grid (player info left, address + parent right)
- MedicalTab: side-by-side emergency contact + medical info
- UniformTab: side-by-side current jersey visual + preferences panel
- Reduced all spacing (mb-4→mb-2, gap-4→gap-3) across tab components

## Photo Upload Status
- Primary photo upload: **working** (uploads to `media` bucket, path `player-photos/{playerId}_{timestamp}.{ext}`)
- Gallery photos: **placeholder** (`gallery_photos` column doesn't exist on players table — slots show "+" with "coming soon" toast)
- Set as primary: **not applicable** (no gallery photos to swap)

## Layout Verification
- Two-column layout: **yes** — 360px fixed left column, flex-1 right column
- No-scroll at 1080p: **yes** for Registration, Medical, Uniform, History tabs. Waivers tab may scroll within the right column container if many waivers exist (acceptable per spec).
- Name banner typography: all-caps `text-4xl font-extrabold`, first name on line 1, last name on line 2, team name in sky blue above, pill badges below

## Files Modified
| File | Changes |
|------|---------|
| `src/pages/parent/PlayerProfilePage.jsx` | Complete layout rewrite — two-column, photo upload, V2 banner |
| `src/pages/parent/PlayerProfileInfoTab.jsx` | Dense 2-column read-only layout, tighter edit spacing |
| `src/pages/parent/PlayerProfileMedicalTab.jsx` | Side-by-side emergency + medical columns |
| `src/pages/parent/PlayerProfileUniformTab.jsx` | Side-by-side jersey visual + preferences |

## Known Limitations
- Gallery photos require a `gallery_photos` JSONB column on the `players` table (not yet created)
- "Set as Primary" swapping logic deferred until gallery_photos column exists
- Waivers tab content may exceed viewport on smaller screens — handled by contained scroll
