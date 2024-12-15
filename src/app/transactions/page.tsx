'use client'

import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { useCustomers } from '@/context/CustomerContext'
import MonthSelector from '@/components/MonthSelector'
import { ChevronDownIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

type SortField = 'date' | 'customerName' | 'type' | 'amount'
type SortOrder = 'asc' | 'desc'
type TransactionType = 'all' | 'credit' | 'cash' | 'payment' | 'carry-forward'

interface TransactionExport {
  Date: string
  Customer: string
  Type: string
  Amount: number
  'Amount (₹)': string
  [key: string]: string | number  // Add index signature
}

export default function TransactionsPage() {
  const { customers } = useCustomers()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedType, setSelectedType] = useState<TransactionType>('all')
  const transactionsPerPage = 50
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

  // Add ref for dropdown click handling
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  // Get unique customer names for search
  const uniqueCustomers = Array.from(new Set(
    customers.map(customer => customer.name)
  )).sort()

  // Get all transactions with date and customer filtering
  const allTransactions = customers.flatMap(customer => 
    customer.transactions.map(t => ({
      ...t,
      customerName: customer.name
    }))
  ).filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const startDate = startOfMonth(selectedDate)
    const endDate = endOfMonth(selectedDate)
    const dateMatch = transactionDate >= startDate && transactionDate <= endDate
    const customerMatch = selectedCustomer ? transaction.customerName === selectedCustomer : true
    return dateMatch && customerMatch
  })

  // Apply type filter
  const filteredTransactions = allTransactions.filter(transaction => 
    selectedType === 'all' ? true : transaction.type === selectedType
  )

  // Apply sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === 'date') {
      return sortOrder === 'desc' 
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    if (sortField === 'amount') {
      return sortOrder === 'desc' 
        ? b.amount - a.amount
        : a.amount - b.amount
    }
    if (sortField === 'customerName') {
      return sortOrder === 'desc'
        ? b.customerName.localeCompare(a.customerName)
        : a.customerName.localeCompare(b.customerName)
    }
    if (sortField === 'type') {
      return sortOrder === 'desc'
        ? b.type.localeCompare(a.type)
        : a.type.localeCompare(b.type)
    }
    return 0
  })

  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage)
  const currentTransactions = sortedTransactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Add export function
  const handleExport = () => {
    const headers = ['Date', 'Customer', 'Type', 'Amount (₹)'] as const
    
    const dataToExport: TransactionExport[] = sortedTransactions.map(transaction => ({
      Date: format(new Date(transaction.date), 'MMM dd, yyyy'),
      Customer: transaction.customerName,
      Type: transaction.type,
      Amount: transaction.amount,
      'Amount (₹)': transaction.amount.toLocaleString('en-IN', {
        maximumFractionDigits: 0
      })
    }))

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header with Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Left side: Title, Export and Record Count */}
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
              <div className="text-sm text-gray-500 mt-1">
                {allTransactions.length} total records
                {(selectedType !== 'all' || selectedCustomer) && (
                  <span> • {currentTransactions.length} filtered records</span>
                )}
              </div>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-md shadow-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>

          {/* Right side: Search, Month and Type filters */}
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* Customer Search */}
            <div className="relative w-64">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              {customerSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {uniqueCustomers
                    .filter(name => 
                      name.toLowerCase().includes(customerSearch.toLowerCase())
                    )
                    .map(name => (
                      <button
                        key={name}
                        onClick={() => {
                          setSelectedCustomer(name)
                          setCustomerSearch('')
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {name}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>

            <MonthSelector
              selectedDate={selectedDate}
              onChange={setSelectedDate}
            />

            {/* Type Filter */}
            <div className="relative" ref={typeDropdownRef}>
              <button
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedType === 'all' ? 'All Types' : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" />
              </button>

              {isTypeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    {(['all', 'credit', 'cash', 'payment', 'carry-forward'] as TransactionType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type)
                          setIsTypeDropdownOpen(false)
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          selectedType === type ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCustomer || selectedType !== 'all') && (
          <div className="flex items-center space-x-2 mt-2">
            {selectedCustomer && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedCustomer}
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {selectedType}
                <button
                  onClick={() => setSelectedType('all')}
                  className="ml-1 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { field: 'date', label: 'Date' },
                  { field: 'customerName', label: 'Customer' },
                  { field: 'type', label: 'Type' },
                  { field: 'amount', label: 'Amount' },
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field as SortField)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{label}</span>
                      <ChevronDownIcon 
                        className={`h-4 w-4 transition-transform ${
                          sortField === field && sortOrder === 'asc' ? 'transform rotate-180' : ''
                        }`}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(transaction.date), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      transaction.type === 'credit'
                        ? 'bg-red-100 text-red-800'
                        : transaction.type === 'cash'
                        ? 'bg-green-100 text-green-800'
                        : transaction.type === 'payment'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
} 