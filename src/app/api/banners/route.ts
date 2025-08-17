import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 獲取公開的活躍廣告橫幅（用於前台顯示）
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching public banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}