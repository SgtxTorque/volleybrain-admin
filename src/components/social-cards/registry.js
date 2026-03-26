// ============================================
// SOCIAL CARD TEMPLATE REGISTRY
// Maps template IDs to metadata and components
// ============================================

export const TEMPLATE_CATEGORIES = {
  gameday: {
    label: 'Game Day',
    templates: [
      { id: 'takeover', name: 'Takeover', desc: 'Full photo with gradient sweep' },
      { id: 'split', name: 'Split', desc: 'Diagonal photo/color divide' },
      { id: 'poster', name: 'Poster', desc: 'Vignette spotlight' },
      { id: 'banner', name: 'Banner', desc: 'Geometric accent shape' },
      { id: 'scoreboard-gd', name: 'Scoreboard', desc: 'Typography driven' },
      { id: 'headline-gd', name: 'Headline', desc: 'Color bar header' },
      { id: 'minimal-gd', name: 'Minimal', desc: 'Clean light background' },
      { id: 'badge-gd', name: 'Badge', desc: 'Logo centered' },
    ]
  },
  schedule: {
    label: 'Season Schedule',
    templates: [
      { id: 'program', name: 'Program', desc: 'Photo hero + game list' },
      { id: 'program-logo', name: 'Program (Logo)', desc: 'Logo hero + game list' },
      { id: 'program-light', name: 'Program (Print)', desc: 'Light printable version' },
      { id: 'column-card', name: 'Column Card', desc: 'Wide with monthly columns' },
      { id: 'badge-sched', name: 'Badge Schedule', desc: 'Logo center + grid' },
      { id: 'split-sched', name: 'Split Schedule', desc: 'Photo + schedule side by side' },
      { id: 'minimal-sched', name: 'Fridge Ready', desc: 'Clean, printable, ink-friendly' },
    ]
  },
  results: {
    label: 'Score / Results',
    templates: [
      { id: 'scoreboard-res', name: 'Scoreboard', desc: 'Classic centered matchup' },
      { id: 'hero-score', name: 'Hero Score', desc: 'Full photo with score overlay' },
      { id: 'stat-line', name: 'Stat Line', desc: 'Score + match stats' },
      { id: 'headline-score', name: 'Headline', desc: 'Color bar + team rows' },
      { id: 'waves', name: 'Waves', desc: 'Photo left, score cards right' },
      { id: 'tri-panel', name: 'Tri-Panel', desc: 'Multi-photo strip + score' },
      { id: 'urban', name: 'Urban', desc: 'Framed photo + score cards' },
    ]
  }
}
