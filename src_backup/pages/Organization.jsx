import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { 
  Building2, MapPin, Phone, Mail, Globe, 
  Save, Loader2, Palette, Image, CheckCircle2
} from 'lucide-react'

export default function OrganizationPage() {
  const { organization, setOrganization } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    primaryColor: '#FFD700',
    logoUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        slug: organization.slug || '',
        location: organization.settings?.location || '',
        phone: organization.settings?.phone || '',
        email: organization.settings?.email || '',
        website: organization.settings?.website || '',
        primaryColor: organization.settings?.primaryColor || '#FFD700',
        logoUrl: organization.settings?.logoUrl || '',
      })
      setLoading(false)
    }
  }, [organization])

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    try {
      const { data: current } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single()

      const updatedSettings = {
        ...current?.settings,
        location: formData.location,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        primaryColor: formData.primaryColor,
        logoUrl: formData.logoUrl,
      }

      const { data, error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          slug: formData.slug,
          settings: updatedSettings
        })
        .eq('id', organization.id)
        .select()
        .single()

      if (error) throw error

      setOrganization(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving organization:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Organization Settings</h1>
          <p className="text-gray-400 mt-1">Manage your league's profile and branding</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Organization Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="Black Hornets Volleyball"
                />
              </div>

              <div>
                <label className="label">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">volleybrain.app/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="input flex-1"
                    placeholder="black-hornets"
                  />
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="input"
                  placeholder="Dallas, TX"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="input"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    placeholder="admin@blackhornets.com"
                  />
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="input"
                  placeholder="https://blackhornets.com"
                />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-gold" />
              Branding
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Primary Brand Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-16 rounded-xl cursor-pointer border-2 border-dark-border"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="input w-32 font-mono"
                    placeholder="#FFD700"
                  />
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                  className="input"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <h3 className="text-sm text-gray-400 mb-4">Preview</h3>
            
            <div className="p-6 bg-dark rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                  style={{ 
                    backgroundColor: formData.primaryColor + '20', 
                    borderColor: formData.primaryColor, 
                    borderWidth: 2 
                  }}
                >
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    '🏐'
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{formData.name || 'Organization Name'}</h3>
                  <p className="text-gray-400 text-sm">{formData.location || 'Location'}</p>
                </div>
              </div>

              {(formData.email || formData.phone) && (
                <div className="space-y-2 text-sm">
                  {formData.email && (
                    <p className="text-gray-400">{formData.email}</p>
                  )}
                  {formData.phone && (
                    <p className="text-gray-400">{formData.phone}</p>
                  )}
                </div>
              )}

              <button 
                className="mt-4 w-full py-2 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: formData.primaryColor, color: '#000' }}
              >
                Register Now
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              This is how your organization will appear to parents
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
