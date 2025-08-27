import { NextResponse } from 'next/server'
import { getRedis, pingRedis } from '@/lib/redis'

// GET /api/debug/redis
export async function GET() {
  try {
    console.log('🔍 開始測試Redis連接...')

    // 1. 檢查Redis是否能ping通
    const isConnected = await pingRedis()
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          message: '無法連接到Redis' 
        },
        { status: 500 }
      )
    }

    // 2. 測試基本的寫入和讀取操作
    const redis = getRedis()
    const testKey = 'test:connection'
    const testValue = `測試時間: ${new Date().toISOString()}`

    // 寫入測試數據
    await redis.set(testKey, testValue)
    console.log('✍️ 已寫入測試數據')

    // 讀取測試數據
    const retrievedValue = await redis.get(testKey)
    console.log('📖 已讀取測試數據:', retrievedValue)

    // 刪除測試數據
    await redis.del(testKey)
    console.log('🗑️ 已刪除測試數據')

    // 3. 獲取Redis伺服器信息
    const info = await redis.info('server')
    const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown'

    return NextResponse.json({
      success: true,
      message: 'Redis連接測試成功！',
      data: {
        connected: true,
        version: redisVersion,
        testValue: retrievedValue,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Redis測試失敗:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Redis測試失敗', 
        error: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    )
  }
}