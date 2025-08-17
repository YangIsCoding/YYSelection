import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      databaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Test endpoint failed' },
      { status: 500 }
    )
  }
}