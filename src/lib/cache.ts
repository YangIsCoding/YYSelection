import { getRedis } from './redis'

/**
 * 通用快取工具函數
 * 使用 Cache-Aside 模式：先查快取，沒有才查資料庫
 */

/**
 * 取得快取資料
 * @param key Redis鍵名
 * @returns 解析後的JSON物件或null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis()
    const cached = await redis.get(key)
    
    if (!cached) {
      console.log(`🔍 快取未命中: ${key}`)
      return null
    }
    
    console.log(`✅ 快取命中: ${key}`)
    return JSON.parse(cached) as T
  } catch (error) {
    console.error(`❌ 取得快取失敗 [${key}]:`, error)
    return null // 快取失敗時不影響主要功能
  }
}

/**
 * 設定快取資料
 * @param key Redis鍵名
 * @param data 要快取的資料
 * @param ttl 過期時間（秒），預設5分鐘
 */
export async function setCache<T>(
  key: string, 
  data: T, 
  ttl: number = 300  // 預設5分鐘
): Promise<void> {
  try {
    const redis = getRedis()
    
    // 將物件序列化為JSON字串
    const serialized = JSON.stringify(data)
    
    // 設定快取和過期時間
    await redis.setex(key, ttl, serialized)
    
    console.log(`💾 已快取資料: ${key} (TTL: ${ttl}秒)`)
  } catch (error) {
    console.error(`❌ 設定快取失敗 [${key}]:`, error)
    // 快取失敗不拋出錯誤，不影響主要功能
  }
}

/**
 * 刪除快取
 * @param key Redis鍵名或鍵名陣列
 */
export async function deleteCache(key: string | string[]): Promise<void> {
  try {
    const redis = getRedis()
    
    if (Array.isArray(key)) {
      if (key.length > 0) {
        await redis.del(...key)
        console.log(`🗑️ 已刪除快取: ${key.join(', ')}`)
      }
    } else {
      await redis.del(key)
      console.log(`🗑️ 已刪除快取: ${key}`)
    }
  } catch (error) {
    console.error(`❌ 刪除快取失敗:`, error)
  }
}

/**
 * 批量刪除符合模式的快取鍵
 * @param pattern Redis鍵名模式 (如: product:* 會刪除所有以product:開頭的鍵)
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis()
    
    // 搜尋符合模式的鍵
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️ 已刪除快取模式 ${pattern}: ${keys.length} 個鍵`)
    } else {
      console.log(`🔍 沒有找到符合模式的快取: ${pattern}`)
    }
  } catch (error) {
    console.error(`❌ 刪除快取模式失敗 [${pattern}]:`, error)
  }
}

/**
 * 檢查快取是否存在
 * @param key Redis鍵名
 * @returns 是否存在
 */
export async function existsCache(key: string): Promise<boolean> {
  try {
    const redis = getRedis()
    const exists = await redis.exists(key)
    return exists === 1
  } catch (error) {
    console.error(`❌ 檢查快取存在失敗 [${key}]:`, error)
    return false
  }
}