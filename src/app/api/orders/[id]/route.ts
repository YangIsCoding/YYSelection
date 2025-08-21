import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus } from '@prisma/client'

// 獲取單一訂單詳情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 權限檢查：使用者只能看自己的訂單
    if (session.user.role === 'USER' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 轉換價格單位（分 -> 元）
    const orderWithDisplayPrice = {
      ...order,
      totalAmount: order.totalAmount / 100,
      orderItems: order.orderItems.map((item: { id: string; unitPrice: number; subtotal: number; productName: string; productImage: string; quantity: number; orderId: string; productId: string }) => ({
        ...item,
        unitPrice: item.unitPrice / 100,
        subtotal: item.subtotal / 100
      }))
    }

    return NextResponse.json(orderWithDisplayPrice)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// 更新訂單（管理員專用）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params
    const body = await request.json()
    const { status, paymentStatus, customerPhone, customerNote, adminNote } = body

    // 建立更新資料物件
    const updateData: {
      status?: OrderStatus
      paymentStatus?: PaymentStatus
      customerPhone?: string
      customerNote?: string
      adminNote?: string
    } = {}
    if (status !== undefined) updateData.status = status
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone
    if (customerNote !== undefined) updateData.customerNote = customerNote
    if (adminNote !== undefined) updateData.adminNote = adminNote

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
      }
    })

    // 轉換價格單位用於回傳
    const orderWithDisplayPrice = {
      ...order,
      totalAmount: order.totalAmount / 100,
      orderItems: order.orderItems.map((item: { id: string; unitPrice: number; subtotal: number; productName: string; productImage: string; quantity: number; orderId: string; productId: string }) => ({
        ...item,
        unitPrice: item.unitPrice / 100,
        subtotal: item.subtotal / 100
      }))
    }

    return NextResponse.json(orderWithDisplayPrice)
  } catch (error) {
    console.error('Error updating order:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

// 刪除訂單（管理員專用）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params
    await prisma.order.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}