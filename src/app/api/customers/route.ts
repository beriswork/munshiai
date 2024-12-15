import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/utils/mongodb.api'

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const customers = await db.collection('customers').find({}).toArray()
    return NextResponse.json(customers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const customer = await request.json()

    // Validate customer data
    if (!customer.name || !customer.phone) {
      return NextResponse.json(
        { message: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check for duplicate phone number
    const existingCustomer = await db.collection('customers').findOne({ 
      phone: customer.phone 
    })

    if (existingCustomer) {
      return NextResponse.json(
        { message: 'Phone number already exists' },
        { status: 400 }
      )
    }

    // Ensure initial transaction is properly formatted
    if (customer.transactions && customer.transactions.length > 0) {
      customer.transactions[0].customerId = customer.id
      customer.transactions[0].date = new Date(customer.transactions[0].date)
    }

    // Insert new customer
    const result = await db.collection('customers').insertOne(customer)
    if (!result.insertedId) {
      return NextResponse.json(
        { message: 'Failed to create customer' },
        { status: 500 }
      )
    }

    // Fetch the created customer
    const newCustomer = await db.collection('customers').findOne({ 
      _id: result.insertedId 
    })

    return NextResponse.json(newCustomer)
  } catch (error: any) {
    console.error('Customer creation error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 