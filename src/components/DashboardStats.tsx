'use client'

import { useEffect, useState } from 'react'
import { useCustomers } from '@/context/CustomerContext'

interface Stats {
  totalSales: number
  cashSales: number
  creditSales: number
  deposits: number
  outstandingBalance: number
  totalCustomers: number
}

export default function DashboardStats() {
  const { customers } = useCustomers()
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    cashSales: 0,
    creditSales: 0,
    deposits: 0,
    outstandingBalance: 0,
    totalCustomers: 0,
  })

  useEffect(() => {
    const calculateStats = () => {
      const newStats = customers.reduce((acc, customer) => {
        // Add to total customers
        acc.totalCustomers++

        // Add to outstanding balance
        acc.outstandingBalance += customer.balance

        // Calculate transaction totals
        customer.transactions.forEach(transaction => {
          if (transaction.type === 'cash') {
            acc.cashSales += transaction.amount
            acc.totalSales += transaction.amount
          } else if (transaction.type === 'credit') {
            acc.creditSales += transaction.amount
            acc.totalSales += transaction.amount
          } else if (transaction.type === 'payment') {
            acc.deposits += transaction.amount
          }
        })

        return acc
      }, {
        totalSales: 0,
        cashSales: 0,
        creditSales: 0,
        deposits: 0,
        outstandingBalance: 0,
        totalCustomers: 0,
      })

      setStats(newStats)
    }

    calculateStats()
  }, [customers])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-blue-500 rounded-md p-3">
                {/* Icon */}
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Sales
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  ₹{stats.totalSales.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Similar cards for other stats */}
      {[
        { title: 'Cash Sales', value: stats.cashSales },
        { title: 'Credit Sales', value: stats.creditSales },
        { title: 'Deposits', value: stats.deposits },
        { title: 'Outstanding Balance', value: stats.outstandingBalance },
        { title: 'Total Customers', value: stats.totalCustomers },
      ].map(stat => (
        <div key={stat.title} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stat.title === 'Total Customers' 
                      ? stat.value
                      : `₹${stat.value.toFixed(2)}`}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 