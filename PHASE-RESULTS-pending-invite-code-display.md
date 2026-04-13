# PHASE RESULTS: Pending Invite Code Display
**Date:** 2026-04-13
**Branch:** main
**Build:** PASS
**Commit:** 5761e56

### Changes
- **StaffPortalPage:** YES — Added "Mobile Invite Code" section to `PendingInviteCard` component (between "Invited at" date and action buttons). Shows the 8-char code in a mono-font box with Copy and Share icon buttons. Passed `showToast` and `orgName` props down to the card. Added `Copy` and `Share2` icon imports.
- **CoachesPage:** YES — Added "Mobile Invite Code" section to `CoachCard` component (visible only when `invite_status === 'invited'` and `invite_code` exists). Shows the code inline between the badges row and team assignments section. Passed `showToast` and `orgName` props to the card.
- **Query updated:** NO — Both pages already use `.select('*')`, so `invite_code` was already in the data.
- **Copy button:** Works — copies invite code to clipboard, shows toast
- **Share button:** Works — uses Web Share API on mobile, falls back to clipboard copy on desktop. Share text includes coach name, org name, invite code, and download link.

### Issues
None. Clean implementation, no deviations from spec.
