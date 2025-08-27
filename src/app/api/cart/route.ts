import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from '@/lib/cart'

// GET /api/cart - 取得用戶購物車
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      )
    }

    const cart = await getCart(session.user.id)
    
    return NextResponse.json({
      success: true,
      data: cart
    })
    
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '取得購物車失敗' 
      },
      { status: 500 }
    )
  }
}

// POST /api/cart - 添加商品到購物車
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { error: '缺少商品ID' },
        { status: 400 }
      )
    }

    if (quantity <= 0 || quantity > 99) {
      return NextResponse.json(
        { error: '數量必須在1-99之間' },
        { status: 400 }
      )
    }

    const newQuantity = await addToCart(session.user.id, productId, quantity)
    
    return NextResponse.json({
      success: true,
      message: '已添加到購物車',
      data: {
        productId,
        quantity: newQuantity
      }
    })
    
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '添加到購物車失敗' 
      },
      { status: 500 }
    )
  }
}

// PUT /api/cart - 更新購物車商品數量
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity } = body

    if (!productId) {
      return NextResponse.json(
        { error: '缺少商品ID' },
        { status: 400 }
      )
    }

    if (quantity < 0 || quantity > 99) {
      return NextResponse.json(
        { error: '數量必須在0-99之間' },
        { status: 400 }
      )
    }

    await updateCartItem(session.user.id, productId, quantity)
    
    const action = quantity === 0 ? '已移除商品' : '已更新數量'
    
    return NextResponse.json({
      success: true,
      message: action,
      data: {
        productId,
        quantity
      }
    })
    
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '更新購物車失敗' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - 清空購物車
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      )
    }

    await clearCart(session.user.id)
    
    return NextResponse.json({
      success: true,
      message: '購物車已清空'
    })
    
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '清空購物車失敗' 
      },
      { status: 500 }
    )
  }
}