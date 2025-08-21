import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 管理員更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId } = await params
    const body = await request.json()
    const { 
      name, 
      description, 
      price, 
      imageUrl, 
      images = [], 
      category, 
      stock, 
      isActive 
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
      // 更新商品
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          description,
          price: priceInCents,
          imageUrl: imageUrl || null,
          category,
          stock: stock || 0,
          isActive: isActive !== undefined ? isActive : true
        }
      })

      // 如果有提供圖片數據，更新圖片
      if (images.length >= 0) { // 允許空數組（刪除所有圖片）
        // 刪除現有圖片
        await tx.productImage.deleteMany({
          where: { productId }
        })

        // 創建新圖片記錄
        if (images.length > 0) {
          const imageData = images.map((img: string | { url?: string; imageUrl?: string; alt?: string }, index: number) => ({
            productId: productId,
            imageUrl: img.url || img.imageUrl || img,
            sortOrder: index,
            alt: img.alt || null
          }))

          await tx.productImage.createMany({
            data: imageData
          })
        }
      }

      // 返回包含圖片的商品
      return await tx.product.findUnique({
        where: { id: productId },
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

    return NextResponse.json(productWithDisplayPrice)
  } catch (error) {
    console.error('Error updating product:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// 管理員刪除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId } = await params

    // 檢查商品是否有相關訂單
    const existingOrders = await prisma.orderItem.findFirst({
      where: { productId }
    })

    if (existingOrders) {
      // 如果有相關訂單，只設為不活躍而不刪除
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isActive: false }
      })

      return NextResponse.json({
        message: 'Product deactivated due to existing orders',
        product: {
          ...product,
          price: product.price / 100
        }
      })
    } else {
      // 如果沒有相關訂單，可以直接刪除
      await prisma.product.delete({
        where: { id: productId }
      })

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}