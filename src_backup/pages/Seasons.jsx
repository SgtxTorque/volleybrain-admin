import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { 
  Calendar, Plus, Edit, Trash2, Users, 
  DollarSign, CheckCircle2, Clock, Archive,
  Loader2, ChevronDown, X, AlertCircle
} from 'lucide-react'

export default function SeasonsPage() {
  const { organization } = useAuth()
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    status: 'setup',
    registration_open: '',
    registration_close: '',
    start_date: '',
    end_date: '',
    fee_registration: 150,
    fee_uniform: 35,
    fee_monthly: 50,
    months_in_season: 3,
  })

  useEffect(() => {
    if (organization?.id) {
      loadSeasons()
    }
  }, [organization?.id])

  async function loadSeasons() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select(`
          *,
          teams:teams(count),
          players:players(count)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSeasons(data || [])
    } catch (err) {
      console.error('Error loading seasons:', err)
    } finally {
      setLoading(false)
    }
  }

  function openNewModal() {
    setEditingSeason(null)
    setFormData({
      name: '',
      status: 'setup',
      registration_open: '',
      registration_close: '',
      start_date: '',
      end_date: '',
      fee_registration: 150,
      fee_uniform: 35,
      fee_monthly: 50,
      months_in_season: 3,
    })
    setShowModal(true)
  }

  function openEditModal(season) {
    setEditingSeason(season)
    setFormData({
      name: season.name || '',
      status: season.status || 'setup',
      registration_open: season.registration_open || '',
      registration_close: season.registration_close || '',
      start_date: season.start_date || '',
      end_date: season.end_date || '',
      fee_registration: season.fee_registration || 150,
      fee_uniform: season.fee_uniform || 35,
      fee_monthly: season.fee_monthly || 50,
      months_in_season: season.months_in_season || 3,
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const seasonData = {
        organization_id: organization.id,
        name: formData.name,
        status: formData.status,
        registration_open: formData.registration_open || null,
        registration_close: formData.registration_close || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        fee_registration: parseFloat(formData.fee_registration) || 0,
        fee_uniform: parseFloat(formData.fee_uniform) || 0,
        fee_monthly: parseFloat(formData.fee_monthly) || 0,
        months_in_season: parseInt(formData.months_in_season) || 3,
      }

      if (editingSeason) {
        const { error } = await supabase
          .from('seasons')
          .update(seasonData)
          .eq('id', editingSeason.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('seasons')
          .insert(seasonData)

        if (error) throw error
      }

      setShowModal(false)
      loadSeasons()
    } catch (err) {
      console.error('Error saving season:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(season) {
    if (!confirm(`Delete "${season.name}"? This cannot be undone.`)) return

    try {
      const { error } = await supabase
        .from('seasons')
        .delete()
        .eq('id', season.id)

      if (error) throw error
      loadSeasons()
    } catch (err) {
      console.error('Error deleting season:', err)
      alert('Failed to delete: ' + err.message)
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">Active</span>
      case 'setup':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">Setup</span>
      case 'archived':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">Archived</span>
      default:
        return null
    }
  }

  const totalFee = parseFloat(formData.fee_registration || 0) + 
                   parseFloat(formData.fee_uniform || 0) + 
                   (parseFloat(formData.fee_monthly || 0) * parseInt(formData.months_in_season || 0))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Seasons</h1>
          <p className="text-gray-400 mt-1">Manage your league seasons and registration periods</p>
        </div>
        <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Season
        </button>
      </div>

      {/* Seasons Grid */}
      {seasons.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No seasons yet</h3>
          <p className="text-gray-400 mb-6">Create your first season to start accepting registrations</p>
          <button onClick={openNewModal} className="btn-primary">
            Create Season
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seasons.map((season) => (
            <div key={season.id} className="card hover:border-gold/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{season.name}</h3>
                  {getStatusBadge(season.status)}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(season)}
                    className="p-2 rounded-lg hover:bg-dark-hover text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(season)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {season.start_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">
                      {new Date(season.start_date).toLocaleDateString()} - {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400">{season.players?.[0]?.count || 0} players</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">${season.fee_registration || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingSeason ? 'Edit Season' : 'Create Season'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-dark-hover text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <label className="label">Season Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="Spring 2026"
                  required
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="select"
                >
                  <option value="setup">Setup (Not visible to parents)</option>
                  <option value="active">Active (Registration open)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Registration Opens</label>
                  <input
                    type="date"
                    value={formData.registration_open}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_open: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Registration Closes</label>
                  <input
                    type="date"
                    value={formData.registration_close}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_close: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Season Start</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Season End</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Fees */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Fee Structure</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="label">Registration</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.fee_registration}
                        onChange={(e) => setFormData(prev => ({ ...prev, fee_registration: e.target.value }))}
                        className="input pl-7"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Uniform</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.fee_uniform}
                        onChange={(e) => setFormData(prev => ({ ...prev, fee_uniform: e.target.value }))}
                        className="input pl-7"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Monthly</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.fee_monthly}
                        onChange={(e) => setFormData(prev => ({ ...prev, fee_monthly: e.target.value }))}
                        className="input pl-7"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Months</label>
                    <input
                      type="number"
                      value={formData.months_in_season}
                      onChange={(e) => setFormData(prev => ({ ...prev, months_in_season: e.target.value }))}
                      className="input"
                      min="1"
                      max="12"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="mt-4 p-4 bg-dark rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total per player</span>
                    <span className="text-2xl font-bold text-gold">${totalFee.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ${formData.fee_registration || 0} registration + ${formData.fee_uniform || 0} uniform + ${formData.fee_monthly || 0}/mo × {formData.months_in_season || 0} months
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-dark-card border-t border-dark-border p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {editingSeason ? 'Save Changes' : 'Create Season'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
