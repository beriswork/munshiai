'use client'

import { useEffect } from 'react'

export default function MongoDBStatus() {
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/mongodb-status')
        const data = await response.json()
        if (data.status === 'connected') {
          console.log('✅ MongoDB Connected Successfully')
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        console.error('❌ MongoDB Connection Error:', error)
      }
    }

    checkConnection()
  }, [])

  return null
} 