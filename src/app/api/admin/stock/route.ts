import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adjustStock, getLowStockProducts } from '@/lib/stock'
import { StockChangeType } from '@prisma/client'

// 取得低庫存商品列表
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lowStockProducts = await getLowStockProducts()

    return NextResponse.json({
      products: lowStockProducts,
      count: lowStockProducts.length
    })
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    )
  }
}

// 管理員調整庫存
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, quantity, reason, changeType } = body

    // 驗證必填欄位
    if (!productId || typeof quantity !== 'number' || !reason || !changeType) {
      return NextResponse.json(
        { error: 'Product ID, quantity, reason, and change type are required' },
        { status: 400 }
      )
    }

    // 驗證變更類型
    if (!Object.values(StockChangeType).includes(changeType)) {
      return NextResponse.json(
        { error: 'Invalid change type' },
        { status: 400 }
      )
    }

    const result = await adjustStock({
      productId,
      quantity,
      reason,
      changeType,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      product: {
        ...result.product,
        price: result.product.price / 100 // 轉換為元
      },
      stockHistory: result.stockHistory
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}