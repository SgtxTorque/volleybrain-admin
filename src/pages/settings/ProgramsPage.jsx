import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProgram } from '../../contexts/ProgramContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Plus, Edit, Trash2, Layers } from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import ProgramFormModal from './ProgramFormModal'

export function ProgramsPage({ showToast }) {
  const { organization } = useAuth()
  const { refreshPrograms } = useProgram()
  const { sports } = useSport()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)

  useEffect(() => {
    if (organization?.id) loadPrograms()
  }, [organization?.id])

  async function loadPrograms() {
    setLoading(true)
    const { data } = await supabase
      .from('programs')
      .select('*, sport:sports(id, name, icon, color_primary), seasons:seasons(count)')
      .eq('organization_id', organization.id)
      .order('display_order', { ascending: true })
    setPrograms(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditingProgram(null)
    setShowModal(true)
  }

  function openEdit(program) {
    setEditingProgram(program)
    setShowModal(true)
  }

  async function handleSave(form, editing) {
    const cleaned = {
      name: form.name.trim(),
      sport_id: form.sport_id || null,
      icon: form.icon || null,
      description: form.description?.trim() || null,
      is_active: form.is_active,
      display_order: form.display_order || 0,
    }

    if (editing) {
      const { error } = await supabase.from('programs').update(cleaned).eq('id', editing.id)
      if (error) {
        showToast(`Error updating program: ${error.message}`, 'error')
        return
      }
      showToast('Program updated!', 'success')
    } else {
      const { error } = await supabase.from('programs').insert({
        organization_id: organization.id,
        ...cleaned,
      })
      if (error) {
        showToast(`Error creating program: ${error.message}`, 'error')
        return
      }
      showToast('Program created!', 'success')
    }

    setShowModal(false)
    loadPrograms()
    refreshPrograms()
  }

  async function handleDelete(program) {
    // Check for seasons
    const { count } = await supabase
      .from('seasons')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program.id)

    if (count > 0) {
      showToast(`Cannot delete "${program.name}" — it has ${count} season${count !== 1 ? 's' : ''}. Remove or reassign them first.`, 'error')
      return
    }

    if (!confirm(`Delete program "${program.name}"?`)) return

    const { error } = await supabase.from('programs').delete().eq('id', program.id)
    if (error) {
      showToast(`Error deleting program: ${error.message}`, 'error')
      return
    }
    showToast('Program deleted', 'success')
    loadPrograms()
    refreshPrograms()
  }

  const activeCount = programs.filter(p => p.is_active).length

  return (
    <PageShell
      title="Programs"
      subtitle="Manage organizational programs"
      breadcrumb="Setup > Programs"
      actions={
        <button onClick={openNew} className="bg-[#10284C] text-white font-bold px-5 py-2.5 rounded-xl hover:brightness-110 flex items-center gap-2" style={{ fontFamily: 'var(--v2-font)' }}>
          <Plus className="w-4 h-4" /> New Program
        </button>
      }
    >
      {/* Overview Header */}
      <div className="bg-[#10284C] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--v2-font)' }}>
              Program Management
            </h2>
            <p className="text-sm text-white/50">Programs group seasons by sport or activity type</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black italic text-[#4BB9EC]">{programs.length}</span>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Programs</div>
          </div>
        </div>
        <div className="flex gap-6 text-xs font-bold text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block" />
            {activeCount} Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
            {programs.length - activeCount} Inactive
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : programs.length === 0 ? (
        <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
          <Layers className="w-16 h-16 mx-auto text-slate-400 mb-3" />
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>No programs yet</h3>
          <p className={`text-sm mt-1 mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Create your first program to organize seasons</p>
          <button onClick={openNew} className="bg-[#10284C] text-white font-bold px-6 py-2.5 rounded-xl hover:brightness-110">
            Create Program
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map(program => {
            const seasonCount = program.seasons?.[0]?.count || 0
            return (
              <div
                key={program.id}
                className={`rounded-[14px] p-4 border transition-all ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]' : 'bg-white border-[#E8ECF2] hover:shadow-md'
                }`}
                style={{ borderLeft: `4px solid ${program.sport?.color_primary || '#4BB9EC'}` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{program.icon || program.sport?.icon || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-bold ${tc.text}`} style={{ fontFamily: 'var(--v2-font)' }}>
                        {program.name}
                      </h3>
                      {!program.is_active && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${tc.textMuted} flex items-center gap-3 mt-0.5`}>
                      {program.sport?.name && <span>{program.sport.name}</span>}
                      <span>{seasonCount} season{seasonCount !== 1 ? 's' : ''}</span>
                      {program.description && <span className="truncate max-w-[200px]">{program.description}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(program)}
                      className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(program)}
                      className="p-2 rounded-lg transition hover:bg-red-500/10 text-red-400/60 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ProgramFormModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingProgram={editingProgram}
        sports={sports}
        tc={tc}
        isDark={isDark}
        onSave={handleSave}
      />
    </PageShell>
  )
}
