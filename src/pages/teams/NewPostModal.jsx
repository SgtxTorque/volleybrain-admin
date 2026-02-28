import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { X, Image as ImageIcon, Smile } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// NEW POST MODAL — Facebook-style create post
// ═══════════════════════════════════════════════════════════
function NewPostModal({ teamId, g, gb, dim, isDark, onClose, onSuccess, showToast, canPin = false }) {
  const { user, profile } = useAuth()

  const [postType, setPostType] = useState('announcement')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [drag, setDrag] = useState(false)
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaPreviews, setMediaPreviews] = useState([])
  const [uploadProgress, setUploadProgress] = useState(null)
  const fileRef = useRef(null)
  const textareaRef = useRef(null)
  const [bgColor, setBgColor] = useState(null)
  const [showBgPicker, setShowBgPicker] = useState(false)

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.max(80, textareaRef.current.scrollHeight) + 'px'
    }
  }, [content])

  // Auto-select Photo type when photos attached
  useEffect(() => {
    if (mediaPreviews.length > 0 && postType !== 'photo') {
      setPostType('photo')
    }
  }, [mediaPreviews.length])

  const showTitle = false

  const BG_OPTIONS = [
    null, '#1A1A2E', '#E74C3C', '#FF1493', '#2C2C2C',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #ffecd2, #fcb69f)',
    'linear-gradient(135deg, #8360c3, #2ebf91)',
  ]

  // Clear bgColor when photos are attached (bg is text-only)
  useEffect(() => {
    if (mediaPreviews.length > 0 && bgColor) {
      setBgColor(null)
      setShowBgPicker(false)
    }
  }, [mediaPreviews.length])

  function insertFormat(format) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)

    if (format === 'bullet') {
      const before = content.substring(0, start)
      const lineStart = before.lastIndexOf('\n') + 1
      setContent(content.substring(0, lineStart) + '• ' + content.substring(lineStart))
    } else {
      const wrap = format === 'bold' ? '**' : format === 'italic' ? '*' : '__'
      setContent(content.substring(0, start) + wrap + selected + wrap + content.substring(end))
    }
  }

  function handleBackdropClick() {
    if (content.trim() || mediaPreviews.length > 0) {
      if (window.confirm('Discard this post?')) onClose()
    } else {
      onClose()
    }
  }

  function addFiles(files) {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (validFiles.length === 0) return
    setMediaFiles(prev => [...prev, ...validFiles])
    validFiles.forEach(f => {
      const url = URL.createObjectURL(f)
      setMediaPreviews(prev => [...prev, { name: f.name, url, type: f.type }])
    })
  }

  function removeFile(idx) {
    URL.revokeObjectURL(mediaPreviews[idx]?.url)
    setMediaFiles(prev => prev.filter((_, i) => i !== idx))
    setMediaPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function uploadMedia() {
    if (mediaFiles.length === 0) return []
    const urls = []
    for (let i = 0; i < mediaFiles.length; i++) {
      setUploadProgress(`Uploading ${i + 1}/${mediaFiles.length}...`)
      const file = mediaFiles[i]
      const ext = file.name.split('.').pop()
      const path = `team-wall/${teamId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error } = await supabase.storage
        .from('media')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg' })

      if (error) {
        console.debug('Upload error:', error, { bucket: 'media', path })
        if (error.message?.includes('not found') || error.statusCode === '404') {
          showToast?.('Storage bucket "media" not found — check Supabase storage settings', 'warning')
        } else {
          showToast?.(`Photo upload failed: ${error.message || 'Unknown error'}`, 'error')
        }
        continue
      }

      const { data: publicUrl } = supabase.storage
        .from('media')
        .getPublicUrl(data.path)

      if (publicUrl?.publicUrl) urls.push(publicUrl.publicUrl)
    }
    setUploadProgress(null)
    return urls
  }

  async function handleSubmit() {
    if (!content.trim() && mediaFiles.length === 0) return
    setSubmitting(true)
    try {
      const mediaUrls = await uploadMedia()

      const insertPayload = {
        team_id: teamId,
        author_id: user?.id,
        title: bgColor ? JSON.stringify({ bgColor }) : (showTitle && title.trim() ? title.trim() : null),
        content: content.trim() || null,
        post_type: bgColor ? 'announcement' : postType,
        is_pinned: isPinned,
        is_published: true,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      }
      const { error } = await supabase.from('team_posts').insert(insertPayload).select()
      if (error) throw error
      showToast?.('Post created!', 'success')
      onSuccess()
    } catch (err) {
      console.error('Error creating post:', err)
      showToast?.('Error creating post', 'error')
    }
    setSubmitting(false)
  }

  const canPublish = content.trim() || mediaFiles.length > 0

  // Photo preview grid (Facebook-style)
  function renderPhotoGrid() {
    const count = mediaPreviews.length
    if (count === 0) return null

    if (count === 1) {
      return (
        <div className="relative rounded-xl overflow-hidden group">
          <img src={mediaPreviews[0].url} alt="" className="w-full h-auto block" />
          <button onClick={(e) => { e.stopPropagation(); removeFile(0) }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {mediaPreviews.map((p, i) => (
            <div key={i} className="relative aspect-square group">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )
    }

    // 3+ photos: show first 4, +N overlay on last if more
    const showCount = Math.min(count, 4)
    const remaining = count - showCount

    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {mediaPreviews.slice(0, showCount).map((p, i) => (
          <div key={i} className="relative aspect-square group">
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <button onClick={(e) => { e.stopPropagation(); removeFile(i) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-10">
              <X className="w-4 h-4" />
            </button>
            {i === showCount - 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{remaining}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 tw-ai"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg overflow-hidden tw-as shadow-2xl"
        style={{
          background: isDark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.98)',
          border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.08)' }}>
          <h2 className="text-base font-bold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>Create Post</h2>
          <button
            onClick={handleBackdropClick}
            className="w-9 h-9 rounded-full flex items-center justify-center transition"
            style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto tw-nos">
          {/* User info */}
          <div className="px-5 pt-4 pb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${g}, ${gb || g})`, color: '#fff' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || '?'
              )}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                {profile?.full_name || 'You'}
              </p>
              <span className="text-[11px] px-1.5 py-0.5 rounded"
                style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', color: isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.6)' }}>
                Team Post
              </span>
            </div>
          </div>

          {/* Title field (conditional) */}
          {showTitle && (
            <div className="px-5 pt-2">
              <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-0 py-2 text-sm font-semibold bg-transparent focus:outline-none"
                style={{
                  color: isDark ? 'white' : '#1a1a1a',
                  borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)',
                }}
              />
            </div>
          )}

          {/* Auto-expanding textarea */}
          <div className="px-5 pt-2 pb-1" style={{
            ...(bgColor && {
              background: bgColor,
              minHeight: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 -1px',
              padding: '32px 24px',
            }),
          }}>
            <textarea
              ref={textareaRef}
              placeholder="What's on your mind?"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-transparent focus:outline-none resize-none leading-relaxed"
              style={{
                color: bgColor ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.85)'),
                fontSize: bgColor ? 22 : 15,
                fontWeight: bgColor ? 700 : 400,
                textAlign: bgColor ? 'center' : 'left',
                minHeight: bgColor ? 'auto' : 120,
                textShadow: bgColor ? '0 1px 4px rgba(0,0,0,.55)' : 'none',
              }}
            />
          </div>

          {/* Formatting toolbar */}
          <div className="px-5 pb-2 flex items-center gap-1">
            <button onClick={() => insertFormat('bold')} title="Bold"
              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700, color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              B
            </button>
            <button onClick={() => insertFormat('italic')} title="Italic"
              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, fontStyle: 'italic', color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              I
            </button>
            <button onClick={() => insertFormat('underline')} title="Underline"
              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, textDecoration: 'underline', color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              U
            </button>
            <button onClick={() => insertFormat('bullet')} title="Bullet Point"
              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              •
            </button>
            <div style={{ flex: 1 }} />
            {mediaPreviews.length === 0 && (
              <button onClick={() => setShowBgPicker(!showBgPicker)} title="Choose background"
                style={{
                  width: 32, height: 32, borderRadius: 8, fontSize: 14, fontWeight: 700,
                  background: bgColor || (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'),
                  color: bgColor ? '#fff' : (isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)'),
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                Aa
              </button>
            )}
          </div>

          {/* Background color picker */}
          {showBgPicker && (
            <div className="px-5 pb-2">
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="tw-hide-scrollbar">
                {BG_OPTIONS.map((bg, idx) => (
                  <button key={idx} onClick={() => setBgColor(bg)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
                      background: bg || (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'),
                      border: bgColor === bg ? '2px solid #4BB9EC' : `1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Photo preview grid */}
          {mediaPreviews.length > 0 && (
            <div className="px-5 pb-3">
              {renderPhotoGrid()}
            </div>
          )}

          {/* Drag-drop zone (show when no photos yet, or always as add-more area) */}
          <div className="px-5 pb-3">
            <div
              onDragEnter={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={e => { e.preventDefault(); setDrag(false) }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer?.files || []) }}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-3"
              style={{
                border: drag ? `2px solid ${g}` : (isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.08)'),
                background: drag ? `${g}08` : (isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)'),
                borderRadius: 12,
              }}
            >
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
                onChange={e => { addFiles(e.target.files || []); e.target.value = '' }} />
              <ImageIcon className="w-5 h-5" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }} />
              <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.55)' }}>
                {mediaPreviews.length > 0 ? 'Add more photos' : 'Add photos or drag & drop'}
              </p>
            </div>
          </div>

          {/* Post type selector */}
          <div className="px-5 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.5)' }}>
              Post Type
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[['announcement', '📢 Announcement'], ['game_recap', '🏐 Game Recap'], ['shoutout', '⭐ Shoutout'], ['milestone', '🏆 Milestone'], ['photo', '📷 Photo']].map(([k, l]) => (
                <button key={k} onClick={() => setPostType(k)}
                  className="transition"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: postType === k ? '#4BB9EC' : (isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'),
                    color: postType === k ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#10284C'),
                    border: `1.5px solid ${postType === k ? '#4BB9EC' : (isDark ? '#2A3545' : '#DFE4EA')}`,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Pin option */}
          {canPin && (
            <div className="px-5 pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)}
                  className="rounded" style={{ accentColor: g }} />
                <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.6)' }}>
                  📌 Pin to top of feed
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer — Publish button */}
        <div className="px-5 py-4" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.08)' }}>
          <button
            onClick={handleSubmit}
            disabled={!canPublish || submitting}
            className="w-full py-3 rounded-xl text-sm font-bold transition hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: canPublish ? `linear-gradient(135deg, ${gb || g}, ${g})` : (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'),
              color: canPublish ? '#fff' : (isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.5)'),
              boxShadow: canPublish ? `0 4px 16px ${g}30` : 'none',
            }}
          >
            {submitting ? (uploadProgress || 'Publishing...') : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewPostModal
