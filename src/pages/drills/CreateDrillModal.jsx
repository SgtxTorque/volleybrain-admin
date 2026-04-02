import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useSport } from '../../contexts/SportContext'
import { supabase } from '../../lib/supabase'
import { X, Play, Upload, Plus, Trash2, Youtube, Image, Video } from 'lucide-react'
import { createDrill, updateDrill, fetchDrillCategories } from '../../lib/drill-service'
import { processVideoUrl, fetchYouTubeMetadata } from '../../lib/youtube-helpers'

const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' },
]

const COMMON_EQUIPMENT = ['Balls', 'Cones', 'Net', 'Antenna', 'Court Lines', 'Targets', 'Resistance Bands', 'Medicine Ball']

export default function CreateDrillModal({ visible, onClose, onSuccess, editDrill, orgId, showToast }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { selectedSport } = useSport()

  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoPreview, setVideoPreview] = useState(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [duration, setDuration] = useState('10')
  const [intensity, setIntensity] = useState('medium')
  const [equipment, setEquipment] = useState([])
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')

  // Media source mode: 'youtube' | 'video' | 'diagram'
  const [mediaMode, setMediaMode] = useState('youtube')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingDiagram, setUploadingDiagram] = useState(false)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('')
  const [diagramUrl, setDiagramUrl] = useState('')
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const videoFileRef = useRef(null)
  const diagramFileRef = useRef(null)

  const isEdit = !!editDrill

  useEffect(() => {
    if (visible) {
      loadCategories()
      if (editDrill) {
        setTitle(editDrill.title || '')
        setVideoUrl(editDrill.video_url || '')
        setDescription(editDrill.description || '')
        setCategory(editDrill.category || 'general')
        setDuration(String(editDrill.duration_minutes || 10))
        setIntensity(editDrill.intensity || 'medium')
        setEquipment(editDrill.equipment || [])
        setTags(editDrill.tags || [])
        setDiagramUrl(editDrill.diagram_url || '')
        setUploadedVideoUrl('')
        if (editDrill.video_url) {
          const preview = processVideoUrl(editDrill.video_url)
          setVideoPreview(preview.isValid ? preview : null)
          setMediaMode(preview.isValid ? 'youtube' : 'video')
          if (!preview.isValid) setUploadedVideoUrl(editDrill.video_url)
        }
      } else {
        resetForm()
      }
    }
  }, [visible, editDrill])

  async function loadCategories() {
    const { data } = await fetchDrillCategories({ orgId, sportId: selectedSport?.id })
    if (data) setCategories(data)
  }

  function resetForm() {
    setTitle(''); setVideoUrl(''); setVideoPreview(null); setDescription('')
    setCategory('general'); setDuration('10'); setIntensity('medium')
    setEquipment([]); setTags([]); setTagInput('')
    setMediaMode('youtube'); setUploadedVideoUrl(''); setDiagramUrl('')
  }

  async function handleVideoUrlChange(url) {
    setVideoUrl(url)
    const result = processVideoUrl(url)
    setVideoPreview(result.isValid ? result : null)

    // Auto-fill title from YouTube oEmbed if title is empty
    if (result.isValid && !title.trim()) {
      setFetchingMeta(true)
      const meta = await fetchYouTubeMetadata(url)
      if (meta?.title && !title.trim()) setTitle(meta.title)
      setFetchingMeta(false)
    }
  }

  async function handleVideoFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      showToast?.('Video must be less than 50MB', 'error')
      return
    }
    setUploadingVideo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `drill-videos/${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file, {
        cacheControl: '3600', contentType: file.type || 'video/mp4',
      })
      if (error) {
        if (error.message?.includes('not found') || error.statusCode === '404') {
          showToast?.('Storage bucket "media" not found — check Supabase storage settings', 'warning')
        } else {
          showToast?.(`Video upload failed: ${error.message}`, 'error')
        }
        return
      }
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
      if (urlData?.publicUrl) {
        setUploadedVideoUrl(urlData.publicUrl)
        showToast?.('Video uploaded', 'success')
      }
    } catch (err) {
      showToast?.(`Upload failed: ${err.message}`, 'error')
    }
    setUploadingVideo(false)
    if (videoFileRef.current) videoFileRef.current.value = ''
  }

  async function handleDiagramUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      showToast?.('Image must be less than 10MB', 'error')
      return
    }
    setUploadingDiagram(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `drill-diagrams/${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file, {
        cacheControl: '3600', contentType: file.type || 'image/png',
      })
      if (error) {
        showToast?.(`Diagram upload failed: ${error.message}`, 'error')
        return
      }
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
      if (urlData?.publicUrl) {
        setDiagramUrl(urlData.publicUrl)
        showToast?.('Diagram uploaded', 'success')
      }
    } catch (err) {
      showToast?.(`Upload failed: ${err.message}`, 'error')
    }
    setUploadingDiagram(false)
    if (diagramFileRef.current) diagramFileRef.current.value = ''
  }

  function toggleEquipment(item) {
    setEquipment(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    )
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)

    // Determine final video URL: YouTube URL takes priority, then uploaded video
    const finalVideoUrl = mediaMode === 'youtube' ? (videoUrl.trim() || null) : (uploadedVideoUrl || null)
    const finalThumbnail = mediaMode === 'youtube' ? (videoPreview?.thumbnailUrl || null) : null
    const finalSource = mediaMode === 'youtube' && videoPreview?.isValid ? 'youtube' : (uploadedVideoUrl ? 'upload' : null)

    const drillData = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      duration_minutes: Number(duration) || 10,
      intensity,
      equipment: equipment.length > 0 ? equipment : null,
      tags: tags.length > 0 ? tags : null,
      video_url: finalVideoUrl,
      video_thumbnail_url: finalThumbnail,
      video_source: finalSource,
      diagram_url: diagramUrl || null,
    }

    try {
      if (isEdit) {
        const { error } = await updateDrill(editDrill.id, drillData)
        if (error) { showToast?.('Failed to update drill', 'error'); return }
        showToast?.('Drill updated', 'success')
      } else {
        drillData.org_id = orgId
        drillData.created_by = user.id
        drillData.sport_id = selectedSport?.id || null
        const { error } = await createDrill(drillData)
        if (error) { showToast?.('Failed to create drill', 'error'); return }
        showToast?.('Drill created', 'success')
      }
      onSuccess?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  const bg = isDark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.98)'
  const border = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'
  const textColor = isDark ? 'white' : '#1a1a1a'
  const mutedColor = isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)'
  const inputBg = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textColor }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: bg, border: `1px solid ${border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
          <button onClick={onClose} className="p-1 rounded-lg transition hover:bg-white/10">
            <X className="w-5 h-5" style={{ color: textColor }} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: textColor }}>
            {isEdit ? 'Edit Drill' : 'Create Drill'}
          </h2>
          <div className="w-7" />
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Title *</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g., 4-Step Approach Hitting" maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Media Source */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Media</label>
            {/* Mode pills */}
            <div className="flex gap-1.5 mb-2">
              {[
                { id: 'youtube', label: 'YouTube URL', icon: Youtube },
                { id: 'video', label: 'Upload Video', icon: Video },
                { id: 'diagram', label: 'Upload Diagram', icon: Image },
              ].map(m => (
                <button key={m.id} onClick={() => setMediaMode(m.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition"
                  style={{
                    border: `1.5px solid ${mediaMode === m.id ? 'var(--accent-primary)' : border}`,
                    background: mediaMode === m.id ? 'rgba(75,185,236,0.08)' : 'transparent',
                    color: mediaMode === m.id ? 'var(--accent-primary)' : textColor,
                  }}>
                  <m.icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              ))}
            </div>

            {/* YouTube input */}
            {mediaMode === 'youtube' && (
              <>
                <input
                  type="url" value={videoUrl}
                  onChange={e => handleVideoUrlChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
                {fetchingMeta && (
                  <p className="text-xs mt-1" style={{ color: 'var(--accent-primary)' }}>Fetching video info...</p>
                )}
                {videoPreview?.isValid && (
                  <div className="mt-2 relative rounded-lg overflow-hidden aspect-video bg-black">
                    <img src={videoPreview.thumbnailUrl} alt="Video preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Video upload */}
            {mediaMode === 'video' && (
              <div>
                <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileUpload} />
                {uploadedVideoUrl ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: inputBg, border: `1px solid ${border}` }}>
                    <Video className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span className="text-xs truncate flex-1" style={{ color: textColor }}>Video uploaded</span>
                    <button onClick={() => setUploadedVideoUrl('')} className="p-1 rounded hover:bg-red-500/10">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => videoFileRef.current?.click()}
                    disabled={uploadingVideo}
                    className="w-full py-6 rounded-xl border-2 border-dashed text-sm font-semibold transition hover:opacity-80 flex flex-col items-center gap-2"
                    style={{ borderColor: border, color: mutedColor }}>
                    {uploadingVideo ? (
                      <div className="w-5 h-5 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Upload className="w-5 h-5" />Click to upload video (max 50MB)</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Diagram upload */}
            {mediaMode === 'diagram' && (
              <div>
                <input ref={diagramFileRef} type="file" accept="image/*" className="hidden" onChange={handleDiagramUpload} />
                {diagramUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={diagramUrl} alt="Diagram" className="w-full max-h-48 object-contain rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f8f9fa' }} />
                    <button onClick={() => setDiagramUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => diagramFileRef.current?.click()}
                    disabled={uploadingDiagram}
                    className="w-full py-6 rounded-xl border-2 border-dashed text-sm font-semibold transition hover:opacity-80 flex flex-col items-center gap-2"
                    style={{ borderColor: border, color: mutedColor }}>
                    {uploadingDiagram ? (
                      <div className="w-5 h-5 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Upload className="w-5 h-5" />Click to upload court diagram or image (max 10MB)</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder={"Setup:\n\nExecution:\n\nCoaching Points:"}
              maxLength={2000} rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ ...inputStyle, minHeight: 100 }}
            />
          </div>

          {/* Category + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Category</label>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.display_name}</option>
                ))}
                {categories.length === 0 && <option value="general">General</option>}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Duration (min)</label>
              <input
                type="number" value={duration} onChange={e => setDuration(e.target.value)}
                min="1" max="120" placeholder="10"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Intensity</label>
            <div className="flex gap-2">
              {INTENSITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setIntensity(opt.value)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
                  style={{
                    border: `1.5px solid ${intensity === opt.value ? opt.color : border}`,
                    background: intensity === opt.value ? `${opt.color}20` : 'transparent',
                    color: intensity === opt.value ? opt.color : textColor,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Equipment</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_EQUIPMENT.map(item => (
                <button
                  key={item}
                  onClick={() => toggleEquipment(item)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{
                    border: `1px solid ${equipment.includes(item) ? 'var(--accent-primary)' : border}`,
                    background: equipment.includes(item) ? 'rgba(75,185,236,0.12)' : 'transparent',
                    color: equipment.includes(item) ? 'var(--accent-primary)' : textColor,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Tags</label>
            <div className="flex gap-2">
              <input
                type="text" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add a tag..."
                className="flex-1 px-3.5 py-2 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
              <button onClick={addTag} className="px-3 py-2 rounded-xl text-sm font-bold transition hover:opacity-80"
                style={{ background: 'var(--accent-primary)', color: 'white' }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: textColor }}>
                    {tag}
                    <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="opacity-50 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-40 mt-2"
            style={{ background: 'var(--accent-primary)' }}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isEdit ? 'Save Changes' : 'Create Drill'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
