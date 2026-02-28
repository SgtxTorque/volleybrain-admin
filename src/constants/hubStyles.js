// ═══════════════════════════════════════════════════════════
// HUB_STYLES — Shared styles for Team Hub / FeedPost rendering
// Used by TeamWallPage and dashboard preview cards
// ═══════════════════════════════════════════════════════════

export const HUB_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes cardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes vsFlash{0%,80%,100%{opacity:.85}90%{opacity:1;text-shadow:0 0 30px rgba(239,68,68,.5)}}
  @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
  @keyframes shimmer{from{left:-100%}to{left:200%}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 8px rgba(255,255,255,.04)}50%{box-shadow:0 0 20px rgba(255,255,255,.08)}}
  @keyframes borderPulse{0%,100%{border-color:rgba(255,255,255,.08)}50%{border-color:rgba(255,255,255,.18)}}
  @keyframes cheerPop{0%{transform:translateY(0) scale(1);opacity:1}50%{transform:translateY(-40px) scale(1.4);opacity:.8}100%{transform:translateY(-80px) scale(.6);opacity:0}}
  @keyframes livePulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}70%{box-shadow:0 0 0 10px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}
  @keyframes storyRing{0%,100%{border-color:var(--ring-c1,#6366f1)}50%{border-color:var(--ring-c2,#ef4444)}}

  .tw-au{animation:fadeUp .5s ease-out both}
  .tw-ai{animation:fadeIn .4s ease-out both}
  .tw-as{animation:scaleIn .3s ease-out both}
  .tw-ac{animation:cardIn .5s ease-out both}
  .cheer-pop{animation:cheerPop .8s cubic-bezier(.17,.67,.83,.67) forwards}
  .live-pulse{animation:livePulse 2s infinite}

  /* ── Glass Cards ── */
  .tw-glass{
    background:rgba(255,255,255,.03);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.08);
    border-radius:24px;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    box-shadow:0 8px 32px rgba(0,0,0,.12)
  }
  .tw-glass:hover{border-color:rgba(255,255,255,.15);transform:translateY(-2px);box-shadow:0 16px 48px rgba(0,0,0,.2)}

  .tw-glass-glow{
    background:linear-gradient(165deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.025) 40%,rgba(10,10,15,.9) 100%);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.1);
    border-radius:24px;
    box-shadow:0 8px 32px rgba(0,0,0,.1),0 0 0 1px rgba(255,255,255,.03);
    transition:all .3s cubic-bezier(.4,0,.2,1)
  }
  .tw-glass-glow:hover{border-color:rgba(255,255,255,.18);box-shadow:0 16px 48px rgba(0,0,0,.18),0 0 20px rgba(255,255,255,.04)}

  .tw-nos::-webkit-scrollbar{display:none}.tw-nos{-ms-overflow-style:none;scrollbar-width:none}
  .tw-clift{transition:transform .2s}.tw-clift:hover{transform:translateY(-2px)}

  /* ── Post Cards (invisible at rest, hover-only) ── */
  .tw-post-card{
    background:transparent;
    border:none;
    border-radius:16px;
    transition:all 250ms;
    overflow:hidden
  }
  .tw-post-card:hover{
    background:rgba(255,255,255,.03);
    border:1px solid rgba(255,255,255,.08);
    box-shadow:0 8px 24px rgba(0,0,0,.3);
    transform:translateY(-2px)
  }

  .tw-auto-accent{border-left:3px solid rgba(99,102,241,.3);background:linear-gradient(90deg,rgba(99,102,241,.04),transparent 30%)}
  .tw-badge-accent{border-left:3px solid rgba(168,85,247,.4);background:linear-gradient(90deg,rgba(168,85,247,.04),transparent 30%)}
  .tw-reminder-accent{border-left:3px solid rgba(56,189,248,.4);background:linear-gradient(90deg,rgba(56,189,248,.04),transparent 30%)}

  /* ── Light Mode ── */
  .tw-light .tw-glass{
    background:rgba(255,255,255,.72);
    border-color:rgba(0,0,0,.06);
    box-shadow:0 4px 24px rgba(0,0,0,.07),0 0 0 1px rgba(0,0,0,.02)
  }
  .tw-light .tw-glass:hover{border-color:rgba(0,0,0,.12);box-shadow:0 16px 48px rgba(0,0,0,.1)}
  .tw-light .tw-glass-glow{
    background:linear-gradient(165deg,rgba(99,102,241,.04) 0%,rgba(255,255,255,.88) 40%,rgba(255,255,255,.95) 100%);
    border-color:rgba(0,0,0,.08);
    box-shadow:0 4px 24px rgba(0,0,0,.06)
  }
  .tw-light .tw-glass-glow:hover{box-shadow:0 16px 48px rgba(0,0,0,.1)}

  .tw-light .tw-post-card{
    background:transparent;
    border:none;
    box-shadow:none
  }
  .tw-light .tw-post-card:hover{
    background:rgba(255,255,255,.9);
    border:1px solid rgba(0,0,0,.06);
    box-shadow:0 8px 24px rgba(0,0,0,.08);
    transform:translateY(-2px)
  }
`

export function adjustBrightness(hex, amount) {
  try {
    const h = hex.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(h.substring(0, 2), 16) + amount))
    const gv = Math.max(0, Math.min(255, parseInt(h.substring(2, 4), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(h.substring(4, 6), 16) + amount))
    return `#${r.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch {
    return hex
  }
}
