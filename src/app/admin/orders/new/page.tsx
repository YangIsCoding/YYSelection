'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Product } from '@/app/types/product'

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface OrderItem {
  productId: string
  product: Product
  quantity: number
}

export default function NewOrderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // 表單狀態
  const [selectedUserId, setSelectedUserId] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  // 權限檢查
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  // 載入初始資料
  useEffect(() => {
    if (session && session.user?.role === 'ADMIN') {
      Promise.all([loadUsers(), loadProducts()])
        .then(() => setLoading(false))
        .catch(() => setLoading(false))
    }
  }, [session])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        const productsWithDisplayPrice = data.map((product: any) => ({
          ...product,
          price: product.price / 100
        }))
        setProducts(productsWithDisplayPrice)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const addOrderItem = () => {
    if (products.length > 0) {
      const newItem: OrderItem = {
        productId: products[0].id,
        product: products[0],
        quantity: 1
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const updateOrderItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updatedItems = [...orderItems]
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        updatedItems[index] = {
          ...updatedItems[index],
          productId: value as string,
          product
        }
      }
    } else if (field === 'quantity') {
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: Math.max(1, Number(value))
      }
    }
    
    setOrderItems(updatedItems)
  }

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUserId || !customerPhone || orderItems.length === 0) {
      alert('請填寫所有必填欄位並至少添加一個商品')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          customerPhone,
          shippingAddress: shippingAddress || undefined,
          customerNote: customerNote || undefined,
          adminNote: adminNote || undefined,
          orderItems: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }),
      })

      if (response.ok) {
        const newOrder = await response.json()
        alert(`訂單建立成功！訂單編號：${newOrder.orderNumber}`)
        router.push('/admin/orders')
      } else {
        const error = await response.json()
        alert(`建立訂單失敗：${error.error}`)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('建立訂單時發生錯誤')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入中...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">建立新訂單</h1>
        <p className="text-gray-600">客戶付款後，在此建立對應的訂單記錄</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 客戶資訊 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">客戶資訊</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇客戶 *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
                required
              >
                <option value="">請選擇客戶</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                聯絡電話 *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
                placeholder="0912345678"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              收貨地址
            </label>
            <input
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
              placeholder="請輸入詳細收貨地址"
            />
          </div>
        </div>

        {/* 商品資訊 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">訂單商品</h2>
            <button
              type="button"
              onClick={addOrderItem}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              + 添加商品
            </button>
          </div>

          {orderItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>尚未添加任何商品</p>
              <p className="text-sm">點擊上方按鈕開始添加商品</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        商品
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#d96c6c]"
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - NT$ {product.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        數量
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#d96c6c]"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">小計</p>
                        <p className="font-semibold text-[#d96c6c]">
                          NT$ {(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="ml-4 text-red-500 hover:text-red-700"
                        title="移除商品"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 總計 */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-700">
                      訂單總計：<span className="text-[#d96c6c]">NT$ {calculateTotal().toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 備註資訊 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">備註資訊</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                客戶需求備註
              </label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
                placeholder="客戶的特殊需求或備註..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理員內部備註
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
                placeholder="內部處理備註，客戶看不到..."
              />
            </div>
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || orderItems.length === 0}
            className="px-6 py-3 bg-[#d96c6c] text-white rounded-lg hover:bg-[#c55b5b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '建立中...' : '建立訂單'}
          </button>
        </div>
      </form>
    </div>
  )
}