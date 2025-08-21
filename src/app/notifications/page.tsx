'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  isRead: boolean
  createdAt: string
  data?: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // 載入通知
  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/notifications?limit=50${filter === 'unread' ? '&unreadOnly=true' : ''}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('載入通知失敗:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  // 標記通知為已讀
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isRead: true }
              : n
          )
        )
      }
    } catch (error) {
      console.error('標記已讀失敗:', error)
    }
  }

  // 標記所有通知為已讀
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        )
      }
    } catch (error) {
      console.error('標記全部已讀失敗:', error)
    }
  }

  // 刪除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        )
      }
    } catch (error) {
      console.error('刪除通知失敗:', error)
    }
  }

  // 格式化時間
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '剛剛'
    if (diffMins < 60) return `${diffMins}分鐘前`
    if (diffHours < 24) return `${diffHours}小時前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 獲取優先級顏色和圖標
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT': return { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: '🚨' }
      case 'HIGH': return { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: '⚠️' }
      case 'NORMAL': return { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: 'ℹ️' }
      case 'LOW': return { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: '💡' }
      default: return { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: '🔔' }
    }
  }

  // 獲取通知類型圖標
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGED':
      case 'ORDER_SHIPPED':
      case 'ORDER_DELIVERED':
        return '📦'
      case 'NEW_MESSAGE':
        return '💬'
      case 'LOW_STOCK_WARNING':
      case 'OUT_OF_STOCK':
        return '📉'
      case 'STOCK_RESTOCK':
        return '📈'
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢'
      case 'ACCOUNT_SECURITY':
        return '🔒'
      default:
        return '🔔'
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [filter, loadNotifications])

  // 如果未登入，重定向到首頁
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">通知</h1>
            <p className="text-sm text-gray-600 mt-1">
              管理您的所有通知訊息
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 篩選器 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  filter === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  filter === 'unread' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                未讀
              </button>
            </div>

            {/* 全部標為已讀按鈕 */}
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                全部標為已讀
              </button>
            )}
          </div>
        </div>

        {/* 通知列表 */}
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">載入中...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-gray-500 text-lg">
                {filter === 'unread' ? '沒有未讀通知' : '沒有通知'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {filter === 'unread' ? '所有通知都已經閱讀了' : '當有新活動時，您會在這裡看到通知'}
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const priorityStyle = getPriorityStyle(notification.priority)
              return (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 圖標區域 */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${priorityStyle.bg} border flex items-center justify-center`}>
                      <span className="text-lg">
                        {getTypeIcon(notification.type)}
                      </span>
                    </div>

                    {/* 內容區域 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium truncate ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${priorityStyle.bg} ${priorityStyle.color} border`}>
                              {notification.priority === 'URGENT' && '緊急'}
                              {notification.priority === 'HIGH' && '重要'}
                              {notification.priority === 'NORMAL' && '一般'}
                              {notification.priority === 'LOW' && '低'}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${
                            !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                            >
                              標為已讀
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                          >
                            刪除
                          </button>
                        </div>
                      </div>

                      {/* 未讀指示器 */}
                      {!notification.isRead && (
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}