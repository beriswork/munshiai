'use client'

import { useState, useRef, useEffect } from 'react'
import { useCustomers } from '@/context/CustomerContext'
import { FaPlus } from 'react-icons/fa'
import NewCustomerModal from './NewCustomerModal'

interface CustomerSearchProps {
  onSelectCustomer: (customerId: string) => void
}

export default function CustomerSearch({ onSelectCustomer }: CustomerSearchProps) {
  const { customers } = useCustomers()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setSearchQuery(customer.name)
      onSelectCustomer(customerId)
      setIsDropdownOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        }}
        onFocus={() => setIsDropdownOpen(true)}
      />

      {isDropdownOpen && searchQuery && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCustomers.length > 0 ? (
            <ul className="py-1">
              {filteredCustomers.map(customer => (
                <li
                  key={customer.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-blue-600"
                onClick={() => {
                  setShowNewCustomerModal(true)
                  setIsDropdownOpen(false)
                }}
              >
                <FaPlus className="mr-2" />
                Add "{searchQuery}" as new customer
              </button>
            </div>
          )}
        </div>
      )}

      {showNewCustomerModal && (
        <NewCustomerModal
          isOpen={showNewCustomerModal}
          onClose={() => setShowNewCustomerModal(false)}
          prefillName={searchQuery}
        />
      )}
    </div>
  )
} 