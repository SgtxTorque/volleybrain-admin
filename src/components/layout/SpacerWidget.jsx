/**
 * SpacerWidget — invisible widget used for layout spacing.
 * No background, no border, no text, no outline.
 * Completely invisible in normal view mode.
 * In edit mode: shows a very faint dashed outline so it can be selected.
 */
export default function SpacerWidget({ editMode = false }) {
  if (!editMode) {
    return <div className="w-full h-full" />
  }
  return (
    <div className="w-full h-full border border-dashed border-slate-200/30 rounded-lg flex items-center justify-center">
      <span className="text-r-xs text-slate-300">spacer</span>
    </div>
  )
}
