import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/wishlist/[productId] - 檢查商品是否在願望清單中
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 })
    }

    const { productId } = await params

    // 檢查商品是否在願望清單中
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    return NextResponse.json({
      isInWishlist: !!wishlistItem
    })
  } catch (error) {
    console.error('Error checking wishlist status:', error)
    return NextResponse.json(
      { error: '檢查願望清單狀態失敗' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/wishlist/[productId] - 從願望清單中移除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 })
    }

    const { productId } = await params

    // 檢查商品是否在願望清單中
    const existingItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: '商品不在願望清單中' }, { status: 404 })
    }

    // 從願望清單中移除
    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: '從願望清單中移除失敗' }, 
      { status: 500 }
    )
  }
}