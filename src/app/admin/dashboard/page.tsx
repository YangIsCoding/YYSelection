'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import StatsCard from '@/components/dashboard/StatsCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import OrderStatusChart from '@/components/dashboard/OrderStatusChart'
import TopProductsList from '@/components/dashboard/TopProductsList'
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel'

interface DashboardStats {
  orders: {
    total: number
    today: number
    week: number
    month: number
    byStatus: {
      pending: number
      processing: number
      shipped: number
      delivered: number
      cancelled: number
    }
  }
  revenue: {
    today: number
    week: number
    month: number
    history: Array<{ date: string; revenue: number }>
  }
  products: {
    total: number
    active: number
    lowStock: number
    outOfStock: number
    topSelling: Array<{
      id: string
      name: string
      imageUrl: string | null
      price: number
      category: string
      totalSold: number
      orderCount: number
    }>
  }
  users: {
    total: number
    today: number
    week: number
    month: number
  }
  chats: {
    total: number
    active: number
    unreadMessages: number
  }
}

interface QuickActions {
  pendingOrders: {
    count: number
    orders: Array<{
      id: string
      orderNumber: string
      totalAmount: number
      status: string
      createdAt: string
      user: {
        id: string
        name: string
        email: string
        image: string | null
      }
      _count: {
        orderItems: number
      }
      orderItems: Array<{
        id: string
        productName: string
        unitPrice: number
        quantity: number
        subtotal: number
        product: {
          id: string
          name: string
          imageUrl: string | null
        }
      }>
    }>
  }
  unreadChats: {
    count: number
    chats: Array<{
      id: string
      userId: string
      user: {
        id: string
        name: string
        email: string
        image: string | null
      }
      lastMessageAt: string
      isActive: boolean
      latestMessage: {
        id: string
        content: string
        createdAt: string
        messageType: string
      } | null
      unreadCount: number
    }>
  }
  lowStockProducts: {
    count: number
    products: Array<{
      id: string
      name: string
      stock: number
      minStock: number
      imageUrl: string | null
      category: string
    }>
  }
  systemStatus: {
    totalPendingActions: number
    lastUpdated: string
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [quickActions, setQuickActions] = useState<QuickActions | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // 權限檢查
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  // 載入儀表板數據
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsResponse, quickActionsResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/quick-actions')
      ])

      if (!statsResponse.ok || !quickActionsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [statsData, quickActionsData] = await Promise.all([
        statsResponse.json(),
        quickActionsResponse.json()
      ])

      setStats(statsData)
      setQuickActions(quickActionsData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchDashboardData()
    }
  }, [session])

  // 自動刷新數據
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user?.role === 'ADMIN') {
        fetchDashboardData()
      }
    }, 5 * 60 * 1000) // 每5分鐘刷新一次

    return () => clearInterval(interval)
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入儀表板資料中...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  if (!stats || !quickActions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">載入失敗，請重新整理頁面</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題與刷新 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理員儀表板</h1>
            <p className="text-gray-600 mt-2">
              歡迎回來，{session.user.name}！最後更新：{lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '載入中...' : '刷新數據'}
          </button>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="今日營收"
            value={`NT$ ${stats.revenue.today.toLocaleString()}`}
            icon="💰"
            color="green"
          />
          <StatsCard
            title="待處理訂單"
            value={quickActions.systemStatus.totalPendingActions}
            icon="📋"
            color="yellow"
          />
          <StatsCard
            title="未讀訊息"
            value={stats.chats.unreadMessages}
            icon="💬"
            color="blue"
          />
          <StatsCard
            title="低庫存商品"
            value={stats.products.lowStock}
            icon="⚠️"
            color="red"
          />
        </div>

        {/* 詳細統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="總訂單數"
            value={stats.orders.total}
            icon="📦"
            color="indigo"
          />
          <StatsCard
            title="總用戶數"
            value={stats.users.total}
            icon="👥"
            color="purple"
          />
          <StatsCard
            title="活躍商品"
            value={stats.products.active}
            icon="🛍️"
            color="blue"
          />
          <StatsCard
            title="本月營收"
            value={`NT$ ${stats.revenue.month.toLocaleString()}`}
            icon="📈"
            color="green"
          />
        </div>

        {/* 圖表與列表區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 營收趨勢圖 */}
          <RevenueChart data={stats.revenue.history} />
          
          {/* 訂單狀態分布圖 */}
          <OrderStatusChart data={stats.orders.byStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 熱銷商品排行榜 */}
          <TopProductsList products={stats.products.topSelling} />
          
          {/* 快速操作面板 */}
          <QuickActionsPanel data={quickActions} />
        </div>
      </div>
    </div>
  )
}