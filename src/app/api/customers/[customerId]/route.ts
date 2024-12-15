import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/utils/mongodb.api'

export async function DELETE(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { customerId } = params

    const result = await db.collection('customers').deleteOne({ id: customerId })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Customer deletion error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 