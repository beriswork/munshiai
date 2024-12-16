'use client'

import ProtectedPage from '@/components/ProtectedPage'
import { useEffect, useState } from 'react'
import { useCustomers } from '@/context/CustomerContext'
import { 
  BanknotesIcon, 
  CreditCardIcon, 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import NewCustomerModal from '@/components/NewCustomerModal'
import NewTransactionModal from '@/components/NewTransactionModal'
import MonthSelector from '@/components/MonthSelector'

export default function DashboardPage() {
  const { getDashboardStats, customers } = useCustomers()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSales: 0,
    cashSales: 0,
    creditSales: 0,
    totalDeposits: 0,
    outstandingBalance: 0,
    totalCustomers: 0,
    totalTransactions: 0,
  })
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    console.log('🔄 Dashboard: Initializing...')
    const startDate = startOfMonth(selectedDate)
    const endDate = endOfMonth(selectedDate)
    
    try {
      const filteredStats = getDashboardStats(startDate, endDate)
      console.log('✅ Dashboard: Stats calculated successfully', filteredStats)
      setStats(filteredStats)
    } catch (error) {
      console.error('❌ Dashboard: Error calculating stats:', error)
    }
    
    setIsLoading(false)
    console.log('✅ Dashboard: Initialization complete')
  }, [customers, getDashboardStats, selectedDate])

  // Get recent transactions (50)
  const recentTransactions = customers
    .flatMap(customer => 
      customer.transactions.map(t => ({
        ...t,
        customerName: customer.name
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50)

  console.log(`✅ Dashboard: Loaded ${recentTransactions.length} recent transactions`)

  return (
    <ProtectedPage>
      <div className="p-4 md:p-6 space-y-6">
        {/* Mobile Header */}
        <div className="md:hidden space-y-4">
          <h1 className="text-xl font-bold text-blue-600 text-center">MunshiAI</h1>
          <div className="flex justify-center">
            <MonthSelector
              selectedDate={selectedDate}
              onChange={setSelectedDate}
            />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <MonthSelector
              selectedDate={selectedDate}
              onChange={setSelectedDate}
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span>New Customer</span>
            </button>
            <button
              onClick={() => setIsTransactionModalOpen(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span>New Transaction</span>
            </button>
          </div>
        </div>

        {/* Stats Grid - Desktop View */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-6">
          <StatCard
            title="Total Sales"
            value={`₹${stats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
            iconBg="bg-blue-500"
          />
          <StatCard
            title="Cash Sales"
            value={`₹${stats.cashSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={<BanknotesIcon className="h-6 w-6" />}
            iconBg="bg-green-500"
          />
          <StatCard
            title="Credit Sales"
            value={`₹${stats.creditSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={<CreditCardIcon className="h-6 w-6" />}
            iconBg="bg-yellow-500"
          />
          <StatCard
            title="Total Deposits"
            value={`₹${stats.totalDeposits.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={<ArrowDownTrayIcon className="h-6 w-6" />}
            iconBg="bg-purple-500"
          />
          <StatCard
            title="Outstanding Balance"
            value={`₹${stats.outstandingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={<ClockIcon className="h-6 w-6" />}
            iconBg="bg-red-500"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<UserGroupIcon className="h-6 w-6" />}
            iconBg="bg-indigo-500"
          />
        </div>

        {/* Stats Grid - Mobile View */}
        <div className="md:hidden space-y-4">
          {/* ... mobile stats grid ... */}
        </div>

        {/* Recent Transactions Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500 mt-1">Last 50 transactions across all customers</p>
          </div>
          
          {/* Mobile list view */}
          <div className="divide-y divide-gray-200 md:hidden">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{transaction.customerName}</div>
                  <div className="text-gray-900">₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${transaction.type === 'credit' ? 'bg-red-100 text-red-800' : 
                      transaction.type === 'payment' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.type === 'cash' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </span>
                </div>
                {transaction.description && (
                  <div className="text-sm text-gray-600">{transaction.description}</div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.customerName}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{transaction.amount.toLocaleString('en-IN', { 
                          maximumFractionDigits: 0,
                          style: 'decimal'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex space-x-4 md:hidden">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex-1 btn-primary flex items-center justify-center text-sm"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            New Customer
          </button>
          <button
            onClick={() => setIsTransactionModalOpen(true)}
            className="flex-1 btn-primary flex items-center justify-center text-sm"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            New Transaction
          </button>
        </div>

        {/* Modals */}
        <NewCustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
        />
        <NewTransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
        />
      </div>
    </ProtectedPage>
  )
}

function StatCard({ title, value, icon, iconBg }: {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`${iconBg} rounded-md p-3 text-white`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
