import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 獲取當前時間的相關日期
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 並行獲取所有統計數據
    const [
      // 訂單統計
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,

      // 營收統計  
      todayRevenue,
      weekRevenue,
      monthRevenue,

      // 商品統計
      totalProducts,
      activeProducts,
      allActiveProducts,
      outOfStockProducts,

      // 用戶統計
      totalUsers,
      todayNewUsers,
      weekNewUsers,
      monthNewUsers,

      // 聊天統計
      totalChats,
      activeChats,
      unreadMessages,
      
      // 最近30天營收趨勢
      revenueHistory,
      
      // 熱銷商品
      topProducts
    ] = await Promise.all([
      // 訂單統計
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),

      // 營收統計
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: todayStart },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: weekStart },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: monthStart },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),

      // 商品統計
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          stock: true,
          minStock: true
        }
      }),
      prisma.product.count({ 
        where: { 
          isActive: true,
          stock: 0
        }
      }),

      // 用戶統計
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),

      // 聊天統計
      prisma.chat.count(),
      prisma.chat.count({ where: { isActive: true } }),
      prisma.message.count({ 
        where: { 
          isRead: false,
          sender: { role: 'USER' }
        }
      }),

      // 最近30天營收趨勢 - 獲取所有訂單後處理
      prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELLED' }
        },
        select: {
          createdAt: true,
          totalAmount: true
        },
        orderBy: { createdAt: 'asc' }
      }),

      // 熱銷商品 Top 10
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        _count: { _all: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
      })
    ])

    // 獲取熱銷商品詳細資訊
    const topProductDetails = await prisma.product.findMany({
      where: {
        id: { in: topProducts.map(item => item.productId) }
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        price: true,
        category: true
      }
    })

    // 合併熱銷商品數據
    const topProductsWithDetails = topProducts.map(item => {
      const product = topProductDetails.find(p => p.id === item.productId)
      return {
        ...product,
        price: product ? product.price / 100 : 0, // 轉換為元
        totalSold: item._sum.quantity || 0,
        orderCount: item._count._all
      }
    })

    // 處理低庫存商品計數
    const lowStockProducts = allActiveProducts.filter(product => product.stock < product.minStock).length

    // 處理營收趨勢數據 - 按日期分組
    const revenueByDate = new Map<string, number>()
    
    revenueHistory.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0] // YYYY-MM-DD格式
      const currentRevenue = revenueByDate.get(dateKey) || 0
      revenueByDate.set(dateKey, currentRevenue + order.totalAmount)
    })
    
    const revenueData = Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
      date,
      revenue: revenue / 100 // 轉換為元
    })).sort((a, b) => a.date.localeCompare(b.date))

    // 組織返回數據
    const stats = {
      // 訂單統計
      orders: {
        total: totalOrders,
        today: todayOrders,
        week: weekOrders,
        month: monthOrders,
        byStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        }
      },

      // 營收統計（轉換為元）
      revenue: {
        today: (todayRevenue._sum.totalAmount || 0) / 100,
        week: (weekRevenue._sum.totalAmount || 0) / 100,
        month: (monthRevenue._sum.totalAmount || 0) / 100,
        history: revenueData
      },

      // 商品統計
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        topSelling: topProductsWithDetails
      },

      // 用戶統計
      users: {
        total: totalUsers,
        today: todayNewUsers,
        week: weekNewUsers,
        month: monthNewUsers
      },

      // 聊天統計
      chats: {
        total: totalChats,
        active: activeChats,
        unreadMessages: unreadMessages
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}