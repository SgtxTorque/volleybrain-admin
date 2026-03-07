import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Camera, Save, Mail, Phone, RefreshCw, User
} from '../../constants/icons'

// ============================================
// PROFILE INFO SECTION
// Photo upload + personal info form
// ============================================
export function ProfileInfoSection({ profile, user, isDark, tc, showToast, onProfileUpdate }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || profile.photo_url || '',
      })
    }
  }, [profile, user])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `profile-photos/${profile.id}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('media').upload(path, file)
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      set('avatar_url', publicUrl)
      // Save to the real DB column: avatar_url
      const { error: saveErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      if (saveErr) throw saveErr
      // Update both keys so MainApp's photo_url references also work in-session
      onProfileUpdate?.({ ...profile, avatar_url: publicUrl, photo_url: publicUrl })
      showToast('Photo updated', 'success')
    } catch (err) {
      console.error('Photo upload error:', err)
      showToast(`Upload failed: ${err.message}`, 'error')
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone,
      }).eq('id', profile.id)
      if (error) throw error
      onProfileUpdate?.({ ...profile, full_name: form.full_name, phone: form.phone })
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/30 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'
    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'

  return (
    <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
      <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-5`}>
        Profile Information
      </h2>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden border-[3px] shadow-lg ${
                form.avatar_url ? '' : 'bg-lynx-navy text-white'
              } ${isDark ? 'border-white/[0.15]' : 'border-slate-200'}`}
            >
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                form.full_name?.charAt(0) || '?'
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <p className={`text-r-xs ${tc.textMuted}`}>Click to change</p>
        </div>

        {/* Form Fields */}
        <div className="flex-1 space-y-4">
          <div>
            <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
            />
          </div>
          <div>
            <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Email</label>
            <div className="relative">
              <input
                type="email"
                value={form.email}
                disabled
                className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border opacity-60 cursor-not-allowed ${inputCls}`}
              />
              <Mail className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
            </div>
            <p className={`text-r-xs ${tc.textMuted} mt-1`}>Email is managed through your account settings</p>
          </div>
          <div>
            <label className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} block mb-1`}>Phone</label>
            <div className="relative">
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className={`w-full px-3 py-2 rounded-lg text-r-sm font-medium border focus:outline-none ${inputCls}`}
              />
              <Phone className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-r-sm font-bold text-white bg-lynx-navy hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
