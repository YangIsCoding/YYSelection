export interface Chat {
  id: string
  userId: string
  adminId?: string
  isActive: boolean
  lastMessageAt: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
  messages: Message[]
  unreadCount?: number
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  messageType: MessageType
  isRead: boolean
  readAt?: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  sender: {
    id: string
    name: string
    image?: string
    role?: string
  }
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER'
}

export interface SendMessageRequest {
  content: string
  messageType?: MessageType
}

export interface ChatListResponse {
  chats: Chat[]
  totalUnreadCount: number
}

export interface CreateChatRequest {
  initialMessage?: string
}