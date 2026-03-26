import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useCallback } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// ─── Toolbar Button ─────────────────────────────────────────────────────────
function ToolbarBtn({ active, onClick, children, title }) {
  const { isDark } = useTheme()
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition ${
        active
          ? 'bg-[#4BB9EC]/20 text-[#4BB9EC]'
          : isDark
            ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
      type="button"
    >
      {children}
    </button>
  )
}

// ─── Toolbar Separator ──────────────────────────────────────────────────────
function Sep() {
  const { isDark } = useTheme()
  return <div className={`w-px h-5 mx-1 ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
}

// ─── EmailComposer ──────────────────────────────────────────────────────────
export default function EmailComposer({
  content = '',
  onChange,
  placeholder = 'Write your message...',
  onAttach,
  minHeight = 200,
}) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { organization } = useAuth()
  const [imageUploading, setImageUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: `min-height:${minHeight}px;padding:16px;color:${isDark ? '#e2e8f0' : '#1a202c'}`,
      },
    },
  })

  // ── Link insertion ──────────────────────────────────────────────────────
  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  // ── Image upload ────────────────────────────────────────────────────────
  const handleImageUpload = useCallback(async () => {
    if (!editor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/gif,image/webp'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB')
        return
      }
      setImageUploading(true)
      try {
        const orgId = organization?.id || 'default'
        const ext = file.name.split('.').pop()
        const path = `${orgId}/images/${crypto.randomUUID()}.${ext}`
        const { error } = await supabase.storage.from('email-attachments').upload(path, file)
        if (error) throw error
        const { data: urlData } = supabase.storage.from('email-attachments').getPublicUrl(path)
        if (urlData?.publicUrl) {
          editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
        }
      } catch (err) {
        console.error('Image upload error:', err)
        alert('Failed to upload image')
      }
      setImageUploading(false)
    }
    input.click()
  }, [editor, organization])

  if (!editor) return null

  return (
    <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-[#E8ECF2] bg-white'}`}>
      {/* Toolbar */}
      <div className={`flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-[#E8ECF2] bg-[#FAFBFC]'}`}>
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          H1
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          H2
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          •
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          1.
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn active={editor.isActive('link')} onClick={setLink} title="Insert Link">
          🔗
        </ToolbarBtn>
        <ToolbarBtn onClick={handleImageUpload} title="Insert Image">
          {imageUploading ? '...' : '🖼'}
        </ToolbarBtn>
        {onAttach && (
          <ToolbarBtn onClick={onAttach} title="Attach File">
            📎
          </ToolbarBtn>
        )}
        <Sep />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          ↩
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          ↪
        </ToolbarBtn>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Tiptap placeholder styling */}
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${isDark ? '#64748b' : '#94a3b8'};
          pointer-events: none;
          height: 0;
        }
        .tiptap img {
          max-width: 100%;
          border-radius: 8px;
          margin: 12px 0;
        }
        .tiptap a {
          color: #4BB9EC;
          text-decoration: underline;
        }
        .tiptap ul, .tiptap ol {
          padding-left: 1.5em;
          margin: 8px 0;
        }
        .tiptap h1 {
          font-size: 1.5em;
          font-weight: 800;
          margin: 16px 0 8px;
          color: ${isDark ? '#f1f5f9' : '#10284C'};
        }
        .tiptap h2 {
          font-size: 1.25em;
          font-weight: 700;
          margin: 12px 0 6px;
          color: ${isDark ? '#f1f5f9' : '#10284C'};
        }
        .tiptap p {
          margin: 4px 0;
        }
      `}</style>
    </div>
  )
}
