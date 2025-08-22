import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Create a demo user if it doesn't exist
    const demoUser = await db.user.upsert({
      where: { email: 'demo@memovox.com' },
      update: {},
      create: {
        email: 'demo@memovox.com',
        name: 'Demo User'
      }
    })

    return NextResponse.json({ 
      message: 'Database initialized successfully',
      user: demoUser 
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 })
  }
}