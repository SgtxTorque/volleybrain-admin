# CC-LOGIN-FOOTER-LINKS.md
# LYNX WEB — Add Privacy Policy & Terms links to login page
# Classification: EXECUTE
# REPO: volleybrain-admin

---

## RULES
1. Change ONLY `src/pages/auth/LoginPage.jsx`
2. Do NOT modify any other file

---

## TASK 1: Add legal links below the Browse Organizations section
**Commit message:** `feat: add privacy policy and terms links to login footer`

### File: `src/pages/auth/LoginPage.jsx`

Find this block (around lines 278-287):
```jsx
        <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm mb-2">Looking for a league?</p>
          <a
            href="/directory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: '#5BCBFA' }}
          >
            Browse Organizations
          </a>
        </div>
```

Add this block IMMEDIATELY AFTER the closing `</div>` of that section (before the `</div>` tags that close the page):

```jsx
        <div className="text-center mt-6 pb-4">
          <a href="/privacy-policy" className="text-slate-500 hover:text-slate-300 text-xs transition">Privacy Policy</a>
          <span className="text-slate-600 mx-2">·</span>
          <a href="/terms" className="text-slate-500 hover:text-slate-300 text-xs transition">Terms of Service</a>
        </div>
```

### DO NOT TOUCH:
- Any other part of LoginPage.jsx
- Any other file

### Commit and push:
```bash
git add src/pages/auth/LoginPage.jsx
git commit -m "feat: add privacy policy and terms links to login footer"
git push origin main
```
