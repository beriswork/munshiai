'use client'

import { useState, useEffect } from 'react'
import { useCustomers } from '@/context/CustomerContext'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface NewCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  prefillName?: string
  onCustomerCreated?: (customer: any) => void
}

export default function NewCustomerModal({ 
  isOpen, 
  onClose, 
  prefillName = '', 
  onCustomerCreated 
}: NewCustomerModalProps) {
  const { addCustomer } = useCustomers()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    hasInitialBalance: false,
    initialBalance: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (prefillName) {
      const names = prefillName.trim().split(' ')
      setFormData(prev => ({
        ...prev,
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || ''
      }))
    }
  }, [prefillName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const newCustomer = await addCustomer({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        balance: formData.hasInitialBalance ? Number(formData.initialBalance) : 0,
        transactions: formData.hasInitialBalance ? [
          {
            id: Date.now().toString(),
            customerId: Date.now().toString(),
            date: new Date(),
            type: 'carry-forward',
            amount: Number(formData.initialBalance),
            balanceAfter: Number(formData.initialBalance),
            description: 'Opening Balance'
          }
        ] : []
      })

      if (onCustomerCreated) {
        onCustomerCreated(newCustomer)
      }
      onClose()
    } catch (error) {
      console.error('Error creating customer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalContainerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md relative"
        onClick={handleModalContainerClick}
      >
        <div className="absolute right-4 top-4">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-4">Add New Customer</h2>

        <form 
          onSubmit={handleSubmit}
          className="space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.firstName}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  firstName: e.target.value 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.lastName}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  lastName: e.target.value 
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              required
              className="input-field"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter 10-digit number"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasInitialBalance"
              checked={formData.hasInitialBalance}
              onChange={e => setFormData(prev => ({
                ...prev,
                hasInitialBalance: e.target.checked,
                initialBalance: e.target.checked ? prev.initialBalance : ''
              }))}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="hasInitialBalance" className="text-sm text-gray-700">
              Add previous balance
            </label>
          </div>

          {formData.hasInitialBalance && (
            <div>
              <input
                type="number"
                value={formData.initialBalance}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  initialBalance: e.target.value 
                }))}
                className="input-field"
                placeholder="Enter previous balance amount"
                required={formData.hasInitialBalance}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 