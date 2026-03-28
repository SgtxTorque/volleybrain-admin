# CC-TIGHTEN-ALL-ORG-SETUP-SECTIONS.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- After each phase, run verification checks as specified.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

Tighten the layout of all remaining Org Setup sections to eliminate wasted horizontal space, reduce unnecessary scrolling, and use side-by-side layouts where content doesn't justify full width. The Payment Methods section (already fixed) is the reference for the target density.

**Design principles:**
- Inputs should only be as wide as their content warrants
- Number inputs get fixed widths (w-20 to w-32), not full width
- Short text inputs (handles, URLs) go side-by-side in 2-col grids
- Toggle lists stay compact (divider rows, not individual cards)
- `SectionNumberInput` with suffix should show the suffix NEXT to the number, not at the far right edge of an 800px input
- Reduce card padding where possible (p-3 instead of p-4, py-2 instead of py-3)

**Sections being modified (in order):**
1. Online Presence — 4 stacked full-width inputs → 2x2 grid
2. Sports & Programs — reduce sport card size, tighten program cards, compact age/skill/gender
3. Fees — constrain number inputs, side-by-side layout
4. Coaches — constrain "Minimum Coach Age" input
5. Registration Settings — constrain "Max Players" input
6. Jerseys — constrain all inputs, 2-col layout
7. Notifications — constrain reminder timing inputs
8. Volunteers — constrain number inputs

**Files touched:**
- `src/pages/settings/SetupSectionContent.jsx` (all phases)

---

## PHASE 1 — Online Presence

Find the `case 'online':` block. Replace its return with:

```jsx
      case 'online':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionInput {...fp} label="Website URL" field="website" placeholder="https://www.blackhornets.com" />
              <SectionInput {...fp} label="Facebook Page" field="facebook" placeholder="https://facebook.com/blackhornetsVB" />
              <SectionInput {...fp} label="Instagram Handle" field="instagram" placeholder="@blackhornetsVB" helpText="Just the handle, no URL needed" />
              <SectionInput {...fp} label="Twitter / X Handle" field="twitter" placeholder="@blackhornetsVB" />
            </div>
            <div className={`p-3 rounded-xl ${tc.cardBgAlt}`}>
              <p className={`text-sm font-medium ${tc.text} mb-1`}>📎 Your Registration Link</p>
              <div className="flex gap-2 items-center">
                <code className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${tc.input}`}>
                  thelynxapp.com/register/{organization?.slug || 'your-org'}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://thelynxapp.com/register/${organization?.slug}`)
                    showToast('Link copied!', 'success')
                  }}
                  className="px-3 py-1.5 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: accent.primary }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )
