import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, deleteCache } from '@/lib/cache'

export async function GET() {
  try {
    // 快取鍵名：使用有意義的名稱
    const cacheKey = 'products:list:all'
    
    // 1. 先嘗試從快取取得資料
    const cachedProducts = await getCache(cacheKey)
    if (cachedProducts) {
      console.log('📦 從快取返回產品列表')
      return NextResponse.json(cachedProducts)
    }
    
    // 2. 快取沒有資料，查詢資料庫
    console.log('🔍 從資料庫查詢產品列表')
    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1 // 只取第一張圖片用於列表顯示
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // 3. 將查詢結果存入快取 (快取10分鐘)
    await setCache(cacheKey, products, 600)
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, price, description, imageUrl, category } = body

    if (!name || !price || !description || !imageUrl || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: Math.round(price * 100), // 轉換為分
        description,
        imageUrl,
        category
      }
    })

    // 清除相關快取，確保資料一致性
    await deleteCache([
      'products:list:all',       // 清除產品列表快取
      `product:${product.id}`,   // 清除單個產品快取（如果有的話）
    ])
    console.log('🔄 已清除產品快取')

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}