'use client'

import { useState, useRef, useEffect } from 'react'
import { useCustomers } from '@/context/CustomerContext'
import { FaPlus, FaArrowLeft } from 'react-icons/fa'
import { XMarkIcon } from '@heroicons/react/24/solid'
import Toast from './Toast'

interface CustomerSearchProps {
  onSelectCustomer: (customerId: string) => void
}

export default function CustomerSearch({ onSelectCustomer }: CustomerSearchProps) {
  const { customers, addCustomer } = useCustomers()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    hasInitialBalance: false,
    initialBalance: ''
  })

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      console.log('✅ Selected customer:', customer)
      setSearchQuery(customer.name)
      onSelectCustomer(customerId)
      setIsDropdownOpen(false)
    }
  }

  const handleNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSubmitting(true)

    try {
      console.log('🔄 Creating new customer with data:', formData)
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

      console.log('✅ Customer created successfully:', newCustomer)
      setToast({ message: 'Customer created successfully', type: 'success' })
      handleSelectCustomer(newCustomer.id)
      setShowNewCustomerForm(false)
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        hasInitialBalance: false,
        initialBalance: ''
      })
    } catch (error) {
      console.error('❌ Error creating customer:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to create customer', 
        type: 'error' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        className="input-field"
        placeholder="Search customer by name or phone"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setIsDropdownOpen(true)
          setShowNewCustomerForm(false)
        }}
        onFocus={() => setIsDropdownOpen(true)}
      />

      {/* Dropdown for search results or new customer option */}
      {isDropdownOpen && searchQuery && !showNewCustomerForm && (
        <div className="absolute z-[60] w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          {filteredCustomers.length > 0 ? (
            <ul className="py-1">
              {filteredCustomers.map(customer => (
                <li
                  key={customer.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectCustomer(customer.id)}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2">
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-blue-600"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🔄 Opening new customer form')
                  setShowNewCustomerForm(true)
                  setFormData(prev => ({
                    ...prev,
                    firstName: searchQuery
                  }))
                }}
              >
                <FaPlus className="mr-2" />
                Add "{searchQuery}" as new customer
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Customer Form */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add New Customer</h3>
                <button
                  onClick={() => setShowNewCustomerForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleNewCustomerSubmit} className="space-y-4">
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
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      phone: e.target.value 
                    }))}
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
                    onClick={() => setShowNewCustomerForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
} 