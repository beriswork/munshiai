import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/utils/mongodb.api'

export async function POST(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const transaction = await request.json()
    const { customerId } = params

    const customer = await db.collection('customers').findOne({ id: customerId })
    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Calculate new balance
    let newBalance = customer.balance || 0
    const amount = Number(transaction.amount)

    switch (transaction.type) {
      case 'credit':
        // Credit increases outstanding balance
        newBalance += amount
        break
      case 'payment':
      case 'deposit':
        // Payment/Deposit reduces outstanding balance
        newBalance -= amount
        break
      case 'cash':
        // Cash transactions don't affect balance
        break
      case 'carry-forward':
        // Carry forward sets the balance directly
        newBalance = amount
        break
      default:
        throw new Error(`Invalid transaction type: ${transaction.type}`)
    }

    // Create transaction record with balance after
    const newTransaction = {
      ...transaction,
      amount,
      balanceAfter: newBalance,
      date: new Date(transaction.date),
      // Normalize transaction type (treat deposit as payment)
      type: transaction.type === 'deposit' ? 'payment' : transaction.type
    }

    // Update customer with new transaction and balance
    const updateResult = await db.collection('customers').updateOne(
      { id: customerId },
      { 
        $push: { transactions: newTransaction },
        $set: { balance: newBalance }
      }
    )

    if (updateResult.modifiedCount === 0) {
      throw new Error('Failed to update customer')
    }

    // Fetch updated customer to return
    const updatedCustomer = await db.collection('customers').findOne({ id: customerId })
    if (!updatedCustomer) {
      throw new Error('Failed to fetch updated customer')
    }

    return NextResponse.json(updatedCustomer)
  } catch (error: any) {
    console.error('Transaction error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 