```

### Commit message
```
refactor(setup): tighten Online Presence — 2x2 grid, compact registration link
```

---

## PHASE 2 — Sports & Programs

Find the `case 'sports':` block. Replace the return (keep the const declarations for allSports, allPrograms, allSkillLevels, allGenders, and the toggleArrayItem function unchanged). Only replace the JSX starting from `return (` through the closing `)` before `case 'legal':`.

Replace with:

```jsx
        return (
          <div className="space-y-5">
            {/* Sports Selection */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-2`}>
                Which sports does your organization offer? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {allSports.map(sport => {
                  const isEnabled = (localData.enabledSports || []).includes(sport.id)
                  return (
                    <button
                      key={sport.id}
                      onClick={() => toggleArrayItem('enabledSports', sport.id)}
                      className={`px-2 py-2 rounded-xl border-2 transition-all text-center ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : `${tc.border} ${tc.hoverBg}`
                      }`}
                    >
                      <span className="text-lg">{sport.icon}</span>
                      <p className={`text-xs font-medium mt-0.5 ${isEnabled ? tc.text : tc.textMuted}`}>{sport.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Program Types */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-2`}>
                What types of programs do you offer?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allPrograms.map(program => {
                  const isEnabled = (localData.programTypes || []).includes(program.id)
                  return (
                    <button
                      key={program.id}
                      onClick={() => toggleArrayItem('programTypes', program.id)}
                      className={`px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : `${tc.border} ${tc.hoverBg}`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{program.icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${isEnabled ? tc.text : tc.textMuted}`}>{program.name}</p>
                          <p className={`text-[10px] ${tc.textMuted}`}>{program.desc}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Age, Skill, Gender in a 2-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Age System */}
              <div className={`p-3 rounded-xl border ${tc.border}`}>
                <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>
                  Age Divisions
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateField('ageSystem', 'grade')}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-center transition-all text-sm ${
                      localData.ageSystem === 'grade'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-medium'
                        : `${tc.border}`
                    }`}
                  >
                    📚 Grade-Based
                  </button>
                  <button
                    onClick={() => updateField('ageSystem', 'age')}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-center transition-all text-sm ${
                      localData.ageSystem === 'age'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-medium'
                        : `${tc.border}`
                    }`}
                  >
                    🎂 Age-Based
                  </button>
                </div>
                {localData.ageSystem === 'age' && (
                  <div className="mt-2">
                    <label className={`block text-xs ${tc.textMuted} mb-1`}>Age cutoff (MM-DD)</label>
                    <input
                      type="text"
                      value={localData.ageCutoffDate || '08-01'}
                      onChange={(e) => updateField('ageCutoffDate', e.target.value)}
                      placeholder="08-01"
                      className={`w-24 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                    />
                  </div>
                )}
              </div>

              {/* Skill Levels + Gender */}
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>
                    Skill Levels
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {allSkillLevels.map(level => {
                      const isEnabled = (localData.skillLevels || []).includes(level.id)
                      return (
                        <button
                          key={level.id}
                          onClick={() => toggleArrayItem('skillLevels', level.id)}
                          className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all ${
                            isEnabled
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                              : `${tc.border} ${tc.textMuted}`
                          }`}
                        >
                          {level.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>
                    Gender Divisions
                  </label>
                  <div className="flex gap-2">
                    {allGenders.map(gender => {
                      const isEnabled = (localData.genderOptions || []).includes(gender.id)
                      return (
                        <button
                          key={gender.id}
                          onClick={() => toggleArrayItem('genderOptions', gender.id)}
                          className={`px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            isEnabled
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                              : `${tc.border} ${tc.textMuted}`
                          }`}
                        >
                          {gender.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
```

### Commit message
```
refactor(setup): tighten Sports & Programs — 6-col sports grid, compact programs, side-by-side age/skill/gender
```

---

## PHASE 3 — Fee Structure

Find the `case 'fees':` block. Replace its return with:

```jsx
      case 'fees':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Set default fees for new seasons. These can be overridden per season.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Default Fees */}
              <div className={`p-4 rounded-xl border ${tc.border}`}>
                <p className={`font-semibold text-sm ${tc.text} mb-3`}>💵 Default Fees</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Registration</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input type="number" value={localData.defaultRegistrationFee || ''} onChange={(e) => updateField('defaultRegistrationFee', parseFloat(e.target.value) || 0)}
                        className={`w-28 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Uniform</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input type="number" value={localData.defaultUniformFee || ''} onChange={(e) => updateField('defaultUniformFee', parseFloat(e.target.value) || 0)}
                        className={`w-28 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Monthly</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input type="number" value={localData.defaultMonthlyFee || ''} onChange={(e) => updateField('defaultMonthlyFee', parseFloat(e.target.value) || 0)}
                        className={`w-28 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Discounts */}
              <div className={`p-4 rounded-xl border ${tc.border}`}>
                <p className={`font-semibold text-sm ${tc.text} mb-3`}>🎁 Discounts</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Early Bird</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input type="number" value={localData.earlyBirdDiscount || ''} onChange={(e) => updateField('earlyBirdDiscount', parseFloat(e.target.value) || 0)}
                        className={`w-28 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Sibling</label>
                    <div className="relative">
                      <input type="number" value={localData.siblingDiscount || ''} onChange={(e) => updateField('siblingDiscount', parseFloat(e.target.value) || 0)}
                        className={`w-28 pr-8 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Multi-Sport</label>
                    <div className="relative">
                      <input type="number" value={localData.multiSportDiscount || ''} onChange={(e) => updateField('multiSportDiscount', parseFloat(e.target.value) || 0)}
                        className={`w-28 pr-8 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl ${tc.cardBgAlt}`}>
              <p className={`text-sm ${tc.text}`}>
                💡 <strong>Example:</strong> 2 kids registering early =
                <span className="font-semibold ml-1" style={{ color: accent.primary }}>
                  ${((localData.defaultRegistrationFee || 150) * 2) - (localData.earlyBirdDiscount || 25) - ((localData.defaultRegistrationFee || 150) * (localData.siblingDiscount || 10) / 100)}
                </span>
                <span className={`${tc.textMuted}`}> (instead of ${(localData.defaultRegistrationFee || 150) * 2})</span>
              </p>
            </div>
          </div>
        )
```

### Commit message
```
refactor(setup): tighten Fee Structure — 2-col grid, inline label+input rows, compact number fields
```

---

## PHASE 4 — Coaches + Registration Settings

Find the `case 'coaches':` block. Replace its return with:

```jsx
      case 'coaches':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Set requirements for coaches before they can be assigned to teams.</p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
              <div className={`space-y-1 divide-y ${tc.border}`}>
                <SectionToggle {...fp} label="Require Background Check" field="requireBackgroundCheck" helpText="Must complete before coaching" />
                <SectionToggle {...fp} label="Require SafeSport Certification" field="requireSafeSport" helpText="USAV/USA Sports requirement" />
                <SectionToggle {...fp} label="Require CPR/First Aid" field="requireCPR" helpText="Current certification" />
              </div>
              <div className={`p-4 rounded-xl border ${tc.border} self-start`}>
                <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Min Coach Age</label>
                <div className="relative">
                  <input type="number" value={localData.coachMinAge || ''} onChange={(e) => updateField('coachMinAge', parseFloat(e.target.value) || 0)}
                    className={`w-24 pr-12 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>years</span>
                </div>
              </div>
            </div>
          </div>
        )
```

Find the `case 'registration':` block. Replace its return with:

```jsx
      case 'registration':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Control how the registration process works.</p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
              <div className={`space-y-1 divide-y ${tc.border}`}>
                <SectionToggle {...fp} label="Auto-Approve Registrations" field="autoApproveRegistrations" helpText="Skip manual review step" />
                <SectionToggle {...fp} label="Require Payment to Complete" field="requirePaymentToComplete" helpText="Must pay before registration is confirmed" />
                <SectionToggle {...fp} label="Allow Waitlist" field="allowWaitlist" helpText="When teams/seasons are full" />
              </div>
              <div className={`p-4 rounded-xl border ${tc.border} self-start`}>
                <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Max Players per Reg</label>
                <input type="number" value={localData.maxPlayersPerRegistration || ''} onChange={(e) => updateField('maxPlayersPerRegistration', parseFloat(e.target.value) || 0)}
                  className={`w-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                <p className={`text-[10px] ${tc.textMuted} mt-1`}>Siblings in one form</p>
              </div>
            </div>
          </div>
        )
```

### Commit message
```
refactor(setup): tighten Coaches + Registration Settings — toggles left, number input right
```

---

## PHASE 5 — Jerseys, Notifications, Volunteers

Find the `case 'jerseys':` block. Replace its return with:

```jsx
      case 'jerseys':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Configure jersey/uniform settings.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Jersey Vendor</label>
                  <input type="text" value={localData.jerseyVendor || ''} onChange={(e) => updateField('jerseyVendor', e.target.value)}
                    placeholder="Company name" className={`w-full max-w-xs px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Order Lead Time</label>
                  <div className="relative w-32">
                    <input type="number" value={localData.jerseyLeadTime || ''} onChange={(e) => updateField('jerseyLeadTime', parseFloat(e.target.value) || 0)}
                      className={`w-full pr-14 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>weeks</span>
                  </div>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Number Range</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={localData.jerseyNumberStart || ''} onChange={(e) => updateField('jerseyNumberStart', parseFloat(e.target.value) || 0)}
                    min={0} max={99} placeholder="1" className={`w-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                  <span className={`text-sm ${tc.textMuted}`}>to</span>
                  <input type="number" value={localData.jerseyNumberEnd || ''} onChange={(e) => updateField('jerseyNumberEnd', parseFloat(e.target.value) || 0)}
                    min={1} max={99} placeholder="99" className={`w-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                </div>
              </div>
            </div>
          </div>
        )
```

Find the `case 'notifications':` block. In the **Reminder Timing** section only, replace:

```jsx
              <div className="space-y-4">
                <SectionNumberInput {...fp} label="Game Reminder" field="gameReminderHours" suffix="hours before" />
                <SectionNumberInput {...fp} label="Practice Reminder" field="practiceReminderHours" suffix="hours before" />
                <SectionNumberInput {...fp} label="Payment Reminder" field="paymentReminderDays" suffix="days before due" />
              </div>
```

With:

```jsx
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className={`text-sm ${tc.text} w-36`}>Game Reminder</label>
                  <div className="relative">
                    <input type="number" value={localData.gameReminderHours || ''} onChange={(e) => updateField('gameReminderHours', parseFloat(e.target.value) || 0)}
                      className={`w-28 pr-16 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${tc.textMuted}`}>hrs before</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`text-sm ${tc.text} w-36`}>Practice Reminder</label>
                  <div className="relative">
                    <input type="number" value={localData.practiceReminderHours || ''} onChange={(e) => updateField('practiceReminderHours', parseFloat(e.target.value) || 0)}
                      className={`w-28 pr-16 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${tc.textMuted}`}>hrs before</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`text-sm ${tc.text} w-36`}>Payment Reminder</label>
                  <div className="relative">
                    <input type="number" value={localData.paymentReminderDays || ''} onChange={(e) => updateField('paymentReminderDays', parseFloat(e.target.value) || 0)}
                      className={`w-28 pr-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${tc.textMuted}`}>days before</span>
                  </div>
                </div>
              </div>
```

Find the `case 'volunteers':` block. Replace its return with:

```jsx
      case 'volunteers':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Configure volunteer requirements for families.</p>

            <SectionToggle {...fp} label="Require Volunteer Hours" field="requireVolunteerHours" helpText="Families must volunteer or pay buyout" />

            {localData.requireVolunteerHours && (
              <div className="pl-4 border-l-2 border-slate-600 flex gap-6">
                <div>
                  <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Hours Required</label>
                  <div className="relative">
                    <input type="number" value={localData.volunteerHoursRequired || ''} onChange={(e) => updateField('volunteerHoursRequired', parseFloat(e.target.value) || 0)}
                      className={`w-24 pr-12 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>hrs</span>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Buyout Amount</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                    <input type="number" value={localData.volunteerBuyoutAmount || ''} onChange={(e) => updateField('volunteerBuyoutAmount', parseFloat(e.target.value) || 0)}
                      className={`w-24 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                  </div>
                  <p className={`text-[10px] ${tc.textMuted} mt-1`}>Pay instead of volunteering</p>
                </div>
              </div>
            )}
          </div>
        )
```

### Commit message
```
refactor(setup): tighten Jerseys, Notifications, Volunteers — constrained inputs, inline labels
```

---

## POST-EXECUTION QA CHECKLIST

1. **Online Presence:** 2x2 grid of inputs, registration link compact below
2. **Sports:** 6-col grid (smaller cards), programs in 3-col, age/skill/gender side-by-side at bottom
3. **Fees:** 2-col grid — fees left, discounts right. Inline label+input rows. Example calculation compact.
4. **Coaches:** Toggles on left, "Min Coach Age" in a card on the right
5. **Registration Settings:** Same pattern — toggles left, "Max Players" on right
6. **Jerseys:** 2-col — vendor + lead time left, number range right. All compact.
7. **Notifications:** Reminder timing rows have inline labels with compact number inputs, suffix visible next to number
8. **Volunteers:** Hours and buyout side-by-side when enabled, compact inputs
9. **All saves still work** — toggle values, number inputs, text inputs all persist correctly
10. **Mobile:** Everything stacks to single column on small screens
