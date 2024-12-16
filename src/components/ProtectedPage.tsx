'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      console.log('Protected page checking auth...')
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      const authExpiry = localStorage.getItem('authExpiry')

      if (!isAuthenticated || !authExpiry) {
        console.log('No auth found in protected page')
        router.replace('/passcode')
        return
      }

      const expiryTime = parseInt(authExpiry)
      if (new Date().getTime() > expiryTime) {
        console.log('Auth expired in protected page')
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('authExpiry')
        router.replace('/passcode')
        return
      }

      console.log('Auth valid in protected page')
      setIsLoading(false)
    }

    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return children
} 