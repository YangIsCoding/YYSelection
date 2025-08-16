import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStockHistory, adjustStock } from '@/lib/stock'
import { StockChangeType } from '@prisma/client'

// 取得商品庫存歷史
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const stockHistory = await getStockHistory(productId, limit)

    return NextResponse.json({
      history: stockHistory,
      count: stockHistory.length
    })
  } catch (error) {
    console.error('Error fetching stock history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock history' },
      { status: 500 }
    )
  }
}

// 調整特定商品庫存
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await params
    const body = await request.json()
    const { quantity, reason, changeType = StockChangeType.ADMIN_ADJUST } = body

    // 驗證必填欄位
    if (typeof quantity !== 'number' || !reason) {
      return NextResponse.json(
        { error: 'Quantity and reason are required' },
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
    console.error('Error adjusting product stock:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}