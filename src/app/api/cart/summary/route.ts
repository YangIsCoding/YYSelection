import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCartTotalItems } from '@/lib/cart'

// GET /api/cart/summary - 取得購物車統計（用於顯示badge）
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      )
    }

    const totalItems = await getCartTotalItems(session.user.id)
    
    return NextResponse.json({
      success: true,
      data: {
        totalItems,
        hasItems: totalItems > 0
      }
    })
    
  } catch (error) {
    console.error('Error fetching cart summary:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '取得購物車統計失敗' 
      },
      { status: 500 }
    )
  }
}