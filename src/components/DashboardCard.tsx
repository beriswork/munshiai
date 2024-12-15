import {
  CurrencyRupeeIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

interface DashboardCardProps {
  title: string
  value: string
  icon: 'total' | 'cash' | 'credit' | 'transactions'
}

const iconMap = {
  total: CurrencyRupeeIcon,
  cash: BanknotesIcon,
  credit: CreditCardIcon,
  transactions: DocumentTextIcon,
}

export default function DashboardCard({ title, value, icon }: DashboardCardProps) {
  const Icon = iconMap[icon]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-blue-100">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
} 