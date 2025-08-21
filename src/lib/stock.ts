import { prisma } from '@/lib/prisma'
import { StockChangeType } from '@prisma/client'
import { notifyLowStock, notifyOutOfStock, notifyRestockCompleted } from '@/lib/notification-service'

export interface StockAdjustment {
  productId: string
  quantity: number
  reason: string
  changeType: StockChangeType
  userId?: string
  orderId?: string
}

/**
 * 調整商品庫存並記錄歷史
 */
export async function adjustStock({
  productId,
  quantity,
  reason,
  changeType,
  userId,
  orderId
}: StockAdjustment) {
  return await prisma.$transaction(async (tx) => {
    // 取得當前庫存
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true }
    })

    if (!product) {
      throw new Error('商品不存在')
    }

    const beforeStock = product.stock
    const afterStock = beforeStock + quantity

    // 檢查庫存不能為負數
    if (afterStock < 0) {
      throw new Error(`庫存不足，當前庫存：${beforeStock}，需要：${Math.abs(quantity)}`)
    }

    // 更新商品庫存
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { stock: afterStock }
    })

    // 記錄庫存變更歷史
    const stockHistory = await tx.stockHistory.create({
      data: {
        productId,
        changeType,
        quantity,
        beforeStock,
        afterStock,
        reason,
        userId,
        orderId
      }
    })

    // 庫存通知處理（在交易外執行）
    setTimeout(async () => {
      try {
        // 獲取所有管理員
        const adminUsers = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        })

        // 檢查庫存狀態並發送相應通知
        if (afterStock === 0 && beforeStock > 0) {
          // 商品缺貨
          for (const admin of adminUsers) {
            await notifyOutOfStock(admin.id, product.name, productId)
          }
        } else if (afterStock > 0 && beforeStock === 0 && quantity > 0) {
          // 補貨完成（從缺貨狀態恢復）
          for (const admin of adminUsers) {
            await notifyRestockCompleted(admin.id, product.name, quantity, afterStock, productId)
          }
        } else if (afterStock > 0 && afterStock < updatedProduct.minStock && beforeStock >= updatedProduct.minStock) {
          // 進入低庫存狀態
          for (const admin of adminUsers) {
            await notifyLowStock(admin.id, product.name, afterStock, updatedProduct.minStock, productId)
          }
        }
      } catch (notificationError) {
        console.error('庫存通知發送失敗:', notificationError)
      }
    }, 100) // 延遲執行以確保交易完成

    return {
      product: updatedProduct,
      stockHistory
    }
  })
}

/**
 * 批量檢查商品庫存是否足夠
 */
export async function checkStockAvailability(items: Array<{ productId: string; quantity: number }>) {
  const productIds = items.map(item => item.productId)
  
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      stock: true,
      isActive: true
    }
  })

  const stockCheck = items.map(item => {
    const product = products.find(p => p.id === item.productId)
    
    if (!product) {
      return {
        productId: item.productId,
        available: false,
        reason: '商品不存在或已停用'
      }
    }

    if (!product.isActive) {
      return {
        productId: item.productId,
        available: false,
        reason: '商品已停用'
      }
    }

    if (product.stock < item.quantity) {
      return {
        productId: item.productId,
        available: false,
        reason: `庫存不足，需要 ${item.quantity} 個，剩餘 ${product.stock} 個`,
        currentStock: product.stock,
        requestedQuantity: item.quantity
      }
    }

    return {
      productId: item.productId,
      available: true,
      currentStock: product.stock,
      requestedQuantity: item.quantity
    }
  })

  const allAvailable = stockCheck.every(check => check.available)
  const unavailableItems = stockCheck.filter(check => !check.available)

  return {
    allAvailable,
    stockCheck,
    unavailableItems
  }
}

/**
 * 處理訂單相關的庫存變更（在事務內執行）
 */
export async function processOrderStock(orderId: string, items: Array<{ productId: string; quantity: number }>, type: 'place' | 'cancel', tx?: import('@prisma/client').PrismaClient) {
  const results = []

  for (const item of items) {
    const quantity = type === 'place' ? -item.quantity : item.quantity
    const changeType = type === 'place' ? StockChangeType.ORDER_PLACED : StockChangeType.ORDER_CANCELLED
    const reason = type === 'place' 
      ? `訂單 ${orderId} 購買 ${item.quantity} 個商品`
      : `訂單 ${orderId} 取消，退回 ${item.quantity} 個商品`

    if (tx) {
      // 在現有事務中執行
      const result = await adjustStockInTransaction(tx, {
        productId: item.productId,
        quantity,
        reason,
        changeType,
        orderId
      })
      results.push(result)
    } else {
      // 建立新事務
      const result = await adjustStock({
        productId: item.productId,
        quantity,
        reason,
        changeType,
        orderId
      })
      results.push(result)
    }
  }

  return results
}

/**
 * 在現有事務中調整庫存
 */
export async function adjustStockInTransaction(tx: import('@prisma/client').PrismaClient, {
  productId,
  quantity,
  reason,
  changeType,
  userId,
  orderId
}: StockAdjustment) {
  // 取得當前庫存
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { stock: true, name: true, minStock: true }
  })

  if (!product) {
    throw new Error('商品不存在')
  }

  const beforeStock = product.stock
  const afterStock = beforeStock + quantity

  // 檢查庫存不能為負數
  if (afterStock < 0) {
    throw new Error(`庫存不足，當前庫存：${beforeStock}，需要：${Math.abs(quantity)}`)
  }

  // 更新商品庫存
  const updatedProduct = await tx.product.update({
    where: { id: productId },
    data: { stock: afterStock }
  })

  // 記錄庫存變更歷史
  const stockHistory = await tx.stockHistory.create({
    data: {
      productId,
      changeType,
      quantity,
      beforeStock,
      afterStock,
      reason,
      userId,
      orderId
    }
  })

  // 庫存通知處理（在事務外執行）
  setTimeout(async () => {
    try {
      // 獲取所有管理員
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      })

      // 檢查庫存狀態並發送相應通知
      if (afterStock === 0 && beforeStock > 0) {
        // 商品缺貨
        for (const admin of adminUsers) {
          await notifyOutOfStock(admin.id, product.name, productId)
        }
      } else if (afterStock > 0 && beforeStock === 0 && quantity > 0) {
        // 補貨完成（從缺貨狀態恢復）
        for (const admin of adminUsers) {
          await notifyRestockCompleted(admin.id, product.name, quantity, afterStock, productId)
        }
      } else if (afterStock > 0 && afterStock < product.minStock && beforeStock >= product.minStock) {
        // 進入低庫存狀態
        for (const admin of adminUsers) {
          await notifyLowStock(admin.id, product.name, afterStock, product.minStock, productId)
        }
      }
    } catch (notificationError) {
      console.error('庫存通知發送失敗:', notificationError)
    }
  }, 100) // 延遲執行以確保交易完成

  return {
    product: updatedProduct,
    stockHistory
  }
}

/**
 * 取得低庫存商品列表
 */
export async function getLowStockProducts() {
  return await prisma.product.findMany({
    where: {
      isActive: true,
      stock: {
        lt: prisma.product.fields.minStock
      }
    },
    select: {
      id: true,
      name: true,
      stock: true,
      minStock: true,
      category: true,
      imageUrl: true
    },
    orderBy: {
      stock: 'asc'
    }
  })
}

/**
 * 取得商品庫存歷史
 */
export async function getStockHistory(productId: string, limit = 50) {
  return await prisma.stockHistory.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      order: {
        select: {
          id: true,
          orderNumber: true
        }
      }
    }
  })
}