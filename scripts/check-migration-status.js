#!/usr/bin/env node

// Migration 狀態檢查工具
// 使用方法: node scripts/check-migration-status.js

const { PrismaClient } = require('@prisma/client')

async function checkMigrationStatus() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 檢查 Migration 狀態...\n')
    
    // 檢查 _prisma_migrations 表
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 10
    `
    
    console.log('📋 最近的 Migrations:')
    migrations.forEach((migration, index) => {
      console.log(`${index + 1}. ${migration.migration_name}`)
      console.log(`   完成時間: ${migration.finished_at}`)
      console.log(`   步驟數: ${migration.applied_steps_count}`)
      console.log('')
    })
    
    // 檢查資料庫連線
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ 資料庫連線正常')
    
    // 檢查重要表格
    const productCount = await prisma.product.count()
    const userCount = await prisma.user.count()
    const orderCount = await prisma.order.count()
    
    console.log('\n📊 資料統計:')
    console.log(`商品數量: ${productCount}`)
    console.log(`用戶數量: ${userCount}`)
    console.log(`訂單數量: ${orderCount}`)
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigrationStatus()