// ============================================
// CARD EXPORTER
// Shared export/share/copy utilities for social cards
// ============================================

import html2canvas from 'html2canvas'

export async function exportCardAsPng(element, filename) {
  await document.fonts.ready
  await new Promise(r => setTimeout(r, 100))
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  })
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function shareCardText(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return true
    } catch (e) {
      if (e.name === 'AbortError') return false
    }
  }
  return copyCardText(text)
}

export async function copyCardText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
