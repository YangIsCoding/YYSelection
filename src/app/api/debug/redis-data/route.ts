import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

// GET /api/debug/redis-data - 檢視Redis中的資料
export async function GET() {
  try {
    const redis = getRedis()
    
    // 1. 取得所有鍵名
    const allKeys = await redis.keys('*')
    console.log('🔍 找到Redis鍵:', allKeys)
    
    if (allKeys.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Redis中沒有資料',
        data: {
          totalKeys: 0,
          keys: []
        }
      })
    }
    
    // 2. 取得每個鍵的詳細資訊
    const keysData = []
    
    for (const key of allKeys) {
      try {
        // 取得鍵的類型
        const type = await redis.type(key)
        
        // 取得過期時間 (-1表示永久, -2表示已過期)
        const ttl = await redis.ttl(key)
        
        let value: any = null
        let size = 0
        
        // 根據不同資料類型取得內容
        switch (type) {
          case 'string':
            value = await redis.get(key)
            size = value ? value.length : 0
            
            // 如果是JSON，嘗試解析
            try {
              if (value && (value.startsWith('{') || value.startsWith('['))) {
                const parsed = JSON.parse(value)
                value = {
                  raw: value.substring(0, 200) + (value.length > 200 ? '...' : ''),
                  parsed: Array.isArray(parsed) ? {
                    type: 'Array',
                    length: parsed.length,
                    sample: parsed.slice(0, 2) // 顯示前2個元素
                  } : {
                    type: 'Object',
                    keys: Object.keys(parsed).length,
                    sampleKeys: Object.keys(parsed).slice(0, 5)
                  }
                }
              } else {
                value = value?.substring(0, 200) + (value && value.length > 200 ? '...' : '')
              }
            } catch {
              // 不是JSON，保持原樣但截斷
              value = value?.substring(0, 200) + (value && value.length > 200 ? '...' : '')
            }
            break
            
          case 'hash':
            const hashKeys = await redis.hkeys(key)
            const hashSize = hashKeys.length
            value = {
              type: 'Hash',
              fieldCount: hashSize,
              fields: hashSize > 0 ? hashKeys.slice(0, 5) : [],
              sample: hashSize > 0 ? await redis.hmget(key, ...hashKeys.slice(0, 2)) : []
            }
            size = hashSize
            break
            
          case 'list':
            const listLength = await redis.llen(key)
            value = {
              type: 'List',
              length: listLength,
              sample: listLength > 0 ? await redis.lrange(key, 0, 1) : []
            }
            size = listLength
            break
            
          case 'set':
            const setSize = await redis.scard(key)
            value = {
              type: 'Set',
              size: setSize,
              sample: setSize > 0 ? await redis.srandmember(key, 2) : []
            }
            size = setSize
            break
            
          default:
            value = `未支援的資料類型: ${type}`
        }
        
        keysData.push({
          key,
          type,
          ttl: ttl === -1 ? '永久' : ttl === -2 ? '已過期' : `${ttl}秒`,
          size,
          value
        })
        
      } catch (error) {
        console.error(`處理鍵 ${key} 時發生錯誤:`, error)
        keysData.push({
          key,
          type: 'error',
          ttl: 'unknown',
          size: 0,
          value: `錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Redis資料檢視成功',
      data: {
        totalKeys: allKeys.length,
        keys: keysData,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ 檢視Redis資料失敗:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: '檢視Redis資料失敗', 
        error: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    )
  }
}