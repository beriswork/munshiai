const STORAGE_KEY = 'creditManager_data'

export const storage = {
  save: (data: any) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Error saving data:', error)
      return false
    }
  },

  load: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error loading data:', error)
      return null
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Error clearing data:', error)
      return false
    }
  }
} 