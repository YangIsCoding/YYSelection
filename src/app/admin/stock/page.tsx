'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface LowStockProduct {
  id: string
  name: string
  stock: number
  minStock: number
  category: string
  imageUrl: string | null
}

interface StockAdjustment {
  productId: string
  quantity: number
  reason: string
  changeType: string
}

export default function StockManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [showAdjustModal, setShowAdjustModal] = useState<LowStockProduct | null>(null)
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    productId: '',
    quantity: 0,
    reason: '',
    changeType: 'ADMIN_ADJUST'
  })

  // 權限檢查
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  // 載入低庫存商品
  const fetchLowStockProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stock')
      if (!response.ok) throw new Error('Failed to fetch low stock products')

      const data = await response.json()
      setLowStockProducts(data.products)
    } catch (error) {
      console.error('Error fetching low stock products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchLowStockProducts()
    }
  }, [session])

  // 調整庫存
  const handleStockAdjustment = async () => {
    if (!adjustment.quantity || !adjustment.reason || !showAdjustModal) {
      alert('請填寫調整數量和原因')
      return
    }

    try {
      setAdjusting(showAdjustModal.id)
      const response = await fetch(`/api/admin/stock/${showAdjustModal.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: adjustment.quantity,
          reason: adjustment.reason,
          changeType: adjustment.changeType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to adjust stock')
      }

      alert('庫存調整成功！')
      setShowAdjustModal(null)
      setAdjustment({
        productId: '',
        quantity: 0,
        reason: '',
        changeType: 'ADMIN_ADJUST'
      })
      
      // 重新載入資料
      fetchLowStockProducts()
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert(`庫存調整失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setAdjusting(null)
    }
  }

  // 開啟調整模態框
  const openAdjustModal = (product: LowStockProduct) => {
    setShowAdjustModal(product)
    setAdjustment({
      productId: product.id,
      quantity: 0,
      reason: '',
      changeType: 'RESTOCK'
    })
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">庫存管理</h1>
            <p className="text-gray-600 mt-2">管理商品庫存並監控低庫存商品</p>
          </div>
          <Link
            href="/admin/products"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            返回商品管理
          </Link>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-semibold">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">低庫存商品</p>
                <p className="text-2xl font-semibold text-gray-900">{lowStockProducts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">📦</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">需要補貨</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {lowStockProducts.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">🔄</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">急需關注</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {lowStockProducts.filter(p => p.stock < p.minStock / 2).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 低庫存商品列表 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">低庫存商品</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">載入中...</div>
          ) : lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">🎉</div>
              <p>太好了！目前沒有低庫存的商品</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      當前庫存
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最低庫存
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="h-16 w-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-image.jpg'
                                }}
                              />
                            ) : (
                              <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-xs">無圖片</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-semibold ${
                          product.stock === 0 
                            ? 'text-red-600' 
                            : product.stock < product.minStock / 2
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.minStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock === 0
                            ? 'bg-red-100 text-red-800'
                            : product.stock < product.minStock / 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.stock === 0 
                            ? '缺貨' 
                            : product.stock < product.minStock / 2
                            ? '急需補貨'
                            : '庫存偏低'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => openAdjustModal(product)}
                          disabled={adjusting === product.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {adjusting === product.id ? '調整中...' : '調整庫存'}
                        </button>
                        <Link
                          href={`/admin/stock/${product.id}`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          查看歷史
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 調整庫存模態框 */}
        {showAdjustModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">調整庫存</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">商品：{showAdjustModal.name}</p>
                <p className="text-sm text-gray-600">當前庫存：{showAdjustModal.stock}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    調整類型
                  </label>
                  <select
                    value={adjustment.changeType}
                    onChange={(e) => setAdjustment({ ...adjustment, changeType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RESTOCK">補貨</option>
                    <option value="ADMIN_ADJUST">管理員調整</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    調整數量
                  </label>
                  <input
                    type="number"
                    value={adjustment.quantity || ''}
                    onChange={(e) => setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入調整數量（正數為增加，負數為減少）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    調整原因
                  </label>
                  <textarea
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入調整原因..."
                  />
                </div>

                {adjustment.quantity !== 0 && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      調整後庫存：
                      <span className={`font-semibold ml-1 ${
                        showAdjustModal.stock + adjustment.quantity < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {showAdjustModal.stock + adjustment.quantity}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAdjustModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={adjusting !== null}
                >
                  取消
                </button>
                <button
                  onClick={handleStockAdjustment}
                  disabled={adjusting !== null || !adjustment.quantity || !adjustment.reason}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adjusting !== null ? '調整中...' : '確認調整'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}