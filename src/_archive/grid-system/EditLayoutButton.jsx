// =============================================================================
// EditLayoutButton — shared FAB toggle for dashboard edit mode
// Fixed bottom-right button that toggles drag/resize editing on DashboardGrid.
// =============================================================================

export default function EditLayoutButton({ editMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-lynx-sky text-white rounded-full px-5 py-3 shadow-xl font-bold text-r-sm hover:bg-lynx-sky/90 transition-all hover:scale-105"
    >
      {editMode ? 'Done Editing' : 'Edit Layout'}
    </button>
  )
}
