import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedis, pingRedis } from '@/lib/redis'

// GET /api/debug/environment - 檢查環境配置
export async function GET() {
  try {
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.split('@')[0]}@****` : 'Not Set',
      REDIS_URL: process.env.REDIS_URL || 'Not Set',
      VERCEL: process.env.VERCEL || 'false',
      VERCEL_URL: process.env.VERCEL_URL || 'Not Set',
      timestamp: new Date().toISOString()
    }

    // 測試資料庫連接
    let dbStatus = 'unknown'
    let productCount = 0
    try {
      productCount = await prisma.product.count()
      dbStatus = 'connected'
    } catch (error) {
      dbStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`
    }

    // 測試Redis連接
    const redisStatus = await pingRedis()

    // 取得最新產品資料（用於比較）
    let latestProducts: any[] = []
    try {
      latestProducts = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    } catch (error) {
      console.error('取得產品資料失敗:', error)
    }

    return NextResponse.json({
      success: true,
      environment: envInfo,
      database: {
        status: dbStatus,
        productCount,
        latestProducts
      },
      redis: {
        status: redisStatus ? 'connected' : 'disconnected',
        available: !!process.env.REDIS_URL
      }
    })

  } catch (error) {
    console.error('❌ 環境檢查失敗:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    )
  }
}