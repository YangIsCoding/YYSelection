import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 檢查是否有使用者
  const users = await prisma.user.findMany()
  
  if (users.length === 0) {
    console.log('❌ 沒有找到使用者，請先登入以建立使用者資料')
    return
  }

  console.log(`✅ 找到 ${users.length} 個使用者`)

  // 找到管理員和一般使用者
  const admin = users.find(user => user.role === 'ADMIN')
  const regularUser = users.find(user => user.role === 'USER')

  if (!admin) {
    console.log('❌ 沒有找到管理員使用者')
    return
  }

  if (!regularUser) {
    console.log('❌ 沒有找到一般使用者，建立測試聊天室需要至少一個一般使用者')
    return
  }

  // 檢查是否已有聊天室
  const existingChat = await prisma.chat.findUnique({
    where: { userId: regularUser.id }
  })

  if (existingChat) {
    console.log('⏭️ 聊天室已存在')
    return
  }

  // 建立測試聊天室和訊息
  const chat = await prisma.chat.create({
    data: {
      userId: regularUser.id,
      isActive: true,
      lastMessageAt: new Date(),
      messages: {
        create: [
          {
            senderId: regularUser.id,
            content: '您好！我想詢問一下代購的相關問題',
            messageType: 'TEXT'
          },
          {
            senderId: admin.id,
            content: '您好！很高興為您服務，請問您想了解什麼商品呢？',
            messageType: 'TEXT',
            isRead: true,
            readAt: new Date()
          },
          {
            senderId: regularUser.id,
            content: '我想要購買一些日本的化妝品，請問代購流程是怎樣的？',
            messageType: 'TEXT'
          }
        ]
      }
    },
    include: {
      messages: true
    }
  })

  console.log('✅ 測試聊天室建立成功：')
  console.log(`   聊天室 ID：${chat.id}`)
  console.log(`   客戶：${regularUser.name}`)
  console.log(`   訊息數量：${chat.messages.length}`)
}

main()
  .catch((e) => {
    console.error('❌ 建立測試聊天室失敗：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })