export interface Transaction {
  id: string
  customerId: string
  date: Date
  type: 'credit' | 'payment' | 'cash' | 'carry-forward'
  amount: number
  balanceAfter: number
  description?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  balance: number
  transactions: Transaction[]
  createdAt: Date
} 