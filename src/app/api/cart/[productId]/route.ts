import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getCartItemQuantity,
  removeFromCart 
} from '@/lib/cart'

// GET /api/cart/[productId] - 取得特定商品在購物車中的數量
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      )
    }

    const { productId } = await params
    
    const quantity = await getCartItemQuantity(session.user.id, productId)
    
    return NextResponse.json({
      success: true,
      data: {
        productId,
        quantity,
        inCart: quantity > 0
      }
    })
    
  } catch (error) {
    console.error('Error fetching cart item:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '取得購物車商品失敗' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/cart/[productId] - 從購物車移除特定商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      )
    }

    const { productId } = await params
    
    await removeFromCart(session.user.id, productId)
    
    return NextResponse.json({
      success: true,
      message: '已從購物車移除',
      data: {
        productId
      }
    })
    
  } catch (error) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '移除商品失敗' 
      },
      { status: 500 }
    )
  }
}