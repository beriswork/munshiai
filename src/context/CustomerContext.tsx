'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import Toast from '../components/Toast'

interface Transaction {
  id: string
  customerId: string
  date: Date
  type: 'credit' | 'payment' | 'cash' | 'carry-forward'
  amount: number
  balanceAfter: number
  description?: string
}

interface Customer {
  id: string
  name: string
  phone: string
  balance: number
  transactions: Transaction[]
  createdAt: Date
}

interface CustomerContextType {
  customers: Customer[]
  isLoading: boolean
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  deleteCustomer: (id: string) => Promise<void>
  addTransaction: (customerId: string, transaction: Omit<Transaction, 'id' | 'balanceAfter'>) => void
  deleteTransaction: (customerId: string, transactionId: string) => Promise<void>
  getCustomerTransactions: (customerId: string) => Transaction[]
  getDashboardStats: (startDate?: Date, endDate?: Date) => {
    totalSales: number
    cashSales: number
    creditSales: number
    totalDeposits: number
    outstandingBalance: number
    totalCustomers: number
    totalTransactions: number
  }
  updateTransaction: (
    customerId: string, 
    transactionId: string, 
    updates: Partial<Transaction>
  ) => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch('/api/customers')
        const data = await response.json()
        setCustomers(data.map((customer: any) => ({
          ...customer,
          createdAt: new Date(customer.createdAt),
          transactions: customer.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }))
        })))
      } catch (error) {
        console.error('Error loading customers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date(),
      transactions: [],
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      })
      
      if (!response.ok) throw new Error('Failed to add customer')
      
      setCustomers(prev => [...prev, newCustomer])
      return newCustomer
    } catch (error) {
      console.error('Error adding customer:', error)
      throw error
    }
  }

  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete customer')
      }

      // Only remove from UI after successful deletion from DB
      setCustomers(prev => prev.filter(customer => customer.id !== id))
      setToast({ message: 'Customer deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Error deleting customer:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to delete customer',
        type: 'error' 
      })
      throw error
    }
  }

  const deleteTransaction = async (customerId: string, transactionId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/customers/${customerId}/transactions/${transactionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete transaction')
      }

      // Immediately update local state
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? {
          ...data,
          createdAt: new Date(data.createdAt),
          transactions: data.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }))
        } : customer
      ))

      setToast({ 
        message: 'Transaction deleted successfully', 
        type: 'success' 
      })
    } catch (error) {
      console.error('Error deleting transaction:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to delete transaction',
        type: 'error' 
      })
      throw error
    }
  }

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })

      if (!response.ok) throw new Error('Failed to update customer')
      const updatedCustomer = await response.json()

      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? updatedCustomer : customer
        )
      )
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }

  const addTransaction = async (
    customerId: string, 
    transactionData: Omit<Transaction, 'id' | 'balanceAfter'>
  ) => {
    try {
      const newTransaction = {
        ...transactionData,
        id: Date.now().toString(),
        customerId,
        date: new Date(),
        amount: Number(transactionData.amount)
      }

      const response = await fetch(`/api/customers/${customerId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add transaction')
      }

      // Update local state with the server response
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? {
          ...data,
          createdAt: new Date(data.createdAt),
          transactions: data.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }))
        } : customer
      ))

      setToast({ 
        message: 'Transaction saved successfully', 
        type: 'success' 
      })

      return data
    } catch (error) {
      console.error('Error adding transaction:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to add transaction',
        type: 'error' 
      })
      throw error
    }
  }

  const getCustomerTransactions = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    return customer?.transactions || []
  }

  const getDashboardStats = (startDate?: Date, endDate?: Date) => {
    return customers.reduce((stats, customer) => {
      stats.totalCustomers++
      stats.outstandingBalance += customer.balance || 0

      customer.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date)
        
        // Skip if transaction is outside date range
        if (startDate && endDate && (
          transactionDate < startDate || 
          transactionDate > endDate
        )) {
          return
        }

        stats.totalTransactions++
        const amount = Number(transaction.amount)

        switch (transaction.type) {
          case 'cash':
            stats.cashSales += amount
            stats.totalSales += amount
            break
          case 'credit':
            stats.creditSales += amount
            stats.totalSales += amount
            break
          case 'payment':
            // Add to total deposits
            stats.totalDeposits += amount
            break
        }
      })

      return stats
    }, {
      totalSales: 0,
      cashSales: 0,
      creditSales: 0,
      totalDeposits: 0,
      outstandingBalance: 0,
      totalCustomers: 0,
      totalTransactions: 0,
    })
  }

  const updateTransaction = async (
    customerId: string, 
    transactionId: string, 
    updates: Partial<Transaction>
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/customers/${customerId}/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update transaction')
      }

      // Immediately update local state
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? {
          ...data,
          createdAt: new Date(data.createdAt),
          transactions: data.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }))
        } : customer
      ))

      setToast({ 
        message: 'Transaction updated successfully', 
        type: 'success' 
      })
    } catch (error) {
      console.error('Error updating transaction:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to update transaction',
        type: 'error' 
      })
      throw error
    }
  }

  return (
    <CustomerContext.Provider value={{
      customers,
      isLoading,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addTransaction,
      deleteTransaction,
      getCustomerTransactions,
      getDashboardStats,
      updateTransaction,
    }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </CustomerContext.Provider>
  )
}

export const useCustomers = () => {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider')
  }
  return context
} 