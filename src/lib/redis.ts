import Redis from 'ioredis'

// 全域變數來存儲Redis連接實例
let redis: Redis | null = null

/**
 * 取得Redis連接實例
 * 使用單例模式，確保整個應用只有一個Redis連接
 */
export function getRedis(): Redis {
  // 如果已經有連接，直接返回
  if (redis) {
    return redis
  }

  // 從環境變數取得Redis URL
  // Docker環境用 redis:6379，本機開發用 localhost:6379
  const redisUrl = process.env.REDIS_URL || 
    (process.env.NODE_ENV === 'production' ? 'redis://redis:6379' : 'redis://localhost:6379')
  
  console.log('🔗 建立Redis連接:', redisUrl)

  try {
    // 創建新的Redis連接
    redis = new Redis(redisUrl, {
      // 連接設定
      maxRetriesPerRequest: 3,    // 每個請求最多重試3次
      lazyConnect: true,          // 延遲連接，用到時才連
      keepAlive: 30000,           // 保持連接30秒
    })

    // 監聽連接事件
    redis.on('connect', () => {
      console.log('✅ Redis已連接')
    })

    redis.on('error', (error) => {
      console.error('❌ Redis連接錯誤:', error)
    })

    redis.on('close', () => {
      console.log('🔌 Redis連接已關閉')
    })

    return redis
    
  } catch (error) {
    console.error('❌ 創建Redis連接失敗:', error)
    throw error
  }
}

/**
 * 關閉Redis連接
 * 應用關閉時調用
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    console.log('🔌 正在關閉Redis連接...')
    await redis.quit()
    redis = null
  }
}

/**
 * 檢查Redis連接狀態
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const client = getRedis()
    const result = await client.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('❌ Redis ping失敗:', error)
    return false
  }
}