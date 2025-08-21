import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 檢查環境變數
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
      return NextResponse.json({ 
        error: 'DATABASE_URL not found',
        env: process.env.NODE_ENV
      })
    }

    // 嘗試簡單的資料庫連接測試
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({
      log: ['error'],
    })

    try {
      // 執行簡單查詢
      await prisma.$queryRaw`SELECT 1 as test`
      await prisma.$disconnect()
      
      return NextResponse.json({ 
        success: true,
        message: 'Database connection successful',
        env: process.env.NODE_ENV,
        dbUrlLength: dbUrl.length
      })
    } catch (dbError) {
      await prisma.$disconnect()
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error',
        code: dbError instanceof Error && 'code' in dbError ? dbError.code : 'UNKNOWN',
        env: process.env.NODE_ENV
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'General error',
      details: error instanceof Error ? error.message : 'Unknown error',
      env: process.env.NODE_ENV
    }, { status: 500 })
  }
}