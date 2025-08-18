import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/app/types/order'
import { checkStockAvailability, processOrderStock } from '@/lib/stock'

// 獲取訂單列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // 可選：篩選特定使用者的訂單

    let whereClause: any = {}
    
    if (session.user.role === 'USER') {
      // 一般使用者只能看自己的訂單
      whereClause.userId = session.user.id
    } else if (session.user.role === 'ADMIN' && userId) {
      // 管理員可以篩選特定使用者的訂單
      whereClause.userId = userId
    }
    // 管理員不指定 userId 則看所有訂單

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 轉換價格單位（分 -> 元）
    const ordersWithDisplayPrice = orders.map(order => ({
      ...order,
      totalAmount: order.totalAmount / 100,
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice / 100,
        subtotal: item.subtotal / 100
      }))
    }))

    return NextResponse.json(ordersWithDisplayPrice)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// 建立新訂單（管理員專用）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, customerPhone, customerNote, adminNote, orderItems } = body

    if (!userId || !customerPhone || !orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 獲取使用者資訊
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 檢查庫存是否足夠
    const stockCheck = await checkStockAvailability(
      orderItems.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    )

    if (!stockCheck.allAvailable) {
      return NextResponse.json(
        { 
          error: 'Stock not available',
          details: stockCheck.unavailableItems
        },
        { status: 400 }
      )
    }

    // 獲取商品資訊並計算總價
    const productIds = orderItems.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        isActive: true
      }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products not found or inactive' },
        { status: 404 }
      )
    }

    // 計算訂單詳情
    let totalAmount = 0
    const orderItemsData = orderItems.map((item: any) => {
      const product = products.find(p => p.id === item.productId)!
      const subtotal = product.price * item.quantity
      totalAmount += subtotal

      return {
        productId: item.productId,
        productName: product.name,
        productImage: product.imageUrl,
        unitPrice: product.price, // 已經是分
        quantity: item.quantity,
        subtotal: subtotal
      }
    })

    // 生成訂單編號
    const orderNumber = generateOrderNumber()

    // 使用事務建立訂單並扣減庫存
    const order = await prisma.$transaction(async (tx) => {
      // 建立訂單
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone,
          totalAmount,
          customerNote,
          adminNote,
          orderItems: {
            create: orderItemsData
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          orderItems: true
        }
      })

      // 扣減庫存（在同一個事務中）
      await processOrderStock(
        newOrder.id,
        orderItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        'place',
        tx // 傳入事務對象
      )

      return newOrder
    })

    // 轉換價格單位用於回傳
    const orderWithDisplayPrice = {
      ...order,
      totalAmount: order.totalAmount / 100,
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice / 100,
        subtotal: item.subtotal / 100
      }))
    }

    return NextResponse.json(orderWithDisplayPrice, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}