'use client'

import { useState } from 'react'
import { useCustomers } from '@/context/CustomerContext'
import CustomerSearch from './CustomerSearch'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  defaultType?: 'credit' | 'payment'
}

export default function AddTransactionModal({ 
  isOpen, 
  onClose,
  defaultType = 'credit'
}: AddTransactionModalProps) {
  const { addTransaction, customers } = useCustomers()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: defaultType,
    amount: '',
    description: '',
  })

  const selectedCustomer = selectedCustomerId 
    ? customers.find(c => c.id === selectedCustomerId)
    : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomerId) return

    addTransaction(selectedCustomerId, {
      customerId: selectedCustomerId,
      date: new Date(),
      type: formData.type as 'credit' | 'payment',
      amount: parseFloat(formData.amount),
      description: formData.description,
    })

    onClose()
    setFormData({
      type: defaultType,
      amount: '',
      description: '',
    })
    setSelectedCustomerId(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold">
            Add {formData.type === 'credit' ? 'Credit' : 'Payment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Customer
            </label>
            <CustomerSearch onSelectCustomer={setSelectedCustomerId} />
          </div>

          {selectedCustomer && (
            <>
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="font-medium">{selectedCustomer.name}</div>
                <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                <div className="mt-1 text-sm">
                  Current Balance: 
                  <span className={`font-medium ${
                    selectedCustomer.balance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ₹{Math.abs(selectedCustomer.balance).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'credit' | 'payment' 
                  }))}
                  className="input-field"
                >
                  <option value="credit">Credit (Add to Balance)</option>
                  <option value="payment">Payment (Reduce Balance)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={formData.amount}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    amount: e.target.value 
                  }))}
                  placeholder="Enter amount in INR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="input-field"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  rows={3}
                  placeholder="Add any notes about this transaction"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add {formData.type === 'credit' ? 'Credit' : 'Payment'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
} 