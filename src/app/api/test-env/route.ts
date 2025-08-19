import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '已設定' : '未設定',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '已設定' : '未設定',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '已設定' : '未設定',
      DATABASE_URL: process.env.DATABASE_URL ? '已設定' : '未設定',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '已設定' : '未設定',
      timestamp: new Date().toISOString()
    }

    console.log('環境變數檢查:', envCheck)

    return NextResponse.json({
      message: 'Environment check',
      environment: envCheck,
      cloudinaryReady: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    })

  } catch (error) {
    console.error('環境檢查錯誤:', error)
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    )
  }
}