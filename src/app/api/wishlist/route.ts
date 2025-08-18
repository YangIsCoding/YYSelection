import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/wishlist - 獲取用戶的願望清單
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 })
    }

    // 獲取用戶的願望清單
    const wishlistItems = await prisma.wishlist.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        product: true
      },
      orderBy: {
        addedAt: 'desc'
      }
    })

    return NextResponse.json(wishlistItems)
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: '獲取願望清單失敗' }, 
      { status: 500 }
    )
  }
}

// POST /api/wishlist - 添加商品到願望清單
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: '缺少商品ID' }, { status: 400 })
    }

    // 檢查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    // 檢查是否已在願望清單中
    const existingItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    if (existingItem) {
      return NextResponse.json({ error: '商品已在願望清單中' }, { status: 409 })
    }

    // 添加到願望清單
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        productId: productId
      },
      include: {
        product: true
      }
    })

    return NextResponse.json(wishlistItem, { status: 201 })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: '添加到願望清單失敗' }, 
      { status: 500 }
    )
  }
}