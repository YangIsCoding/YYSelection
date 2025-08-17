'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DragDropUpload from '@/components/DragDropUpload'
import BulkUrlUpload from '@/components/BulkUrlUpload'

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BannerForm {
  title: string
  imageUrl: string
  linkUrl: string
  description: string
  sortOrder: number
  isActive: boolean
}

export default function BannersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single')
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState<BannerForm>({
    title: '',
    imageUrl: '',
    linkUrl: '',
    description: '',
    sortOrder: 0,
    isActive: true
  })
  const [bulkUrls, setBulkUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // 權限檢查
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  // 載入廣告橫幅資料
  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/banners')
      if (!response.ok) {
        throw new Error('Failed to fetch banners')
      }
      const data = await response.json()
      setBanners(data)
    } catch (error) {
      console.error('Error fetching banners:', error)
      alert('載入廣告橫幅失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchBanners()
    }
  }, [session])

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBanner 
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners'
      
      const method = editingBanner ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save banner')
      }

      await fetchBanners()
      handleCancelEdit()
      alert(editingBanner ? '廣告橫幅更新成功！' : '廣告橫幅創建成功！')
    } catch (error) {
      console.error('Error saving banner:', error)
      alert(error instanceof Error ? error.message : '儲存失敗')
    }
  }

  // 刪除廣告橫幅
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個廣告橫幅嗎？')) return

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete banner')
      }

      await fetchBanners()
      alert('廣告橫幅刪除成功！')
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('刪除失敗')
    }
  }

  // 開始編輯
  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      description: banner.description || '',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive
    })
    setShowForm(true)
  }

  // 取消編輯
  const handleCancelEdit = () => {
    setShowForm(false)
    setEditingBanner(null)
    setUploadMode('single')
    setFormData({
      title: '',
      imageUrl: '',
      linkUrl: '',
      description: '',
      sortOrder: 0,
      isActive: true
    })
    setBulkUrls([])
  }

  // 處理檔案上傳
  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      // 這裡可以實作檔案上傳到雲端服務的邏輯
      // 暫時使用 FileReader 轉為 base64 作為示例
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData(prev => ({ ...prev, imageUrl: result }))
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('File upload error:', error)
      alert('檔案上傳失敗')
      setUploading(false)
    }
  }

  // 處理批量網址上傳
  const handleBulkUpload = async () => {
    if (bulkUrls.length === 0) {
      alert('請至少輸入一個有效的圖片網址')
      return
    }

    const remainingSlots = 10 - banners.length
    if (bulkUrls.length > remainingSlots) {
      alert(`目前只能新增 ${remainingSlots} 張廣告圖片`)
      return
    }

    setUploading(true)
    try {
      const promises = bulkUrls.map((url, index) => {
        return fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `廣告圖片 ${banners.length + index + 1}`,
            imageUrl: url,
            linkUrl: '',
            description: '',
            sortOrder: banners.length + index,
            isActive: true
          })
        })
      })

      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.length - successful

      await fetchBanners()
      handleCancelEdit()
      
      if (failed === 0) {
        alert(`成功新增 ${successful} 張廣告圖片！`)
      } else {
        alert(`成功新增 ${successful} 張，失敗 ${failed} 張廣告圖片`)
      }
    } catch (error) {
      console.error('Bulk upload error:', error)
      alert('批量上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">廣告橫幅管理</h1>
            <p className="text-gray-600 mt-2">管理首頁輪播廣告圖片（最多 10 張）</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={banners.length >= 10}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {banners.length >= 10 ? '已達上限' : '新增廣告橫幅'}
          </button>
        </div>

        {/* 新增/編輯表單 */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner ? '編輯廣告橫幅' : '新增廣告橫幅'}
              </h2>
              {!editingBanner && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode('single')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      uploadMode === 'single'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    單張上傳
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('bulk')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      uploadMode === 'bulk'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    批量上傳
                  </button>
                </div>
              )}
            </div>

            {/* 批量上傳模式 */}
            {uploadMode === 'bulk' && !editingBanner && (
              <div className="space-y-6">
                <BulkUrlUpload
                  onUrlsUpdate={setBulkUrls}
                  maxUrls={Math.min(10, 10 - banners.length)}
                  className=""
                />
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={bulkUrls.length === 0 || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? '上傳中...' : `批量新增 (${bulkUrls.length} 張)`}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 單張上傳模式 */}
            {uploadMode === 'single' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    標題 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="輸入廣告標題"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序順序
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  圖片上傳 *
                </label>
                
                {/* 拖拽上傳區域 */}
                <DragDropUpload
                  onFileUpload={handleFileUpload}
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                  className="mb-4"
                />
                
                {/* 或者使用網址 */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">或者輸入圖片網址</span>
                  </div>
                </div>
                
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                
                {/* 圖片預覽 */}
                {formData.imageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">圖片預覽：</p>
                    <img
                      src={formData.imageUrl}
                      alt="預覽"
                      className="max-w-xs max-h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  點擊連結（可選）
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述（可選）
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="輸入廣告描述"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  啟用此廣告橫幅
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploading || !formData.imageUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? '處理中...' : (editingBanner ? '更新' : '新增')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
            )}
          </div>
        )}

        {/* 廣告橫幅列表 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              目前廣告橫幅 ({banners.length}/10)
            </h2>
            
            {banners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                尚未新增任何廣告橫幅
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner) => (
                  <div key={banner.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 truncate">{banner.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          banner.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {banner.isActive ? '啟用' : '停用'}
                        </span>
                      </div>
                      {banner.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {banner.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mb-3">
                        排序: {banner.sortOrder} | 建立: {new Date(banner.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="flex-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}