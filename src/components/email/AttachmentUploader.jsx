import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024 // 25MB total (Resend limit)

export default function AttachmentUploader({ attachments = [], onChange }) {
  const { isDark } = useTheme()
  const { organization } = useAuth()
  const [uploading, setUploading] = useState(false)

  const totalSize = attachments.reduce((sum, a) => sum + (a.size || 0), 0)

  async function handleFileSelect() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPT
    input.multiple = true
    input.onchange = async (e) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      // Validate sizes
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          alert(`${file.name} exceeds 10MB limit`)
          return
        }
      }
      const newTotal = totalSize + files.reduce((s, f) => s + f.size, 0)
      if (newTotal > MAX_TOTAL_SIZE) {
        alert('Total attachment size exceeds 25MB limit')
        return
      }

      setUploading(true)
      const newAttachments = []
      const orgId = organization?.id || 'default'

      for (const file of files) {
        try {
          const ext = file.name.split('.').pop()
          const path = `${orgId}/${crypto.randomUUID()}.${ext}`
          const { error } = await supabase.storage.from('email-attachments').upload(path, file)
          if (error) throw error
          const { data: urlData } = supabase.storage.from('email-attachments').getPublicUrl(path)
          newAttachments.push({
            file_name: file.name,
            file_url: urlData?.publicUrl || '',
            file_size: file.size,
            mime_type: file.type,
            size: file.size,
          })
        } catch (err) {
          console.error('Attachment upload error:', err)
          alert(`Failed to upload ${file.name}`)
        }
      }

      onChange([...attachments, ...newAttachments])
      setUploading(false)
    }
    input.click()
  }

  function removeAttachment(idx) {
    onChange(attachments.filter((_, i) => i !== idx))
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      {attachments.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {attachments.map((att, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                isDark ? 'bg-white/[0.04] text-white' : 'bg-[#F5F6F8] text-[#10284C]'
              }`}
            >
              <span className="text-base">📎</span>
              <span className="flex-1 truncate font-medium">{att.file_name}</span>
              <span className="text-xs text-slate-400">{formatSize(att.size || att.file_size || 0)}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="text-slate-400 hover:text-red-400 transition"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <p className="text-[10px] text-slate-400">
            Total: {formatSize(totalSize)} / 25 MB
          </p>
        </div>
      )}
      <button
        onClick={handleFileSelect}
        disabled={uploading}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
          isDark
            ? 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.06]'
            : 'bg-[#F5F6F8] border border-[#E8ECF2] text-[#10284C] hover:bg-[#EDEEF1]'
        } ${uploading ? 'opacity-50' : ''}`}
        type="button"
      >
        {uploading ? 'Uploading...' : '📎 Attach Files'}
      </button>
    </div>
  )
}
