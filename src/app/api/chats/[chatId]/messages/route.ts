import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyNewMessage } from '@/lib/notification-service'

// 發送訊息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    const body = await request.json()
    const { content, messageType = 'TEXT' } = body
    const userId = session.user.id!
    const isAdmin = session.user.role === 'ADMIN'

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // 驗證聊天室存在且用戶有權限
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, userId: true, isActive: true }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    if (!isAdmin && chat.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!chat.isActive) {
      return NextResponse.json(
        { error: 'Chat is not active' },
        { status: 400 }
      )
    }

    // 建立訊息
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
        messageType
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        }
      }
    })

    // 更新聊天室的最後訊息時間
    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() }
    })

    // 發送通知給接收者
    try {
      const recipientId = isAdmin ? chat.userId : 'admin' // 假設管理員ID為 'admin'
      
      // 如果不是發送者自己的聊天室，才發送通知
      if (recipientId !== userId) {
        // 獲取接收者的使用者ID（如果是發給管理員，需要獲取管理員用戶）
        if (recipientId === 'admin') {
          const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
          })
          
          // 向所有管理員發送通知
          for (const admin of adminUsers) {
            await notifyNewMessage(
              admin.id,
              message.sender.name || '使用者',
              content.trim(),
              chatId
            )
          }
        } else {
          // 發送通知給用戶
          await notifyNewMessage(
            recipientId,
            message.sender.name || '管理員',
            content.trim(),
            chatId
          )
        }
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // 不讓通知錯誤影響消息發送
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// 獲取聊天室的訊息歷史
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    const userId = session.user.id!
    const isAdmin = session.user.role === 'ADMIN'

    // 驗證聊天室存在且用戶有權限
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, userId: true }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    if (!isAdmin && chat.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 獲取訊息
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        }
      }
    })

    // 翻轉順序，讓最新的訊息在最後
    const orderedMessages = messages.reverse()

    return NextResponse.json({
      messages: orderedMessages,
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}