'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Product } from '@/app/types/product'
import ImageGallery from '@/app/components/ImageGallery'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  
  // 解包 params Promise
  const resolvedParams = use(params)
  const productId = resolvedParams.id

  useEffect(() => {
    loadProduct()
    loadRelatedProducts()
  }, [productId])

  const loadProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/products/${productId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else if (response.status === 404) {
        setError('商品不存在')
      } else {
        setError('無法載入商品資料')
      }
    } catch (error) {
      console.error('Error loading product:', error)
      setError('載入商品時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=3')
      if (response.ok) {
        const data = await response.json()
        // 過濾掉當前商品並轉換價格
        const filtered = data
          .filter((p: any) => p.id !== productId)
          .slice(0, 3)
          .map((p: any) => ({
            ...p,
            price: p.price / 100
          }))
        setRelatedProducts(filtered)
      }
    } catch (error) {
      console.error('Error loading related products:', error)
    }
  }

  const handleChatWithYaYa = async () => {
    if (!session) {
      if (confirm('請先登入才能私訊歪歪，現在要登入嗎？')) {
        return
      }
      return
    }

    if (!product) return

    try {
      const initialMessage = `您好！我對「${product.name}」很感興趣，想了解更多詳情。價格是 NT$ ${product.price.toLocaleString()} 嗎？`

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialMessage
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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入商品詳情中...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8l-1 1m0 0l-1 1m1-1v4M6 5l1 1v4" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-600 mb-2">{error}</h2>
          <p className="text-gray-500 mb-6">找不到您要查看的商品</p>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition"
            >
              返回上頁
            </button>
            <Link
              href="/"
              className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-6 py-2 rounded-lg transition inline-block"
            >
              回到首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 麵包屑導航 */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2 text-gray-500">
          <li>
            <Link href="/" className="hover:text-[#d96c6c] transition">
              首頁
            </Link>
          </li>
          <li>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href="/products" className="hover:text-[#d96c6c] transition">
              所有商品
            </Link>
          </li>
          <li>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="text-gray-800 font-medium">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* 商品圖片 */}
        <div className="space-y-4">
          <ImageGallery 
            images={product.images || []}
            productName={product.name}
            className="w-full"
            fallbackImageUrl={product.imageUrl}
          />
          
          {/* 商品統計 */}
          {product.stats && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">商品統計</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">總訂單數</p>
                  <p className="font-semibold text-gray-800">{product.stats.totalOrders}</p>
                </div>
                <div>
                  <p className="text-gray-500">近30天訂單</p>
                  <p className="font-semibold text-gray-800">{product.stats.recentOrders}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 商品資訊 */}
        <div className="space-y-6">
          {/* 基本資訊 */}
          <div>
            <span className="inline-block bg-[#d96c6c] text-white text-xs px-2 py-1 rounded mb-2">
              {product.category}
            </span>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-[#d96c6c] mb-4">
              NT$ {product.price.toLocaleString()}
            </p>
          </div>

          {/* 商品描述 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">商品描述</h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          </div>

          {/* 商品資訊 */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">商品資訊</h2>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">商品編號</dt>
                <dd className="text-gray-800 font-mono">{product.id.slice(0, 8)}...</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">上架日期</dt>
                <dd className="text-gray-800">{formatDate(product.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">最後更新</dt>
                <dd className="text-gray-800">{formatDate(product.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* 行動按鈕 */}
          <div className="border-t pt-6 space-y-4">
            <button
              onClick={handleChatWithYaYa}
              className="w-full bg-[#d96c6c] hover:bg-[#c55b5b] text-white py-3 px-6 rounded-lg font-medium transition flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>私訊歪歪詢問詳情</span>
            </button>
            
            <div className="text-center text-sm text-gray-500">
              💡 點擊上方按鈕與歪歪討論代購細節、付款方式等問題
            </div>
          </div>
        </div>
      </div>

      {/* 相關商品推薦 */}
      {relatedProducts.length > 0 && (
        <div className="border-t pt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">其他推薦商品</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/products/${relatedProduct.id}`}
                className="group"
              >
                <div className="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img
                      src={relatedProduct.images && relatedProduct.images.length > 0 
                        ? relatedProduct.images[0].imageUrl 
                        : relatedProduct.imageUrl || 'https://via.placeholder.com/300x300?text=商品圖片'
                      }
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=商品圖片'
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-[#d96c6c] transition">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-[#d96c6c] font-bold">
                      NT$ {relatedProduct.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}