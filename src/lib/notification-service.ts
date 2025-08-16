import { prisma } from '@/lib/prisma'

export interface NotificationData {
  userId: string
  type: 'ORDER_STATUS_CHANGED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'NEW_MESSAGE' | 'LOW_STOCK_WARNING' | 'OUT_OF_STOCK' | 'STOCK_RESTOCK' | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_SECURITY'
  title: string
  message: string
  data?: Record<string, any>
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  expiresAt?: Date
}

/**
 * 創建單個通知
 */
export async function createNotification(notificationData: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data ? JSON.stringify(notificationData.data) : null,
        priority: notificationData.priority || 'NORMAL',
        expiresAt: notificationData.expiresAt || null
      }
    })

    console.log(`✅ 通知已創建：${notification.title} -> ${notificationData.userId}`)
    return notification
  } catch (error) {
    console.error('創建通知失敗:', error)
    throw error
  }
}

/**
 * 批量創建通知
 */
export async function createBulkNotifications(notifications: NotificationData[]) {
  try {
    const result = await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data ? JSON.stringify(n.data) : null,
        priority: n.priority || 'NORMAL',
        expiresAt: n.expiresAt || null
      }))
    })

    console.log(`✅ 批量創建 ${result.count} 個通知`)
    return result
  } catch (error) {
    console.error('批量創建通知失敗:', error)
    throw error
  }
}

/**
 * 訂單狀態變更通知
 */
export async function notifyOrderStatusChanged(
  userId: string,
  orderNumber: string,
  oldStatus: string,
  newStatus: string,
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
) {
  const statusNames: Record<string, string> = {
    'PAID': '已付款',
    'CONFIRMED': '已確認',
    'PROCESSING': '採購中',
    'SHIPPED': '已出貨',
    'DELIVERED': '已送達',
    'CANCELLED': '已取消'
  }

  return createNotification({
    userId,
    type: newStatus === 'SHIPPED' ? 'ORDER_SHIPPED' : 
          newStatus === 'DELIVERED' ? 'ORDER_DELIVERED' : 'ORDER_STATUS_CHANGED',
    title: `訂單狀態更新`,
    message: `您的訂單 ${orderNumber} 狀態已從「${statusNames[oldStatus]}」更新為「${statusNames[newStatus]}」`,
    data: {
      orderNumber,
      oldStatus,
      newStatus,
      type: 'order_status'
    },
    priority
  })
}

/**
 * 新聊天消息通知
 */
export async function notifyNewMessage(
  userId: string,
  senderName: string,
  messagePreview: string,
  chatId: string
) {
  return createNotification({
    userId,
    type: 'NEW_MESSAGE',
    title: `新訊息來自 ${senderName}`,
    message: messagePreview.length > 50 
      ? messagePreview.substring(0, 50) + '...' 
      : messagePreview,
    data: {
      chatId,
      senderName,
      type: 'chat_message'
    },
    priority: 'NORMAL'
  })
}

/**
 * 低庫存警告通知（管理員）
 */
export async function notifyLowStock(
  adminUserId: string,
  productName: string,
  currentStock: number,
  minStock: number,
  productId: string
) {
  return createNotification({
    userId: adminUserId,
    type: 'LOW_STOCK_WARNING',
    title: '庫存不足警告',
    message: `商品「${productName}」庫存不足！目前庫存：${currentStock}，最低警戒值：${minStock}`,
    data: {
      productId,
      productName,
      currentStock,
      minStock,
      type: 'stock_warning'
    },
    priority: 'HIGH'
  })
}

/**
 * 缺貨通知（管理員）
 */
export async function notifyOutOfStock(
  adminUserId: string,
  productName: string,
  productId: string
) {
  return createNotification({
    userId: adminUserId,
    type: 'OUT_OF_STOCK',
    title: '商品缺貨',
    message: `商品「${productName}」已完全缺貨，請盡快補貨！`,
    data: {
      productId,
      productName,
      type: 'out_of_stock'
    },
    priority: 'URGENT'
  })
}

/**
 * 補貨完成通知（管理員）
 */
export async function notifyRestockCompleted(
  adminUserId: string,
  productName: string,
  restockAmount: number,
  newStock: number,
  productId: string
) {
  return createNotification({
    userId: adminUserId,
    type: 'STOCK_RESTOCK',
    title: '補貨完成',
    message: `商品「${productName}」已完成補貨 ${restockAmount} 件，目前庫存：${newStock}`,
    data: {
      productId,
      productName,
      restockAmount,
      newStock,
      type: 'restock_completed'
    },
    priority: 'NORMAL'
  })
}

/**
 * 系統公告通知
 */
export async function notifySystemAnnouncement(
  userIds: string[],
  title: string,
  message: string,
  expiresAt?: Date,
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
) {
  const notifications = userIds.map(userId => ({
    userId,
    type: 'SYSTEM_ANNOUNCEMENT' as const,
    title,
    message,
    data: { type: 'system_announcement' },
    priority,
    expiresAt
  }))

  return createBulkNotifications(notifications)
}

/**
 * 清理過期通知
 */
export async function cleanupExpiredNotifications() {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    console.log(`🧹 清理了 ${result.count} 個過期通知`)
    return result
  } catch (error) {
    console.error('清理過期通知失敗:', error)
    throw error
  }
}