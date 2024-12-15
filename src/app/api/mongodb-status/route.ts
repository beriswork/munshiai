import { NextResponse } from 'next/server'
import clientPromise from '@/utils/mongodb'

export async function GET() {
  try {
    await clientPromise
    return NextResponse.json({ status: 'connected' })
  } catch (error: any) {
    console.error('MongoDB Connection Error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: error?.message || 'MongoDB connection failed'
      }, 
      { status: 500 }
    )
  }
} 