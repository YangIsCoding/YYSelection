import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, deleteCache } from '@/lib/cache'

// 獲取單一商品詳情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // 快取鍵名
    const cacheKey = `product:${productId}`

    // 1. 先嘗試從快取取得資料
    const cachedProduct = await getCache(cacheKey)
    if (cachedProduct) {
      console.log(`📦 從快取返回產品: ${productId}`)
      return NextResponse.json(cachedProduct)
    }

    // 2. 快取沒有資料，查詢資料庫
    console.log(`🔍 從資料庫查詢產品: ${productId}`)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        orderItems: {
          include: {
            order: {
              select: {
                status: true,
                createdAt: true
              }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 計算商品統計資訊
    const stats = {
      totalOrders: product.orderItems.length,
      recentOrders: product.orderItems.filter(item => {
        const orderDate = new Date(item.order.createdAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return orderDate >= thirtyDaysAgo
      }).length
    }

    // 轉換價格單位（分 -> 元）
    const productWithDisplayPrice = {
      ...product,
      price: product.price / 100,
      stats,
      orderItems: undefined // 移除 orderItems，只保留統計資料
    }

    // 3. 將查詢結果存入快取 (快取15分鐘，單個產品變動較少)
    await setCache(cacheKey, productWithDisplayPrice, 900)

    return NextResponse.json(productWithDisplayPrice)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: productId } = await params
    const body = await request.json()
    const { name, price, description, imageUrl, category } = body

    if (!name || !price || !description || !imageUrl || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price: Math.round(price * 100), // 轉換為分
        description,
        imageUrl,
        category
      }
    })

    // 清除相關快取
    await deleteCache([
      `product:${productId}`,      // 清除單個產品快取
      'products:list:all',         // 清除產品列表快取
    ])
    console.log(`🔄 已清除產品快取: ${productId}`)

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: productId } = await params

    await prisma.product.delete({
      where: { id: productId }
    })

    // 清除相關快取
    await deleteCache([
      `product:${productId}`,      // 清除單個產品快取
      'products:list:all',         // 清除產品列表快取
    ])
    console.log(`🔄 已清除產品快取: ${productId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}