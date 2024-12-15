'use client'

import { useState, useEffect } from 'react'
import { useCustomers } from '@/context/CustomerContext'
import { format } from 'date-fns'
import { 
  TrashIcon, 
  PencilIcon, 
  XMarkIcon,
  UserIcon,
  PhoneIcon 
} from '@heroicons/react/24/solid'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import Toast from './Toast'
import LoadingSpinner from './LoadingSpinner'
import { Transaction } from '@/types'

interface CustomerDetailsModalProps {
  customerId: string
  onClose: () => void
}

interface EditingTransaction {
  id: string
  amount: number
}

export default function CustomerDetailsModal({ customerId, onClose }: CustomerDetailsModalProps) {
  const { customers, getCustomerTransactions, deleteTransaction, updateTransaction } = useCustomers()
  const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    transactionId?: string;
  }>({ isOpen: false })
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // Get fresh customer data and sort transactions
  const customer = customers.find(c => c.id === customerId)
  const allTransactions = getCustomerTransactions(customerId)

  // Filter transactions by month and sort by date
  const transactions = allTransactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transactionDate.getMonth() === selectedMonth.getMonth() &&
        transactionDate.getFullYear() === selectedMonth.getFullYear()
      )
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by most recent

  if (!customer) return null

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction({
      id: transaction.id,
      amount: transaction.amount
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTransaction) return
    
    setIsSaving(true)
    try {
      await updateTransaction(customerId, editingTransaction.id, {
        amount: editingTransaction.amount
      })
      setShowToast({ message: 'Transaction updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating transaction:', error)
      setShowToast({ 
        message: error instanceof Error ? error.message : 'Failed to update transaction',
        type: 'error'
      })
    } finally {
      setIsSaving(false)
      setEditingTransaction(null)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    setIsLoading(true)
    try {
      await deleteTransaction(customerId, transactionId)
      setShowToast({ message: 'Transaction deleted successfully', type: 'success' })
      setDeleteModalConfig({ isOpen: false })
    } catch (error) {
      console.error('Error deleting transaction:', error)
      setShowToast({ 
        message: error instanceof Error ? error.message : 'Failed to delete transaction',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full md:h-auto md:rounded-lg md:max-w-4xl md:max-h-[90vh] overflow-y-auto">
        {/* Mobile Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-blue-50 p-1.5 rounded-lg mr-2">
                <UserIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="font-medium text-gray-900">{customer.name}</div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{customer.name}</div>
                  <div className="flex items-center text-gray-500 mt-1">
                    <PhoneIcon className="h-4 w-4 mr-1.5" />
                    {customer.phone}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2">Outstanding Balance</h3>
            <p className={`text-2xl font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{customer.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Transaction History Header with Month Filter */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transaction History</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMonth(new Date())}
                className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Current Month
              </button>
              <select
                value={`${selectedMonth.getMonth()}-${selectedMonth.getFullYear()}`}
                onChange={(e) => {
                  const [month, year] = e.target.value.split('-').map(Number)
                  const date = new Date()
                  date.setMonth(month)
                  date.setFullYear(year)
                  setSelectedMonth(date)
                }}
                className="form-select rounded-md border-gray-300 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date()
                  date.setMonth(date.getMonth() - i)
                  return (
                    <option 
                      key={i} 
                      value={`${date.getMonth()}-${date.getFullYear()}`}
                    >
                      {date.toLocaleString('default', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Show transaction count */}
          <div className="text-sm text-gray-500 mb-4">
            {transactions.length} transactions in {
              selectedMonth.toLocaleString('default', { 
                month: 'long', 
                year: 'numeric' 
              })
            }
          </div>

          {/* Transactions List/Table */}
          <div>
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {/* Mobile List View */}
            <div className="md:hidden space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${transaction.type === 'credit' ? 'bg-red-100 text-red-800' : 
                          transaction.type === 'payment' ? 'bg-yellow-100 text-yellow-800' :
                          transaction.type === 'cash' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <p className="text-sm text-gray-500">Balance: ₹{transaction.balanceAfter.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                  {transaction.description && (
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance After</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${transaction.type === 'credit' ? 'bg-red-100 text-red-800' : 
                              transaction.type === 'payment' ? 'bg-yellow-100 text-yellow-800' :
                              transaction.type === 'cash' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingTransaction?.id === transaction.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={editingTransaction.amount}
                                onChange={(e) => setEditingTransaction(prev => ({
                                  ...prev!,
                                  amount: parseFloat(e.target.value)
                                }))}
                                className="w-24 px-2 py-1 border rounded"
                              />
                              <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <div className="flex items-center">
                                    <LoadingSpinner size="sm" />
                                    <span className="ml-1">Saving</span>
                                  </div>
                                ) : 'Save'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                              <button
                                onClick={() => handleEditClick(transaction)}
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ₹{transaction.balanceAfter.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {transaction.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setDeleteModalConfig({ 
                              isOpen: true, 
                              transactionId: transaction.id 
                            })}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig({ isOpen: false })}
        onConfirm={() => {
          if (deleteModalConfig.transactionId) {
            handleDeleteTransaction(deleteModalConfig.transactionId)
          }
        }}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  )
} 