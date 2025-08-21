import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 獲取特定聊天室的詳細資訊和訊息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id!
    const isAdmin = session.user.role === 'ADMIN'
    const { chatId } = await params

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
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
        }
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // 權限檢查：用戶只能訪問自己的聊天室，管理員可以訪問所有聊天室
    if (!isAdmin && chat.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 標記訊息為已讀（只標記對方發送的訊息）
    await prisma.message.updateMany({
      where: {
        chatId: chatId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    )
  }
}

// 更新聊天室狀態
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    const body = await request.json()
    const { isActive } = body

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { isActive },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
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
        }
      }
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error updating chat:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    )
  }
}