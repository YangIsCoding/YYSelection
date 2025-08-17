import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 獲取所有廣告橫幅
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

// 創建新廣告橫幅
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, imageUrl, linkUrl, description, sortOrder } = await req.json()

    // 檢查廣告橫幅數量限制（最多10張）
    const count = await prisma.banner.count()
    if (count >= 10) {
      return NextResponse.json(
        { error: '廣告橫幅數量已達上限（10張）' }, 
        { status: 400 }
      )
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        linkUrl,
        description,
        sortOrder: sortOrder || 0,
      }
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}