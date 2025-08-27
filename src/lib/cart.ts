import { getRedis } from './redis'

/**
 * 購物車 Redis Hash 操作工具
 * 使用 Hash 結構儲存每個用戶的購物車：
 * Key: cart:userId
 * Fields: productId -> quantity
 */

export interface CartItem {
  productId: string
  quantity: number
}

export interface CartSummary {
  userId: string
  items: CartItem[]
  totalItems: number
  lastUpdated: string
}

/**
 * 生成購物車Redis鍵名
 */
function getCartKey(userId: string): string {
  return `cart:${userId}`
}

/**
 * 添加商品到購物車
 * @param userId 用戶ID
 * @param productId 商品ID  
 * @param quantity 數量（預設1）
 * @returns 添加後的數量
 */
export async function addToCart(
  userId: string, 
  productId: string, 
  quantity: number = 1
): Promise<number> {
  try {
    const redis = getRedis()
    const cartKey = getCartKey(userId)
    
    // 使用 HINCRBY 原子性地增加數量
    const newQuantity = await redis.hincrby(cartKey, productId, quantity)
    
    // 設定過期時間 7 天（購物車不應該永久保存）
    await redis.expire(cartKey, 7 * 24 * 60 * 60)
    
    console.log(`🛒 添加到購物車: 用戶${userId} 商品${productId} 數量+${quantity} = ${newQuantity}`)
    
    return newQuantity
  } catch (error) {
    console.error('❌ 添加購物車失敗:', error)
    throw error
  }
}

/**
 * 更新購物車商品數量
 * @param userId 用戶ID
 * @param productId 商品ID
 * @param quantity 新數量（0表示移除）
 */
export async function updateCartItem(
  userId: string, 
  productId: string, 
  quantity: number
): Promise<void> {
  try {
    const redis = getRedis()
    const cartKey = getCartKey(userId)
    
    if (quantity <= 0) {
      // 數量為0或負數，移除商品
      await redis.hdel(cartKey, productId)
      console.log(`🗑️ 從購物車移除: 用戶${userId} 商品${productId}`)
    } else {
      // 設定新數量
      await redis.hset(cartKey, productId, quantity.toString())
      console.log(`📝 更新購物車: 用戶${userId} 商品${productId} 數量=${quantity}`)
    }
    
    // 重新設定過期時間
    await redis.expire(cartKey, 7 * 24 * 60 * 60)
    
  } catch (error) {
    console.error('❌ 更新購物車失敗:', error)
    throw error
  }
}

/**
 * 從購物車移除商品
 * @param userId 用戶ID
 * @param productId 商品ID
 */
export async function removeFromCart(
  userId: string, 
  productId: string
): Promise<void> {
  try {
    const redis = getRedis()
    const cartKey = getCartKey(userId)
    
    const removed = await redis.hdel(cartKey, productId)
    
    if (removed > 0) {
      console.log(`🗑️ 從購物車移除: 用戶${userId} 商品${productId}`)
    } else {
      console.log(`⚠️ 商品不在購物車中: 用戶${userId} 商品${productId}`)
    }
    
  } catch (error) {
    console.error('❌ 移除購物車商品失敗:', error)
    throw error
  }
}

/**
 * 取得用戶的購物車內容
 * @param userId 用戶ID
 * @returns 購物車摘要
 */
export async function getCart(userId: string): Promise<CartSummary> {
  try {
    const redis = getRedis()
    const cartKey = getCartKey(userId)
    
    // 取得購物車所有商品和數量
    const cartData = await redis.hgetall(cartKey)
    
    // 轉換為 CartItem 格式
    const items: CartItem[] = Object.entries(cartData).map(([productId, quantity]) => ({
      productId,
      quantity: parseInt(quantity, 10)
    }))
    
    // 計算總數量
    const totalItems = items.reduce((total, item) => total + item.quantity, 0)
    
    console.log(`📦 取得購物車: 用戶${userId} 共${items.length}種商品 ${totalItems}件`)
    
    return {
      userId,
      items,
      totalItems,
      lastUpdated: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ 取得購物車失敗:', error)
    throw error
  }
}

/**
 * 清空用戶購物車
 * @param userId 用戶ID
 */
export async function clearCart(userId: string): Promise<void> {
  try {
    const redis = getRedis()
    const cartKey = getCartKey(userId)
    
    const deleted = await redis.del(cartKey)
    
    if (deleted > 0) {
      console.log(`🧹 清空購物車: 用戶${userId}`)
    } else {
      console.log(`ℹ️ 購物車已為空: 用戶${userId}`)
    }
    
  } catch (error) {
    console.error('❌ 清空購物車失敗:', error)
    throw error
  }
}

/**
 * 取得購物車商品數量
 * @param userId 用戶ID
 * @param productId 商品ID
 * @returns 數量，不存在則返回0
 */
export async function getCartItemQuantity(
  userId: string, 
  productId: string
): Promise<number> {
  try {
    const redis = getRedis()
    const cartKey = getCartKey(userId)
    
    const quantity = await redis.hget(cartKey, productId)
    return quantity ? parseInt(quantity, 10) : 0
    
  } catch (error) {
    console.error('❌ 取得購物車商品數量失敗:', error)
    return 0
  }
}

/**
 * 取得購物車商品總數（用於顯示badge）
 * @param userId 用戶ID
 * @returns 總數量
 */
export async function getCartTotalItems(userId: string): Promise<number> {
  try {
    const cart = await getCart(userId)
    return cart.totalItems
  } catch (error) {
    console.error('❌ 取得購物車總數失敗:', error)
    return 0
  }
}