'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Chat, Message, MessageType } from '@/app/types/chat'

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 權限檢查
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/')
      return
    }
  }, [session, status, router])

  // 載入聊天室
  useEffect(() => {
    if (session && session.user) {
      loadChat()
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

  const loadChat = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 先獲取或建立聊天室
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const chatData = await response.json()
        setChat(chatData)
        setMessages(chatData.messages || [])
      } else {
        setError('無法載入聊天室')
      }
    } catch (error) {
      console.error('Error loading chat:', error)
      setError('載入聊天室時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    // 每3秒檢查新訊息
    pollIntervalRef.current = setInterval(async () => {
      if (chat?.id) {
        try {
          const response = await fetch(`/api/chats/${chat.id}`)
          if (response.ok) {
            const updatedChat = await response.json()
            setMessages(updatedChat.messages || [])
          }
        } catch (error) {
          console.error('Error polling messages:', error)
        }
      }
    }, 3000)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !chat?.id || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/chats/${chat.id}/messages`, {
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c6c] mx-auto mb-4"></div>
          <p className="text-gray-500">載入聊天室中...</p>
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
            onClick={loadChat}
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
      {/* 聊天室標題 */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#d96c6c] rounded-full flex items-center justify-center text-white font-bold">
              歪歪
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">與歪歪的對話</h1>
              <p className="text-sm text-gray-600">
                歡迎私訊歪歪！有任何商品問題或代購需求都可以在這裡討論
              </p>
            </div>
          </div>
        </div>

        {/* 訊息區域 */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">🌟 開始您的第一次對話吧！</p>
              <p className="text-sm">歪歪會盡快回覆您的訊息</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === session.user.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-[#d96c6c] text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    <div className={`mt-1 text-xs text-gray-500 ${isOwn ? 'text-right' : 'text-left'}`}>
                      <span>{message.sender.name}</span>
                      <span className="mx-1">•</span>
                      <span>{formatTime(message.createdAt)}</span>
                      {message.isRead && isOwn && (
                        <span className="ml-1 text-green-500">✓</span>
                      )}
                    </div>
                  </div>
                  {!isOwn && (
                    <div className="w-8 h-8 bg-[#d96c6c] rounded-full flex items-center justify-center text-white text-sm font-bold ml-2 flex-shrink-0 order-1">
                      歪
                    </div>
                  )}
                  {isOwn && message.sender.image && (
                    <img
                      src={message.sender.image}
                      alt={message.sender.name}
                      className="w-8 h-8 rounded-full mr-2 flex-shrink-0 order-1"
                    />
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 輸入區域 */}
        <div className="p-6 border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="輸入訊息..."
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
          <p className="text-xs text-gray-500 mt-2">
            💡 提示：您可以詢問商品詳情、代購流程、付款方式等任何問題
          </p>
        </div>
      </div>
    </div>
  )
}