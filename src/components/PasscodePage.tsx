'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { XCircleIcon } from '@heroicons/react/24/solid'
import LoadingSpinner from './LoadingSpinner'
import Toast from './Toast'

const CORRECT_PASSCODE = '112233'
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export default function PasscodePage() {
  const [passcode, setPasscode] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_ATTEMPTS)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('Checking authentication state...')
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    const authExpiry = localStorage.getItem('authExpiry')
    
    if (isAuthenticated && authExpiry) {
      console.log('Auth found:', { isAuthenticated, authExpiry })
      const expiryTime = parseInt(authExpiry)
      if (new Date().getTime() < expiryTime) {
        console.log('Valid auth, redirecting to dashboard...')
        document.cookie = `isAuthenticated=true; path=/; expires=${new Date(expiryTime).toUTCString()}`
        document.cookie = `authExpiry=${expiryTime}; path=/; expires=${new Date(expiryTime).toUTCString()}`
        
        setTimeout(() => {
          router.push('/')
        }, 100)
        return
      }
    }

    // Check if account is locked
    const storedLockoutEnd = localStorage.getItem('lockoutEndTime')
    if (storedLockoutEnd) {
      const lockoutEnd = parseInt(storedLockoutEnd)
      if (new Date().getTime() < lockoutEnd) {
        setIsLocked(true)
        setLockoutEndTime(lockoutEnd)
      } else {
        localStorage.removeItem('lockoutEndTime')
        localStorage.removeItem('remainingAttempts')
      }
    }

    // Get remaining attempts
    const storedAttempts = localStorage.getItem('remainingAttempts')
    if (storedAttempts) {
      setRemainingAttempts(parseInt(storedAttempts))
    }

    setIsLoading(false)
  }, [router])

  const handlePasscodeChange = (value: string) => {
    if (value.length <= 6) {
      setPasscode(value)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowAnimation(true)
    console.log('Attempting login...')

    await new Promise(resolve => setTimeout(resolve, 1500))

    if (passcode === CORRECT_PASSCODE) {
      console.log('Correct passcode, setting auth...')
      const now = new Date().getTime()
      const expiryTime = keepLoggedIn 
        ? now + (30 * 24 * 60 * 60 * 1000)
        : now + (24 * 60 * 60 * 1000)

      // Set both localStorage and cookies
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('authExpiry', expiryTime.toString())
      
      document.cookie = `isAuthenticated=true; path=/; expires=${new Date(expiryTime).toUTCString()}`
      document.cookie = `authExpiry=${expiryTime}; path=/; expires=${new Date(expiryTime).toUTCString()}`

      console.log('Auth set, redirecting...')
      setTimeout(() => {
        router.push('/')
      }, 100)
    } else {
      console.log('Incorrect passcode')
      const newAttempts = remainingAttempts - 1
      setRemainingAttempts(newAttempts)
      localStorage.setItem('remainingAttempts', newAttempts.toString())

      if (newAttempts <= 2) {
        setShowToast({
          message: `Warning: ${newAttempts} attempts remaining`,
          type: 'error'
        })
      }

      if (newAttempts === 0) {
        const lockoutEnd = new Date().getTime() + LOCKOUT_DURATION
        setIsLocked(true)
        setLockoutEndTime(lockoutEnd)
        localStorage.setItem('lockoutEndTime', lockoutEnd.toString())
        setShowToast({
          message: 'Account locked for 1 hour due to too many failed attempts',
          type: 'error'
        })
      }

      setError('Incorrect passcode')
    }

    setShowAnimation(false)
    setPasscode('')
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Enter Passcode
          </h2>
          {!isLocked && remainingAttempts <= 2 && (
            <p className="mt-2 text-center text-sm text-red-600 font-medium">
              Warning: {remainingAttempts} attempts remaining
            </p>
          )}
        </div>

        {isLocked ? (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Account Locked
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Too many failed attempts. Please try again in{' '}
                    {Math.ceil((lockoutEndTime! - new Date().getTime()) / (60 * 1000))} minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => handlePasscodeChange(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter 6-digit passcode"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex items-center">
              <input
                id="keep-logged-in"
                name="keep-logged-in"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="keep-logged-in" className="ml-2 block text-sm text-gray-900">
                Keep me logged in for 30 days
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={showAnimation}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  showAnimation ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {showAnimation ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </form>
        )}

        {showToast && (
          <Toast
            message={showToast.message}
            type={showToast.type}
            onClose={() => setShowToast(null)}
          />
        )}
      </div>
    </div>
  )
} 