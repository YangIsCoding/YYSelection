import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 獲取使用者的聊天列表（管理員看所有聊天，用戶看自己的聊天）
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id!
    const isAdmin = session.user.role === 'ADMIN'

    if (isAdmin) {
      // 管理員看所有聊天室
      const chats = await prisma.chat.findMany({
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
            orderBy: { createdAt: 'desc' },
            take: 1,
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
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId } // 管理員未讀的是用戶發送的訊息
                }
              }
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      })

      const totalUnreadCount = await prisma.message.count({
        where: {
          isRead: false,
          senderId: { not: userId },
          chat: {
            isActive: true
          }
        }
      })

      const formattedChats = chats.map(chat => ({
        ...chat,
        unreadCount: chat._count.messages
      }))

      return NextResponse.json({
        chats: formattedChats,
        totalUnreadCount
      })
    } else {
      // 一般用戶只看自己的聊天室
      let chat = await prisma.chat.findUnique({
        where: { userId },
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
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId } // 用戶未讀的是管理員發送的訊息
                }
              }
            }
          }
        }
      })

      // 如果聊天室不存在，建立一個
      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            userId,
            isActive: true,
            lastMessageAt: new Date()
          },
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
            },
            _count: {
              select: {
                messages: {
                  where: {
                    isRead: false,
                    senderId: { not: userId }
                  }
                }
              }
            }
          }
        })
      }

      const formattedChat = {
        ...chat,
        unreadCount: chat._count.messages
      }

      return NextResponse.json({
        chats: [formattedChat],
        totalUnreadCount: chat._count.messages
      })
    }
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}

// 建立新的聊天室或發送第一條訊息
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { initialMessage } = body

    const userId = session.user.id!
    
    // 檢查是否已有聊天室
    let chat = await prisma.chat.findUnique({
      where: { userId },
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

    // 如果聊天室不存在，建立一個
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId,
          isActive: true,
          lastMessageAt: new Date()
        },
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
    }

    // 如果有初始訊息，發送它
    if (initialMessage && initialMessage.trim()) {
      const message = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: userId,
          content: initialMessage.trim(),
          messageType: 'TEXT'
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
        where: { id: chat.id },
        data: { lastMessageAt: new Date() }
      })

      chat.messages.push(message)
    }

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}