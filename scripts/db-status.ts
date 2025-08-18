#!/usr/bin/env tsx
// 資料庫狀態檢查工具
// 使用方式: npx tsx scripts/db-status.ts

import { PrismaClient } from '@prisma/client'

// Neon PostgreSQL 連接（從環境變數讀取）
const neonPrisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
})

// 本地 SQLite 連接  
const localPrisma = new PrismaClient({
  datasourceUrl: "file:./prisma/dev.db"
})

interface DatabaseStats {
  users: number
  products: number
  orders: number
  reviews: number
  wishlists: number
  chats: number
  messages: number
  notifications: number
}

async function getDatabaseStats(prisma: PrismaClient): Promise<DatabaseStats> {
  const [
    users,
    products,
    orders,
    reviews,
    wishlists,
    chats,
    messages,
    notifications
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.review.count(),
    prisma.wishlist.count(),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.notification.count()
  ])

  return {
    users,
    products,
    orders,
    reviews,
    wishlists,
    chats,
    messages,
    notifications
  }
}

async function checkDatabaseStatus() {
  console.log('🔍 檢查資料庫狀態...\n')

  try {
    // 檢查 Neon 資料庫
    console.log('📊 Neon PostgreSQL 資料庫:')
    const neonStats = await getDatabaseStats(neonPrisma)
    printStats(neonStats)

    console.log('\n📊 本地 SQLite 資料庫:')
    
    // 檢查本地資料庫是否存在
    try {
      const localStats = await getDatabaseStats(localPrisma)
      printStats(localStats)
      
      console.log('\n📈 同步狀態比較:')
      compareStats(neonStats, localStats)
      
    } catch (error) {
      console.log('❌ 本地資料庫不存在或無法連接')
      console.log('💡 執行 `npm run db:setup:local` 來設置本地資料庫')
    }

  } catch (error) {
    console.error('❌ 檢查資料庫狀態失敗:', error)
  } finally {
    await neonPrisma.$disconnect()
    await localPrisma.$disconnect()
  }
}

function printStats(stats: DatabaseStats) {
  Object.entries(stats).forEach(([key, count]) => {
    const emoji = getTableEmoji(key)
    console.log(`   ${emoji} ${key}: ${count}`)
  })
}

function compareStats(neon: DatabaseStats, local: DatabaseStats) {
  Object.entries(neon).forEach(([key, neonCount]) => {
    const localCount = local[key as keyof DatabaseStats]
    const diff = neonCount - localCount
    const emoji = getTableEmoji(key)
    
    if (diff === 0) {
      console.log(`   ✅ ${emoji} ${key}: 已同步 (${neonCount})`)
    } else if (diff > 0) {
      console.log(`   ⬆️  ${emoji} ${key}: Neon 多 ${diff} 筆 (Neon: ${neonCount}, 本地: ${localCount})`)
    } else {
      console.log(`   ⬇️  ${emoji} ${key}: 本地多 ${Math.abs(diff)} 筆 (Neon: ${neonCount}, 本地: ${localCount})`)
    }
  })
  
  console.log('\n💡 同步建議:')
  const totalNeon = Object.values(neon).reduce((a, b) => a + b, 0)
  const totalLocal = Object.values(local).reduce((a, b) => a + b, 0)
  
  if (totalNeon > totalLocal) {
    console.log('   - 執行 `npm run db:sync:pull` 從 Neon 拉取最新資料')
  } else if (totalLocal > totalNeon) {
    console.log('   - 執行 `npm run db:sync:push` 推送本地資料到 Neon')
  } else {
    console.log('   - 兩個資料庫資料量相同，建議檢查個別資料表差異')
  }
}

function getTableEmoji(tableName: string): string {
  const emojiMap: { [key: string]: string } = {
    users: '👤',
    products: '📦',
    orders: '🛒',
    reviews: '⭐',
    wishlists: '❤️',
    chats: '💬',
    messages: '📝',
    notifications: '🔔'
  }
  return emojiMap[tableName] || '📋'
}

// 執行狀態檢查
checkDatabaseStatus()