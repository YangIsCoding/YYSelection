'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Product } from '@/app/types/product'

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/products')
      
      if (response.ok) {
        const data = await response.json()
        // 轉換價格單位（分 -> 元）
        const productsWithDisplayPrice = data.map((product: any) => ({
          ...product,
          price: product.price / 100
        }))
        setProducts(productsWithDisplayPrice)
      } else {
        setError('無法載入商品資料')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setError('載入商品時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const handleChatWithYaYa = async (product?: Product) => {
    if (!session) {
      // 如果未登入，提示登入
      if (confirm('請先登入才能私訊歪歪，現在要登入嗎？')) {
        // 這裡可以觸發登入流程，或者跳轉到登入頁面
        return
      }
      return
    }

    try {
      // 建立或開啟聊天室
      let initialMessage = ''
      if (product) {
        initialMessage = `您好！我對「${product.name}」很感興趣，想了解更多詳情。`
      }

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialMessage: initialMessage || undefined
        })
      })

      if (response.ok) {
        // 跳轉到聊天頁面
        router.push('/chat')
      } else {
        alert('無法開啟聊天室，請稍後再試')
      }
    } catch (error) {
      console.error('Error opening chat:', error)
      alert('開啟聊天室時發生錯誤')
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">精選商品</h2>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入商品中...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">精選商品</h2>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadProducts}
            className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-4 py-2 rounded transition"
          >
            重新載入
          </button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">精選商品</h2>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow group">
              <Link href={`/products/${product.id}`} className="block">
                <div className="aspect-w-4 aspect-h-3 bg-gray-100 relative overflow-hidden">
                  <img
                    src={product.images && product.images.length > 0 
                      ? product.images[0].imageUrl 
                      : product.imageUrl || 'https://via.placeholder.com/300x200?text=商品圖片'
                    }
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=商品圖片'
                    }}
                  />
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-2 hover:text-[#d96c6c] transition cursor-pointer">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>
                <p className="text-[#d96c6c] font-bold text-lg mb-3">
                  NT$ {product.price.toLocaleString()}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {product.category}
                  </span>
                  <button 
                    onClick={() => handleChatWithYaYa(product)}
                    className="text-white bg-[#d96c6c] hover:bg-[#c55b5b] px-4 py-2 rounded text-sm transition"
                  >
                    私訊歪歪
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">目前沒有商品</h3>
          <p className="text-gray-500">
            歪歪正在努力尋找更多精選商品，請稍後再來看看！
          </p>
        </div>
      )}
    </section>
  )
}
