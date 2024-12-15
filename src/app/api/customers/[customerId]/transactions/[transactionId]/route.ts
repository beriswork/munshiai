import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/utils/mongodb.api'

export async function DELETE(
  request: Request,
  { params }: { params: { customerId: string, transactionId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { customerId, transactionId } = params

    // Validate customer exists
    const customer = await db.collection('customers').findOne({ id: customerId })
    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Remove transaction and recalculate balance
    const updatedTransactions = customer.transactions.filter(
      (t: any) => t.id !== transactionId
    )

    const newBalance = updatedTransactions.reduce((acc: number, t: any) => {
      if (t.type === 'credit') return acc + Number(t.amount)
      if (t.type === 'payment') return acc - Number(t.amount)
      return acc
    }, 0)

    // Use two-step update
    const updateResult = await db.collection('customers').updateOne(
      { id: customerId },
      { 
        $set: { 
          transactions: updatedTransactions,
          balance: newBalance
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { message: 'Failed to delete transaction' },
        { status: 500 }
      )
    }

    // Fetch updated customer
    const updatedCustomer = await db.collection('customers').findOne({ id: customerId })
    if (!updatedCustomer) {
      return NextResponse.json(
        { message: 'Failed to fetch updated customer' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedCustomer)
  } catch (error: any) {
    console.error('Transaction delete error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { customerId: string, transactionId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { customerId, transactionId } = params
    const updates = await request.json()

    // Validate customer exists
    const customer = await db.collection('customers').findOne({ id: customerId })
    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Update transaction and recalculate balance
    const updatedTransactions = customer.transactions.map((t: any) =>
      t.id === transactionId ? { ...t, ...updates } : t
    )

    const newBalance = updatedTransactions.reduce((acc: number, t: any) => {
      if (t.type === 'credit') return acc + Number(t.amount)
      if (t.type === 'payment') return acc - Number(t.amount)
      return acc
    }, 0)

    // Use two-step update
    const updateResult = await db.collection('customers').updateOne(
      { id: customerId },
      { 
        $set: { 
          transactions: updatedTransactions,
          balance: newBalance
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { message: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    // Fetch updated customer
    const updatedCustomer = await db.collection('customers').findOne({ id: customerId })
    if (!updatedCustomer) {
      return NextResponse.json(
        { message: 'Failed to fetch updated customer' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedCustomer)
  } catch (error: any) {
    console.error('Transaction update error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 