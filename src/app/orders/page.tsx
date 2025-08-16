'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Order, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/app/types/order'

export default function UserOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // 權限檢查 - 必須登入
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/')
      return
    }
  }, [session, status, router])

  // 載入使用者訂單
  useEffect(() => {
    if (session && session.user) {
      loadOrders()
    }
  }, [session])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/orders')
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        setError('無法載入訂單資料')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      setError('載入訂單時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PAID: 'bg-blue-100 text-blue-800 border-blue-200',
      CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
      PROCESSING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
      DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      PAID: '💰',
      CONFIRMED: '✅',
      PROCESSING: '⏳',
      SHIPPED: '🚚',
      DELIVERED: '📦',
      CANCELLED: '❌'
    }
    return icons[status as keyof typeof icons] || '📋'
  }

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入中...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-4 py-2 rounded transition"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">我的訂單</h1>
        <p className="text-gray-600">查看您的訂單狀態和詳細資訊</p>
      </div>

      {/* 載入狀態 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入訂單中...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* 訂單標題 */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      訂單 #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      下單時間：{formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                      <span className="mr-1">{getStatusIcon(order.status)}</span>
                      {ORDER_STATUS_LABELS[order.status]}
                    </div>
                    <p className="text-lg font-bold text-[#d96c6c] mt-1">
                      NT$ {order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 訂單商品 */}
              <div className="px-6 py-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">訂單商品</h4>
                <div className="space-y-3">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-md border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64?text=商品圖片'
                        }}
                      />
                      <div className="flex-grow">
                        <h5 className="font-medium text-gray-800">{item.productName}</h5>
                        <p className="text-sm text-gray-600">
                          單價：NT$ {item.unitPrice.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          NT$ {item.subtotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 訂單詳情 */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">聯絡電話：</span>
                      {order.customerPhone}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">付款狀態：</span>
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        order.paymentStatus === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">商品數量：</span>
                      {order.orderItems.length} 項
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">最後更新：</span>
                      {formatDate(order.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* 客戶備註 */}
                {order.customerNote && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">備註：</span>
                      <span className="text-gray-600">{order.customerNote}</span>
                    </p>
                  </div>
                )}

                {/* 展開/收起詳情按鈕 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    className="text-[#d96c6c] hover:text-[#c55b5b] text-sm font-medium flex items-center"
                  >
                    {selectedOrder?.id === order.id ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        收起詳情
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        查看詳情
                      </>
                    )}
                  </button>
                </div>

                {/* 展開的詳細資訊 */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">訂單 ID：</span>
                          {order.id.slice(0, 8)}...
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">客戶姓名：</span>
                          {order.customerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">電子郵箱：</span>
                          {order.customerEmail}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">訂單狀態：</span>
                          {ORDER_STATUS_LABELS[order.status]}
                        </p>
                      </div>
                    </div>

                    {/* 狀態進度條 */}
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2">訂單進度</p>
                      <div className="flex items-center space-x-2">
                        {['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status, index) => {
                          const isCompleted = ['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].indexOf(order.status) >= index
                          const isCurrent = order.status === status
                          
                          return (
                            <div key={status} className="flex items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                isCompleted 
                                  ? isCurrent 
                                    ? 'bg-[#d96c6c] text-white' 
                                    : 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {isCompleted && !isCurrent ? '✓' : index + 1}
                              </div>
                              {index < 4 && (
                                <div className={`w-8 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>已付款</span>
                        <span>已確認</span>
                        <span>採購中</span>
                        <span>已出貨</span>
                        <span>已送達</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 空狀態 */
        <div className="text-center py-16">
          <div className="mb-4">
            <svg
              className="w-20 h-20 text-gray-300 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">目前沒有訂單</h3>
          <p className="text-gray-500 mb-6">
            瀏覽我們的商品，找到您喜歡的商品後，私訊歪歪開始您的第一筆訂單！
          </p>
          <button
            onClick={() => router.push('/products')}
            className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-6 py-3 rounded-lg transition"
          >
            瀏覽商品
          </button>
        </div>
      )}

      {/* 聯絡資訊 */}
      {orders.length > 0 && (
        <div className="mt-12 text-center py-8 border-t border-gray-200">
          <p className="text-gray-600 mb-2">對訂單有疑問？</p>
          <p className="text-sm text-gray-500">
            歡迎私訊歪歪，我們會盡快為您處理！
          </p>
        </div>
      )}
    </div>
  )
}