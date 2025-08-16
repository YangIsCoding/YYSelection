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

    // 並行獲取快速操作相關數據
    const [
      // 待處理訂單
      pendingOrders,
      
      // 未讀訊息
      unreadChats,
      
      // 低庫存商品
      lowStockProducts,
      
      // 最近的訂單
      recentOrders
    ] = await Promise.all([
      // 獲取待處理訂單
      prisma.order.findMany({
        where: {
          status: { in: ['PAID', 'CONFIRMED'] }
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
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
            take: 3, // 只取前3個商品項目
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true
                }
              }
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        }
      }),

      // 獲取有未讀訊息的聊天室
      prisma.chat.findMany({
        where: {
          isActive: true,
          messages: {
            some: {
              isRead: false,
              sender: { role: 'USER' }
            }
          }
        },
        take: 10,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          messages: {
            where: {
              isRead: false,
              sender: { role: 'USER' }
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              messageType: true
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  sender: { role: 'USER' }
                }
              }
            }
          }
        }
      }),

      // 獲取低庫存商品
      prisma.product.findMany({
        where: {
          isActive: true,
          stock: {
            lt: prisma.product.fields.minStock
          }
        },
        take: 10,
        orderBy: { stock: 'asc' },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          imageUrl: true,
          category: true
        }
      }),

      // 獲取最近的訂單
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        }
      })
    ])

    // 處理訂單數據，轉換價格單位
    const processedPendingOrders = pendingOrders.map(order => ({
      ...order,
      totalAmount: order.totalAmount / 100,
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice / 100,
        subtotal: item.subtotal / 100
      }))
    }))

    const processedRecentOrders = recentOrders.map(order => ({
      ...order,
      totalAmount: order.totalAmount / 100
    }))

    // 處理未讀聊天數據
    const processedUnreadChats = unreadChats.map(chat => ({
      ...chat,
      latestMessage: chat.messages[0] || null,
      unreadCount: chat._count.messages
    }))

    const quickActions = {
      // 待處理訂單
      pendingOrders: {
        count: pendingOrders.length,
        orders: processedPendingOrders
      },

      // 未讀訊息
      unreadChats: {
        count: unreadChats.reduce((sum, chat) => sum + chat._count.messages, 0),
        chats: processedUnreadChats
      },

      // 低庫存商品
      lowStockProducts: {
        count: lowStockProducts.length,
        products: lowStockProducts
      },

      // 最近訂單
      recentOrders: {
        orders: processedRecentOrders
      },

      // 系統狀態
      systemStatus: {
        totalPendingActions: pendingOrders.length + 
                           unreadChats.reduce((sum, chat) => sum + chat._count.messages, 0) + 
                           lowStockProducts.length,
        lastUpdated: new Date().toISOString()
      }
    }

    return NextResponse.json(quickActions)
  } catch (error) {
    console.error('Error fetching quick actions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quick actions data' },
      { status: 500 }
    )
  }
}