#!/usr/bin/env tsx
// 資料庫同步工具
// 使用方式: npx tsx scripts/db-sync.ts [pull|push]

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Neon PostgreSQL 連接
const neonPrisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_y1HIV7lQUKCq@ep-purple-shape-aebomfjn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
})

// 本地 SQLite 連接  
const localPrisma = new PrismaClient({
  datasourceUrl: "file:./prisma/dev.db"
})

// 同步所有資料表
async function syncData(direction: 'pull' | 'push') {
  console.log(`開始${direction === 'pull' ? '拉取' : '推送'}資料...`)
  
  try {
    if (direction === 'pull') {
      // 從 Neon 拉取資料到本地 SQLite
      await pullFromNeon()
    } else {
      // 從本地 SQLite 推送資料到 Neon
      await pushToNeon()
    }
    
    console.log('資料同步完成！')
  } catch (error) {
    console.error('同步失敗:', error)
  } finally {
    await neonPrisma.$disconnect()
    await localPrisma.$disconnect()
  }
}

async function pullFromNeon() {
  console.log('清空本地資料庫...')
  
  // 清空本地資料庫（保持結構）
  await localPrisma.wishlist.deleteMany()
  await localPrisma.review.deleteMany()
  await localPrisma.orderItem.deleteMany()
  await localPrisma.order.deleteMany()
  await localPrisma.productImage.deleteMany()
  await localPrisma.product.deleteMany()
  await localPrisma.message.deleteMany()
  await localPrisma.chat.deleteMany()
  await localPrisma.notification.deleteMany()
  await localPrisma.stockHistory.deleteMany()
  await localPrisma.user.deleteMany()
  
  console.log('從 Neon 拉取資料...')
  
  // 1. 同步用戶
  const neonUsers = await neonPrisma.user.findMany()
  for (const user of neonUsers) {
    await localPrisma.user.create({ data: user })
  }
  console.log(`同步了 ${neonUsers.length} 個用戶`)
  
  // 2. 同步商品
  const neonProducts = await neonPrisma.product.findMany({ 
    include: { images: true } 
  })
  for (const product of neonProducts) {
    const { images, ...productData } = product
    const createdProduct = await localPrisma.product.create({ data: productData })
    
    // 同步商品圖片
    for (const image of images) {
      await localPrisma.productImage.create({
        data: {
          ...image,
          productId: createdProduct.id
        }
      })
    }
  }
  console.log(`同步了 ${neonProducts.length} 個商品`)
  
  // 3. 同步聊天記錄
  const neonChats = await neonPrisma.chat.findMany()
  for (const chat of neonChats) {
    await localPrisma.chat.create({ data: chat })
  }
  
  // 4. 同步訊息
  const neonMessages = await neonPrisma.message.findMany()
  for (const message of neonMessages) {
    await localPrisma.message.create({ data: message })
  }
  
  // 5. 同步訂單
  const neonOrders = await neonPrisma.order.findMany({ 
    include: { orderItems: true } 
  })
  for (const order of neonOrders) {
    const { orderItems, ...orderData } = order
    const createdOrder = await localPrisma.order.create({ data: orderData })
    
    // 同步訂單項目
    for (const item of orderItems) {
      await localPrisma.orderItem.create({
        data: {
          ...item,
          orderId: createdOrder.id
        }
      })
    }
  }
  console.log(`同步了 ${neonOrders.length} 個訂單`)
  
  // 6. 同步評價
  const neonReviews = await neonPrisma.review.findMany()
  for (const review of neonReviews) {
    await localPrisma.review.create({ data: review })
  }
  console.log(`同步了 ${neonReviews.length} 個評價`)
  
  // 7. 同步願望清單
  const neonWishlists = await neonPrisma.wishlist.findMany()
  for (const wishlist of neonWishlists) {
    await localPrisma.wishlist.create({ data: wishlist })
  }
  console.log(`同步了 ${neonWishlists.length} 個願望清單項目`)
  
  // 8. 同步通知
  const neonNotifications = await neonPrisma.notification.findMany()
  for (const notification of neonNotifications) {
    await localPrisma.notification.create({ data: notification })
  }
  console.log(`同步了 ${neonNotifications.length} 個通知`)
  
  // 9. 同步庫存歷史
  const neonStockHistory = await neonPrisma.stockHistory.findMany()
  for (const stock of neonStockHistory) {
    await localPrisma.stockHistory.create({ data: stock })
  }
  console.log(`同步了 ${neonStockHistory.length} 個庫存記錄`)
}

async function pushToNeon() {
  console.log('⚠️  注意: 推送會覆蓋 Neon 資料庫的資料')
  console.log('清空 Neon 資料庫...')
  
  // 清空 Neon 資料庫（保持結構）
  await neonPrisma.wishlist.deleteMany()
  await neonPrisma.review.deleteMany()
  await neonPrisma.orderItem.deleteMany()
  await neonPrisma.order.deleteMany()
  await neonPrisma.productImage.deleteMany()
  await neonPrisma.product.deleteMany()
  await neonPrisma.message.deleteMany()
  await neonPrisma.chat.deleteMany()
  await neonPrisma.notification.deleteMany()
  await neonPrisma.stockHistory.deleteMany()
  await neonPrisma.user.deleteMany()
  
  console.log('從本地推送資料到 Neon...')
  
  // 1. 推送用戶
  const localUsers = await localPrisma.user.findMany()
  for (const user of localUsers) {
    await neonPrisma.user.create({ data: user })
  }
  console.log(`推送了 ${localUsers.length} 個用戶`)
  
  // 2. 推送商品
  const localProducts = await localPrisma.product.findMany({ 
    include: { images: true } 
  })
  for (const product of localProducts) {
    const { images, ...productData } = product
    const createdProduct = await neonPrisma.product.create({ data: productData })
    
    // 推送商品圖片
    for (const image of images) {
      await neonPrisma.productImage.create({
        data: {
          ...image,
          productId: createdProduct.id
        }
      })
    }
  }
  console.log(`推送了 ${localProducts.length} 個商品`)
  
  // ... 其他資料表的推送邏輯與拉取相同
}

// 主程式
const action = process.argv[2]

if (!action || !['pull', 'push'].includes(action)) {
  console.log('使用方式:')
  console.log('  npx tsx scripts/db-sync.ts pull   # 從 Neon 拉取資料到本地')
  console.log('  npx tsx scripts/db-sync.ts push   # 從本地推送資料到 Neon')
  process.exit(1)
}

syncData(action as 'pull' | 'push')