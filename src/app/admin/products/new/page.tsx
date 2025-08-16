'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MultiImageUpload from '@/app/components/MultiImageUpload'

interface UploadedImage {
  url: string
  alt?: string
  sortOrder?: number
}

interface CreateProductRequest {
  name: string
  description: string
  price: number
  imageUrl: string
  images: UploadedImage[]
  category: string
  stock: number
  isActive: boolean
}

export default function NewProductPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    images: [],
    category: '',
    stock: 0,
    isActive: true
  })

  // 權限檢查
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  }

  if (!session || session.user?.role !== 'ADMIN') {
    router.push('/')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.description || !formData.category) {
      alert('請填寫所有必填欄位')
      return
    }

    if (formData.price <= 0) {
      alert('價格必須大於 0')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      alert('商品已成功建立！')
      router.push('/admin/products')
    } catch (error) {
      console.error('Error creating product:', error)
      alert(`建立商品失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/products')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">新增商品</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="輸入商品名稱..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品分類 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">請選擇分類</option>
                    <option value="3C數碼">3C數碼</option>
                    <option value="服裝配件">服裝配件</option>
                    <option value="美妝保養">美妝保養</option>
                    <option value="生活用品">生活用品</option>
                    <option value="食品飲料">食品飲料</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    價格（元） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    庫存數量
                  </label>
                  <input
                    type="number"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* 商品描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入商品詳細描述..."
                  required
                />
              </div>

              {/* 商品圖片 */}
              <div>
                <MultiImageUpload
                  images={formData.images}
                  onChange={(images) => {
                    setFormData({ 
                      ...formData, 
                      images,
                      // 設定第一張圖片為主圖片URL（向下相容）
                      imageUrl: images.length > 0 ? images[0].url : ''
                    })
                  }}
                  maxImages={10}
                  maxFileSize={5}
                />
              </div>

              {/* 商品狀態 */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    立即啟用商品（取消勾選將建立為停用狀態）
                  </span>
                </label>
              </div>
            </div>

            {/* 按鈕區域 */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? '建立中...' : '建立商品'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}