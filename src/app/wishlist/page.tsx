'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WishlistItem {
  id: string
  productId: string
  addedAt: string
  product: {
    id: string
    name: string
    price: number
    description: string
    imageUrl: string | null
    category: string
    isActive: boolean
    stock: number
  }
}

export default function WishlistPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  // 如果未登入，重定向到首頁
  useEffect(() => {
    if (!session) {
      router.push('/')
      return
    }
  }, [session, router])

  // 獲取願望清單
  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        setWishlistItems(data)
      } else {
        console.error('Failed to fetch wishlist')
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchWishlist()
    }
  }, [session])

  // 從願望清單移除商品
  const removeFromWishlist = async (productId: string) => {
    try {
      setRemoving(productId)
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setWishlistItems(items => items.filter(item => item.productId !== productId))
        
        // 顯示成功消息
        alert('已從願望清單中移除')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      alert('Error removing item from wishlist')
    } finally {
      setRemoving(null)
    }
  }

  // 詢問所有商品
  const handleContactAboutItems = async () => {
    if (wishlistItems.length === 0) return

    try {
      const productNames = wishlistItems.map(item => item.product.name).join('、')
      const message = `您好！我想詢問以下商品的詳細資訊：\n\n${productNames}\n\n請告訴我更多相關資訊，謝謝！`

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialMessage: message
        })
      })

      if (response.ok) {
        router.push('/chat')
      } else {
        alert('無法開啟聊天室，請稍後再試')
      }
    } catch (error) {
      console.error('Error opening chat:', error)
      alert('開啟聊天室時發生錯誤')
    }
  }

  // 格式化價格
  const formatPrice = (price: number) => {
    return `NT$ ${(price / 100).toLocaleString()}`
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            願望清單
          </h1>
          
          {wishlistItems.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <p className="text-gray-600">
                {wishlistItems.length} 個商品
              </p>
              <button
                onClick={handleContactAboutItems}
                className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
              >
                詢問所有商品
              </button>
            </div>
          )}
        </div>

        {/* 願望清單內容 */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-gray-400">💝</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              您的願望清單為空
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              瀏覽商品並將心儀的商品加入願望清單
            </p>
            <Link
              href="/products"
              className="inline-flex items-center bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              瀏覽商品
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <Link href={`/products/${item.productId}`}>
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-rose-500 transition-colors line-clamp-2">
                      {item.product.name}
                    </h3>
                  </Link>
                  
                  <p className="text-rose-500 font-bold text-lg mb-3">
                    {formatPrice(item.product.price)}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {item.product.category}
                    </span>
                    
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      disabled={removing === item.productId}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                      title="從願望清單中移除"
                    >
                      {removing === item.productId ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {!item.product.isActive && (
                    <div className="mt-2">
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        目前無庫存
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}