# CC-FONT-SWAP — Replace Tele-Grotesk with Inter

**Spec Author:** Claude Opus 4.6
**Date:** March 5, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## CONTEXT

Carlos wants to replace Tele-Grotesk with Inter across the entire web admin. Inter is a variable font designed for screen UIs — better legibility at all sizes, optical sizing, full weight range. The two variable font files (regular + italic) are already downloaded and need to be installed in the repo.

---

## RULES

1. Read every file before modifying
2. Archive Tele-Grotesk files (don't delete)
3. Commit after each phase
4. TSC verify after each phase
5. Test all four roles render correctly

---

## PHASE 1: Install Inter Font Files

### Step 1.1: Archive old font

```bash
mkdir -p src/_archive/fonts-$(date +%Y%m%d)
cp -r public/fonts/* src/_archive/fonts-$(date +%Y%m%d)/ 2>/dev/null
```

### Step 1.2: Copy Inter variable font files into the project

The Inter font files are located at `/mnt/user-data/uploads/Inter_Manrope.zip`. Extract and copy:

```bash
# Extract the zip
cd /tmp
unzip /mnt/user-data/uploads/Inter_Manrope.zip -d inter-extract

# Copy variable font files to public/fonts/
cp /tmp/inter-extract/Inter/Inter-VariableFont_opsz,wght.ttf public/fonts/Inter-Variable.ttf
cp /tmp/inter-extract/Inter/Inter-Italic-VariableFont_opsz,wght.ttf public/fonts/Inter-Variable-Italic.ttf
```

If the zip extraction path is different, find the files:
```bash
find /tmp/inter-extract -name "*.ttf" | grep -i variable
```

### Step 1.3: Add @font-face declarations

Read the current CSS entry point:
```bash
cat src/index.css
```

Find the existing Tele-Grotesk @font-face declarations. Keep them (don't delete — just in case) but add Inter above them:

Add to the TOP of `src/index.css` (or wherever @font-face is declared):

```css
/* Inter Variable Font — primary UI font */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.ttf') format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable-Italic.ttf') format('truetype');
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}
```

The `font-weight: 100 900` tells the browser this single file covers ALL weights. The `font-display: swap` prevents invisible text during load.

### Step 1.4: Update tailwind.config.js

Read current config:
```bash
cat tailwind.config.js
```

Find the `fontFamily` section. Replace or add Inter as the primary font:

```js
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  // Keep any other font families (mono, etc.)
},
```

If Tele-Grotesk is referenced as a custom font family name (like `font-tele` or `font-grotesk`), keep the class name but point it to Inter:

```js
// If this exists:
// 'tele': ['Tele-Grotesk', ...]
// Change to:
// 'tele': ['Inter', 'system-ui', ...']
```

This way, any component using `font-tele` will automatically get Inter without needing to update every file.

### Step 1.5: Update the base body font

In `src/index.css`, find the body style and ensure it uses Inter:

```css
body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Enable Inter's optical sizing feature */
  font-optical-sizing: auto;
}
```

The `font-optical-sizing: auto` line activates Inter's built-in optical size axis — it automatically adjusts letterforms for small vs large text.

### Step 1.6: Remove any hardcoded Tele-Grotesk references in components

```bash
grep -ri "tele-grotesk\|teleGrotesk\|tele_grotesk\|font-tele\|Tele Grotesk" src/ --include="*.jsx" --include="*.js" --include="*.css" --include="*.tsx" --include="*.ts" -l
```

For each file found:
- If it's a CSS file with @font-face for Tele-Grotesk: keep it but comment it out
- If it's a component with `fontFamily: 'Tele-Grotesk'` inline style: change to `fontFamily: 'Inter'`
- If it's a Tailwind class like `font-['Tele-Grotesk']`: remove the class (the default sans will now be Inter)

### Step 1.7: Verify

```bash
npx tsc --noEmit
npm run dev &
sleep 5
```

Open in browser. Check:
- All text renders in Inter (you can verify in browser DevTools → Elements → Computed → font-family)
- No fallback to system fonts (no flash of different font)
- Text looks crisp at all sizes: 11px labels, 14px body, 32px stat numbers, 56px hero numbers
- All four roles render correctly
- No missing characters or broken layouts
- Bold/extrabold weights render correctly (Inter supports 100-900)
- Italic text renders correctly

```bash
npx tsc --noEmit
```

**Commit:** `git add -A && git commit -m "font swap: Tele-Grotesk → Inter variable font across entire web admin"`

---

## NOTES FOR CC

- **Inter is a variable font.** The two .ttf files cover ALL weights (100-900) in both normal and italic. You do NOT need to import individual weight files.
- **`font-optical-sizing: auto`** is important — it activates Inter's optical size axis which improves small text legibility. Add it to the body style.
- **Don't delete Tele-Grotesk files** from `public/fonts/`. Just archive them and comment out the @font-face declarations. The mobile app may still reference them.
- **The Tailwind `fontFamily.sans` change makes Inter the default for everything.** Any component using `font-sans` or no font class at all will get Inter.
- **If `font-tele` is used as a Tailwind class anywhere**, point it to Inter so those components don't break. Search for usage first.
- **This is a web-only change.** The mobile app (volleybrain-mobile3) is not affected.
