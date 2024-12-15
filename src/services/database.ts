import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '@/utils/mongodb.server'

export interface DBCustomer {
  _id?: ObjectId
  id: string
  name: string
  phone: string
  balance: number
  transactions: DBTransaction[]
  createdAt: Date
}

export interface DBTransaction {
  id: string
  customerId: string
  date: Date
  type: 'credit' | 'payment' | 'cash' | 'carry-forward'
  amount: number
  balanceAfter: number
  description?: string
}

export class DatabaseService {
  private client: Promise<MongoClient>
  private dbName: string

  constructor() {
    this.client = clientPromise
    this.dbName = process.env.MONGODB_DB || 'credit_manager'
  }

  async getCustomers(): Promise<DBCustomer[]> {
    const db = (await this.client).db(this.dbName)
    return await db.collection<DBCustomer>('customers').find({}).toArray()
  }

  async addCustomer(customer: Omit<DBCustomer, '_id'>): Promise<DBCustomer> {
    const db = (await this.client).db(this.dbName)
    const result = await db.collection<DBCustomer>('customers').insertOne(customer as DBCustomer)
    return { ...customer, _id: result.insertedId }
  }

  async updateCustomer(id: string, update: Partial<DBCustomer>): Promise<void> {
    const db = (await this.client).db(this.dbName)
    await db.collection<DBCustomer>('customers').updateOne(
      { id },
      { $set: update }
    )
  }

  async deleteCustomer(id: string): Promise<void> {
    const db = (await this.client).db(this.dbName)
    await db.collection<DBCustomer>('customers').deleteOne({ id })
  }

  async addTransaction(customerId: string, transaction: DBTransaction): Promise<void> {
    const db = (await this.client).db(this.dbName)
    await db.collection<DBCustomer>('customers').updateOne(
      { id: customerId },
      { 
        $push: { transactions: transaction },
        $set: { balance: transaction.balanceAfter }
      }
    )
  }

  async deleteTransaction(customerId: string, transactionId: string): Promise<void> {
    const db = (await this.client).db(this.dbName)
    const customer = await db.collection<DBCustomer>('customers').findOne({ id: customerId })
    
    if (!customer) return

    const updatedTransactions = customer.transactions.filter(t => t.id !== transactionId)
    const newBalance = updatedTransactions.reduce((acc, t) => {
      if (t.type === 'credit') return acc + t.amount
      if (t.type === 'payment') return acc - t.amount
      return acc
    }, 0)

    await db.collection<DBCustomer>('customers').updateOne(
      { id: customerId },
      { 
        $set: { 
          transactions: updatedTransactions,
          balance: newBalance
        }
      }
    )
  }

  async updateTransaction(
    customerId: string,
    transactionId: string,
    updates: Partial<DBTransaction>
  ): Promise<void> {
    const db = (await this.client).db(this.dbName)
    const customer = await db.collection<DBCustomer>('customers').findOne({ id: customerId })
    
    if (!customer) return

    const updatedTransactions = customer.transactions.map(t => 
      t.id === transactionId ? { ...t, ...updates } : t
    )

    const newBalance = updatedTransactions.reduce((acc, t) => {
      if (t.type === 'credit') return acc + t.amount
      if (t.type === 'payment') return acc - t.amount
      return acc
    }, 0)

    await db.collection<DBCustomer>('customers').updateOne(
      { id: customerId },
      { 
        $set: { 
          transactions: updatedTransactions,
          balance: newBalance
        }
      }
    )
  }
}

export const db = new DatabaseService() 