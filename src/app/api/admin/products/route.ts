import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 管理員獲取所有商品（含分頁）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const skip = (page - 1) * limit

    const whereClause: any = {}
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (category) {
      whereClause.category = category
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    const totalCount = await prisma.product.count({ where: whereClause })

    // 轉換價格單位（分 -> 元）
    const productsWithDisplayPrice = products.map(product => ({
      ...product,
      price: product.price / 100,
      totalOrders: product._count.orderItems
    }))

    return NextResponse.json({
      products: productsWithDisplayPrice,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// 管理員新增商品
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      price, 
      imageUrl, 
      images = [], 
      category, 
      stock, 
      isActive = true 
    } = body

    // 驗證必填欄位
    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: 'Name, description, price, and category are required' },
        { status: 400 }
      )
    }

    // 驗證價格為正數
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // 轉換價格單位（元 -> 分）
    const priceInCents = Math.round(price * 100)

    // 驗證圖片數量
    if (images.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images allowed per product' },
        { status: 400 }
      )
    }

    const product = await prisma.$transaction(async (tx) => {
      // 創建商品
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          price: priceInCents,
          imageUrl: imageUrl || null,
          category,
          stock: stock || 0,
          isActive
        }
      })

      // 創建圖片記錄
      if (images.length > 0) {
        const imageData = images.map((img: any, index: number) => ({
          productId: newProduct.id,
          imageUrl: img.url || img.imageUrl || img,
          sortOrder: index,
          alt: img.alt || null
        }))

        await tx.productImage.createMany({
          data: imageData
        })
      }

      // 返回包含圖片的商品
      return await tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      })
    })

    // 轉換價格單位用於回傳
    const productWithDisplayPrice = {
      ...product,
      price: product!.price / 100
    }

    return NextResponse.json(productWithDisplayPrice, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}