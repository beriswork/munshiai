import { storage } from './storage'

export const backup = {
  export: () => {
    const data = storage.load()
    if (!data) return null

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credit-manager-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  import: async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      storage.save(data)
      window.location.reload() // Refresh to load new data
      return true
    } catch (error) {
      console.error('Error importing backup:', error)
      return false
    }
  }
} 