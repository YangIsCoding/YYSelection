'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Order, ORDER_STATUS_LABELS } from '@/app/types/order'

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 權限檢查
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  // 載入訂單資料
  useEffect(() => {
    if (session && session.user?.role === 'ADMIN') {
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        loadOrders() // 重新載入訂單列表
      } else {
        alert('更新訂單狀態失敗')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('更新訂單時發生錯誤')
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('zh-TW')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PAID: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (status === 'loading') {
    return <div className="p-8">載入中...</div>
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
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
    <div className="max-w-6xl mx-auto p-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">訂單管理</h1>
          <p className="text-gray-600">管理所有客戶訂單</p>
        </div>
        <Link
          href="/admin/orders/new"
          className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-4 py-2 rounded-lg"
        >
          + 新增訂單
        </Link>
      </div>

      {/* 統計資訊 */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">總訂單數</h3>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">待處理</h3>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter(order => order.status === 'PAID').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">處理中</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(order => ['CONFIRMED', 'PROCESSING'].includes(order.status)).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">已完成</h3>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(order => order.status === 'DELIVERED').length}
            </p>
          </div>
        </div>
      )}

      {/* 訂單列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入訂單資料中...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客戶
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品數量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
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
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {order.user?.image && (
                          <img
                            className="h-8 w-8 rounded-full mr-3"
                            src={order.user.image}
                            alt={order.customerName}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerPhone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.orderItems.length} 項商品
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      NT$ {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="PAID">已付款</option>
                          <option value="CONFIRMED">已確認</option>
                          <option value="PROCESSING">採購中</option>
                          <option value="SHIPPED">已出貨</option>
                          <option value="DELIVERED">已送達</option>
                          <option value="CANCELLED">已取消</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">目前沒有訂單</h3>
          <p className="text-gray-500 mb-4">建立第一筆訂單來開始管理您的代購業務</p>
          <Link
            href="/admin/orders/new"
            className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-4 py-2 rounded-lg"
          >
            建立第一筆訂單
          </Link>
        </div>
      )}
    </div>
  )
}