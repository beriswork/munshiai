'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [isClient, setIsClient] = useState(false)
  const [settings, setSettings] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    address: ''
  })
  const router = useRouter()

  // Only run on client-side
  useEffect(() => {
    setIsClient(true)
    // Load settings from localStorage only on client
    const savedSettings = typeof window !== 'undefined' 
      ? localStorage.getItem('businessSettings')
      : null
      
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      localStorage.setItem('businessSettings', JSON.stringify(settings))
    }
    router.push('/')
  }

  // Don't render anything during SSR
  if (!isClient) {
    return null
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Business Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Business Name
          </label>
          <input
            type="text"
            value={settings.businessName}
            onChange={e => setSettings(prev => ({ 
              ...prev, 
              businessName: e.target.value 
            }))}
            className="mt-1 input-field"
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Owner Name
          </label>
          <input
            type="text"
            value={settings.ownerName}
            onChange={e => setSettings(prev => ({ 
              ...prev, 
              ownerName: e.target.value 
            }))}
            className="mt-1 input-field"
            placeholder="Enter owner name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            value={settings.phone}
            onChange={e => setSettings(prev => ({ 
              ...prev, 
              phone: e.target.value 
            }))}
            className="mt-1 input-field"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Business Address
          </label>
          <textarea
            value={settings.address}
            onChange={e => setSettings(prev => ({ 
              ...prev, 
              address: e.target.value 
            }))}
            rows={3}
            className="mt-1 input-field"
            placeholder="Enter business address"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  )
} 