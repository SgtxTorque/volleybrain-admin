# QA Final Test Accounts — Fresh Environment
## Created: April 17, 2026

---

## ORGANIZATION
| Field | Value |
|-------|-------|
| Name | QA Final Verification Club |
| ID | `0d5f63a3-5712-4821-be23-a626db256b1e` |
| Slug | `qa-final-verification-mo39h6u8` |

---

## ADMIN ACCOUNT
| Field | Value |
|-------|-------|
| Email | `qa.admin.final@example.com` |
| Password | `Test1234` |
| User ID | `8b9e82df-408b-4bd8-9903-1f46c9c708f8` |
| Role | `league_admin` |

---

## COACH (no auth account — enters invite code during signup)
| Field | Value |
|-------|-------|
| Email | `qa.coach.final@example.com` |
| Password | `Test1234` (coach creates this during signup) |
| Invite Code | `SVG6C8BK` |
| Coach Row ID | `d8d87218-e581-4fa9-ba6b-1d7ac251fb66` |
| Assigned To | QA Panthers 14U (head coach) |

---

## PARENT (created during registration testing)
| Field | Value |
|-------|-------|
| Email | `qa.parent.final@example.com` |
| Password | `Test1234` (parent creates this during registration) |

---

## PROGRAM
| Field | Value |
|-------|-------|
| Name | Volleyball |
| ID | `4877d1c5-f441-4200-be98-c121d640923e` |

---

## SEASON
| Field | Value |
|-------|-------|
| Name | Spring 2026 |
| ID | `805daf22-cb58-40ec-b800-9a28068a874c` |
| Status | active |
| Registration Open | 2026-04-17 → 2026-05-15 |
| Season Dates | 2026-04-20 → 2026-06-15 |
| Fees | $150 registration + $45 uniform + $50/mo × 3 months |

---

## TEAMS
| Team | ID | Age Group | Skill Level |
|------|----|-----------|-------------|
| QA Panthers 14U | `d7e1427f-3682-4c67-921b-5c4c7d8a832a` | 14U | recreational |
| QA Panthers 16U | `1be5e348-1a06-4b6b-8200-53626ec6b605` | 16U | competitive |

---

## VENUE
| Field | Value |
|-------|-------|
| Name | QA Community Center |
| Address | 123 Test Street, Little Elm, TX 75068 |

---

## REGISTRATION URL
```
https://www.thelynxapp.com/register/qa-final-verification-mo39h6u8/805daf22-cb58-40ec-b800-9a28068a874c
```

---

## TESTING FLOW
1. **Admin**: Log in with `qa.admin.final@example.com` / `Test1234` → verify dashboard, teams, season
2. **Coach**: Use invite code `SVG6C8BK` during signup at `/join/coach` → verify onboarding, team assignment
3. **Parent**: Register a child via the registration URL above → verify registration flow, payments page
4. **Admin lifecycle**: Approve registration → assign to team → verify end-to-end pipeline

---

## SCRIPT
Created by `scripts/create-fresh-test-env.mjs` with schema fixes for:
- `teams` table: uses `season_id` + `color` + `skill_level` (not `organization_id` / `primary_color` / `division_type`)
- `coaches` table: uses `season_id` + `invite_status` (not `organization_id` / `status`)
- `venues` table: uses `city` + `state` + `zip` + `is_active` (not `type`)
