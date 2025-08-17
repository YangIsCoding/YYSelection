'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Product } from '@/app/types/product'

export default function ProductsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')

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

  const handleChatWithYaYa = async (product: Product) => {
    if (!session) {
      if (confirm('請先登入才能私訊歪歪，現在要登入嗎？')) {
        return
      }
      return
    }

    try {
      const initialMessage = `您好！我對「${product.name}」很感興趣，想了解更多詳情。`

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

  // 獲取所有分類
  const categories = [...new Set(products.map(p => p.category))]

  // 過濾和排序商品
  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === '' || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 mt-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入商品中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 mt-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadProducts}
            className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-4 py-2 rounded transition"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 mt-6">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">所有商品</h1>
        <p className="text-gray-600">探索歪歪為您精選的優質商品</p>
      </div>

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜尋框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜尋商品
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="商品名稱或描述..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
            />
          </div>

          {/* 分類篩選 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品分類
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
            >
              <option value="">所有分類</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 排序方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排序方式
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
            >
              <option value="newest">最新上架</option>
              <option value="price-low">價格：低到高</option>
              <option value="price-high">價格：高到低</option>
              <option value="name">名稱：A到Z</option>
            </select>
          </div>
        </div>

        {/* 結果統計 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            顯示 {filteredAndSortedProducts.length} 個商品
            {searchTerm && ` (搜尋："${searchTerm}")`}
            {selectedCategory && ` (分類：${selectedCategory})`}
          </p>
        </div>
      </div>

      {/* 商品網格 */}
      {filteredAndSortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => (
            <div key={product.id} className="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow group">
              <Link href={`/products/${product.id}`} className="block">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img
                    src={product.images && product.images.length > 0 
                      ? product.images[0].imageUrl 
                      : product.imageUrl || '/placeholder-product.jpg'
                    }
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400"><span>無法載入圖片</span></div>'
                      }
                    }}
                  />
                </div>
              </Link>
              <div className="p-4">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mb-2 inline-block">
                  {product.category}
                </span>
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-[#d96c6c] transition cursor-pointer">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-[#d96c6c] font-bold text-lg">
                    NT$ {product.price.toLocaleString()}
                  </p>
                  <button 
                    onClick={() => handleChatWithYaYa(product)}
                    className="text-white bg-[#d96c6c] hover:bg-[#c55b5b] px-3 py-1 rounded text-sm transition"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">沒有找到符合條件的商品</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory 
              ? '請嘗試調整搜尋條件或篩選器' 
              : '目前沒有商品可以顯示'
            }
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
              }}
              className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-4 py-2 rounded-lg transition"
            >
              清除篩選條件
            </button>
          )}
        </div>
      )}
    </div>
  )
}