import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// ═══════════════════════════════════════════════════════════
// NEW POST MODAL
// ═══════════════════════════════════════════════════════════
function NewPostModal({ teamId, g, gb, dim, isDark, onClose, onSuccess, showToast, canPin = false }) {
  const { user } = useAuth()

  const [postType, setPostType] = useState('announcement')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [drag, setDrag] = useState(false)
  const [mediaFiles, setMediaFiles] = useState([]) // actual File objects
  const [mediaPreviews, setMediaPreviews] = useState([]) // preview URLs
  const [uploadProgress, setUploadProgress] = useState(null) // 'Uploading 1/3...'
  const fr = useRef(null)

  const inp = {
    background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
    border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.08)',
    borderRadius: 16,
  }

  function addFiles(files) {
    console.log('FILES SELECTED:', files)
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

      console.log('UPLOADING TO:', 'media', path)
      const { data, error } = await supabase.storage
        .from('media')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      console.log('UPLOAD RESPONSE:', data, error)
      if (error) {
        console.error('Upload error:', error, { bucket: 'media', path })
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

      console.log('PUBLIC URL:', publicUrl)
      if (publicUrl?.publicUrl) urls.push(publicUrl.publicUrl)
    }
    setUploadProgress(null)
    return urls
  }

  async function handleSubmit() {
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const mediaUrls = await uploadMedia()

      const insertPayload = {
        team_id: teamId,
        author_id: user?.id,
        title: title.trim() || null,
        content: content.trim(),
        post_type: postType,
        is_pinned: isPinned,
        is_published: true,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      }
      console.log('INSERTING POST WITH MEDIA_URLS:', mediaUrls)
      const { data: insertData, error } = await supabase.from('team_posts').insert(insertPayload).select()
      console.log('INSERT RESPONSE:', insertData, error)
      if (error) throw error
      showToast?.('Post created!', 'success')
      onSuccess()
    } catch (err) {
      console.error('Error creating post:', err)
      showToast?.('Error creating post', 'error')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 tw-ai" style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden tw-as shadow-2xl"
        style={{ background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)', border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: 28 }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
          <h2 className="text-lg font-bold uppercase tracking-wider" style={{ color: g }}>CREATE POST</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center transition text-lg"
            style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>✕</button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto tw-nos">
          <div className="flex flex-wrap gap-2">
            {[['announcement', '📢 ANNOUNCEMENT'], ['game_recap', '🏐 GAME RECAP'], ['shoutout', '⭐ SHOUTOUT'], ['milestone', '🏆 MILESTONE'], ['photo', '📷 PHOTO']].map(([k, l]) => (
              <button key={k} onClick={() => setPostType(k)} className="px-3.5 py-2 rounded-xl text-[10px] font-bold font-bold uppercase tracking-wider transition" style={{
                background: postType === k ? `${g}18` : (isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'),
                color: postType === k ? g : (isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)'),
                border: `1px solid ${postType === k ? `${g}30` : (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)')}`
              }}>{l}</button>
            ))}
          </div>

          <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-5 py-3 text-sm focus:outline-none" style={{ ...inp, color: isDark ? 'white' : '#333' }} />

          <textarea placeholder="Share with the team…" value={content} onChange={e => setContent(e.target.value)} rows={4}
            className="w-full px-5 py-3 text-sm focus:outline-none resize-none" style={{ ...inp, color: isDark ? 'white' : '#333' }} />

          <div
            onDragEnter={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={e => { e.preventDefault(); setDrag(false) }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer?.files || []) }}
            onClick={() => fr.current?.click()}
            className="border-2 border-dashed p-5 text-center cursor-pointer transition"
            style={{ borderColor: drag ? `${g}40` : (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'), background: drag ? `${g}05` : 'transparent', borderRadius: 20 }}>
            <input ref={fr} type="file" accept="image/*,video/*" multiple className="hidden"
              onChange={e => { addFiles(e.target.files || []); e.target.value = '' }} />
            <p className="text-2xl mb-1 opacity-20">📸</p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.15)' }}>DROP FILES OR CLICK</p>
          </div>

          {/* Image previews */}
          {mediaPreviews.length > 0 && (
            <div className="space-y-2">
              {mediaPreviews.map((preview, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden group">
                  {preview.type.startsWith('image/') ? (
                    <img src={preview.url} alt="" className="w-full h-auto block" />
                  ) : (
                    <div className="w-full py-8 flex items-center justify-center rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}>
                      <span className="text-lg">🎬</span>
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {canPin && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="accent-indigo-500 rounded" />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>📌 PIN TO TOP</span>
            </label>
          )}
        </div>

        <div className="p-6 flex gap-3" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-[10px] font-bold font-bold uppercase tracking-wider transition"
            style={{ border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.08)', color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>
            CANCEL
          </button>
          <button onClick={handleSubmit} disabled={!content.trim() || submitting}
            className="flex-1 py-3 rounded-xl text-[10px] font-bold font-bold uppercase tracking-wider transition hover:brightness-110 disabled:opacity-25"
            style={{ background: `linear-gradient(135deg,${gb},${g})`, color: '#0f172a', boxShadow: `0 4px 16px ${g}30` }}>
            {submitting ? (uploadProgress || 'POSTING...') : 'PUBLISH'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewPostModal
