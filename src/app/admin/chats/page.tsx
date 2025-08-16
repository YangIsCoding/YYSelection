'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Chat, Message, MessageType, ChatListResponse } from '@/app/types/chat'

export default function AdminChatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 權限檢查
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  // 載入聊天列表
  useEffect(() => {
    if (session && session.user?.role === 'ADMIN') {
      loadChats()
      startPolling()
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [session])

  // 自動滾動到最底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/chats')
      
      if (response.ok) {
        const data: ChatListResponse = await response.json()
        setChats(data.chats)
        setTotalUnreadCount(data.totalUnreadCount)
      } else {
        setError('無法載入聊天列表')
      }
    } catch (error) {
      console.error('Error loading chats:', error)
      setError('載入聊天列表時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const loadChatDetails = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`)
      if (response.ok) {
        const chat = await response.json()
        setSelectedChat(chat)
        setMessages(chat.messages || [])
        
        // 重新載入聊天列表以更新未讀數量
        loadChats()
      }
    } catch (error) {
      console.error('Error loading chat details:', error)
    }
  }

  const startPolling = () => {
    // 每5秒檢查新訊息和聊天列表更新
    pollIntervalRef.current = setInterval(() => {
      loadChats()
      if (selectedChat?.id) {
        loadChatDetails(selectedChat.id)
      }
    }, 5000)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedChat?.id || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: MessageType.TEXT
        })
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
        
        // 更新聊天列表
        loadChats()
      } else {
        alert('發送訊息失敗')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('發送訊息時發生錯誤')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '剛剛'
    if (diffInMinutes < 60) return `${diffInMinutes}分鐘前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小時前`
    
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入聊天管理中...</p>
        </div>
      </div>
    )
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
            onClick={loadChats}
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          聊天管理
          {totalUnreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {totalUnreadCount}
            </span>
          )}
        </h1>
        <p className="text-gray-600">管理與客戶的對話</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* 聊天列表 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">客戶對話列表</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {chats.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>目前沒有客戶對話</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => loadChatDetails(chat.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                      selectedChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-[#d96c6c]' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {chat.user.image ? (
                        <img
                          src={chat.user.image}
                          alt={chat.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                          {chat.user.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {chat.user.name}
                          </p>
                          {(chat.unreadCount || 0) > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.user.email}
                        </p>
                        {chat.messages && chat.messages.length > 0 && (
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {chat.messages[chat.messages.length - 1].content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(chat.lastMessageAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 聊天內容 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          {selectedChat ? (
            <>
              {/* 聊天標題 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {selectedChat.user.image ? (
                    <img
                      src={selectedChat.user.image}
                      alt={selectedChat.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                      {selectedChat.user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedChat.user.name}</h3>
                    <p className="text-sm text-gray-500">{selectedChat.user.email}</p>
                  </div>
                </div>
              </div>

              {/* 訊息區域 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>尚未開始對話</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isAdmin = message.sender.role === 'ADMIN'
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${isAdmin ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isAdmin
                                ? 'bg-[#d96c6c] text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="text-sm break-words">{message.content}</p>
                          </div>
                          <div className={`mt-1 text-xs text-gray-500 ${isAdmin ? 'text-right' : 'text-left'}`}>
                            <span>{message.sender.name}</span>
                            <span className="mx-1">•</span>
                            <span>{formatTime(message.createdAt)}</span>
                            {message.isRead && isAdmin && (
                              <span className="ml-1 text-green-500">✓</span>
                            )}
                          </div>
                        </div>
                        {!isAdmin && (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium ml-2 flex-shrink-0 order-1">
                            {message.sender.name.charAt(0)}
                          </div>
                        )}
                        {isAdmin && (
                          <div className="w-8 h-8 bg-[#d96c6c] rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0 order-1">
                            歪
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 輸入區域 */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="回覆客戶..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#d96c6c] focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-[#d96c6c] hover:bg-[#c55b5b] text-white px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? '發送中...' : '發送'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>請選擇一個對話開始回覆客戶</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}