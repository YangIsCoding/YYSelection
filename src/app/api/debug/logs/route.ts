import { NextResponse } from 'next/server'
import { getRedis, pingRedis } from '@/lib/redis'

// GET /api/debug/logs - 查看應用日誌
export async function GET() {
  try {
    // 獲取Redis狀態
    const redisStatus = await pingRedis()
    
    // 基本系統資訊
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      redis: redisStatus ? 'connected' : 'disconnected',
      region: process.env.VERCEL_REGION || 'unknown'
    }

    // 如果有Redis，獲取詳細快取資訊
    let redisStats = null
    if (redisStatus) {
      try {
        const redis = getRedis()
        const keys = await redis.keys('*')
        const info = await redis.info('memory')
        
        // 獲取所有快取內容
        const cacheData: Record<string, any> = {}
        for (const key of keys) {
          try {
            const value = await redis.get(key)
            const ttl = await redis.ttl(key)
            
            let parsedValue: any = value
            try {
              parsedValue = value ? JSON.parse(value) : null
            } catch {
              parsedValue = value // 如果不是JSON就保持原樣
            }
            
            let displayValue: string | any = parsedValue
            if (typeof parsedValue === 'object' && parsedValue !== null) {
              if (Array.isArray(parsedValue)) {
                displayValue = `[Array] ${(parsedValue as any[]).length} items`
              } else {
                displayValue = `[Object] ${Object.keys(parsedValue as Record<string, any>).length} keys`
              }
            }
            
            cacheData[key] = {
              value: displayValue,
              ttl: ttl > 0 ? `${ttl}秒後過期` : (ttl === -1 ? '永不過期' : '已過期'),
              type: Array.isArray(parsedValue) ? 'Array' : typeof parsedValue
            }
          } catch (e) {
            cacheData[key] = { error: '無法讀取此鍵' }
          }
        }
        
        redisStats = {
          status: '✅ Redis 連接正常',
          totalKeys: keys.length,
          keysByType: keys.reduce((acc: Record<string, number>, key) => {
            const prefix = key.split(':')[0]
            acc[prefix] = (acc[prefix] || 0) + 1
            return acc
          }, {}),
          memoryInfo: info.includes('used_memory_human') 
            ? info.match(/used_memory_human:([^\r\n]+)/)?.[1]?.trim() 
            : 'unavailable',
          cacheContents: cacheData,
          allKeys: keys
        }
      } catch (error) {
        redisStats = { 
          status: '❌ Redis 連接失敗',
          error: error instanceof Error ? error.message : 'unknown' 
        }
      }
    } else {
      redisStats = {
        status: '❌ Redis 未連接',
        message: '檢查 REDIS_URL 環境變數是否正確設定'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        system: systemInfo,
        redis: redisStats,
        message: '快取狀態檢查器 - 替代 console.log 查看',
        cacheActions: {
          hit: '✅ 快取命中 - 從Redis取得資料',
          miss: '🔍 快取未命中 - 從資料庫查詢',
          set: '💾 已儲存到快取',
          delete: '🗑️ 已刪除快取'
        },
        instructions: {
          testCache: '訪問 /api/products 來測試產品快取',
          checkCart: '登入後訪問 /api/cart 來測試購物車快取'
        }
      }
    })

  } catch (error) {
    console.error('❌ 獲取日誌資訊失敗:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤',
        system: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL
        }
      },
      { status: 500 }
    )
  }
}