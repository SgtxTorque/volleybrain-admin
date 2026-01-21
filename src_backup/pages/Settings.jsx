import React, { useState } from 'react'
import { useAuth } from '../App'
import { 
  Settings as SettingsIcon, User, Shield, Bell, 
  Database, HelpCircle, ExternalLink, ChevronRight,
  LogOut, Trash2, AlertTriangle
} from 'lucide-react'

export default function SettingsPage() {
  const { profile, organization, signOut } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { 
          id: 'profile', 
          label: 'Profile Settings', 
          description: 'Update your name, email, and password',
          icon: User,
          action: () => alert('Profile settings coming soon!')
        },
        { 
          id: 'notifications', 
          label: 'Notification Preferences', 
          description: 'Choose what notifications you receive',
          icon: Bell,
          action: () => alert('Notification settings coming soon!')
        },
      ]
    },
    {
      title: 'Organization',
      items: [
        { 
          id: 'admins', 
          label: 'Manage Admins', 
          description: 'Add or remove league administrators',
          icon: Shield,
          action: () => alert('Admin management coming soon!')
        },
        { 
          id: 'data', 
          label: 'Data & Export', 
          description: 'Export your data or manage backups',
          icon: Database,
          action: () => alert('Data export coming soon!')
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          id: 'help', 
          label: 'Help Center', 
          description: 'View documentation and guides',
          icon: HelpCircle,
          action: () => window.open('https://docs.volleybrain.app', '_blank'),
          external: true
        },
        { 
          id: 'feedback', 
          label: 'Send Feedback', 
          description: 'Help us improve VolleyBrain',
          icon: ExternalLink,
          action: () => window.open('mailto:support@volleybrain.app', '_blank'),
          external: true
        },
      ]
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and organization preferences</p>
      </div>

      {/* User Card */}
      <div className="card bg-gradient-to-r from-gold/10 to-transparent border-gold/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-2xl font-bold text-dark-darker">
            {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">{profile?.full_name || 'Admin'}</h3>
            <p className="text-gray-400">{profile?.email}</p>
            <p className="text-sm text-gold mt-1">League Administrator • {organization?.name}</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider px-1">
            {section.title}
          </h2>
          <div className="card p-0 overflow-hidden divide-y divide-dark-border">
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-4 hover:bg-dark-hover transition-colors text-left"
                >
                  <div className="p-2 rounded-xl bg-dark">
                    <Icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  {item.external ? (
                    <ExternalLink className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Danger Zone */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-red-400 uppercase tracking-wider px-1">
          Danger Zone
        </h2>
        <div className="card border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">Delete Organization</h3>
              <p className="text-sm text-gray-400 mt-1">
                Permanently delete your organization and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-3 btn-danger text-sm py-2"
              >
                <Trash2 className="w-4 h-4 mr-2 inline" />
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full btn-secondary flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>

      {/* Version */}
      <p className="text-center text-gray-600 text-sm">
        VolleyBrain Admin Portal v1.0.0
      </p>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Delete Organization?</h2>
            </div>
            
            <p className="text-gray-400 mb-6">
              This will permanently delete <strong className="text-white">{organization?.name}</strong> and all 
              associated data including players, teams, payments, and messages. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Organization deletion requires contacting support')
                  setShowDeleteConfirm(false)
                }}
                className="btn-danger flex-1"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
