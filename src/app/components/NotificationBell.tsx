'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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

export default function NotificationBell() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 載入通知
  const loadNotifications = async () => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('載入通知失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
        setUnreadCount(prev => Math.max(0, prev - 1))
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
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('標記全部已讀失敗:', error)
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
    return date.toLocaleDateString('zh-TW')
  }

  // 獲取優先級顏色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600'
      case 'HIGH': return 'text-orange-600'
      case 'NORMAL': return 'text-blue-600'
      case 'LOW': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  // 獲取通知圖標
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGED':
      case 'ORDER_SHIPPED':
      case 'ORDER_DELIVERED':
        return '📦'
      case 'NEW_MESSAGE':
        return '💬'
      case 'LOW_STOCK_WARNING':
      case 'OUT_OF_STOCK':
        return '⚠️'
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
    if (session?.user?.id) {
      loadNotifications()
      
      // 每30秒更新一次通知
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id])

  // 如果用戶未登入，不顯示通知
  if (!session?.user?.id) {
    return null
  }

  return (
    <div className="relative">
      {/* 通知鈴鐺按鈕 */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* 未讀數量徽章 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉選單 */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          {/* 標題欄 */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium text-gray-900">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                全部標為已讀
              </button>
            )}
          </div>

          {/* 通知列表 */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                載入中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                沒有通知
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <span className={`text-xs ml-2 ${getPriorityColor(notification.priority)}`}>
                          {notification.priority === 'URGENT' && '🔴'}
                          {notification.priority === 'HIGH' && '🟠'}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 line-clamp-2 ${
                        !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 查看全部按鈕 */}
          {notifications.length > 0 && (
            <div className="p-3 border-t text-center">
              <button
                onClick={() => {
                  setIsDropdownOpen(false)
                  router.push('/notifications')
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                查看所有通知
              </button>
            </div>
          )}
        </div>
      )}

      {/* 點擊外部關閉下拉選單 */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}