import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 首先檢查是否有使用者和商品
  const users = await prisma.user.findMany()
  const products = await prisma.product.findMany()

  if (users.length === 0) {
    console.log('❌ 沒有找到使用者，請先登入以建立使用者資料')
    return
  }

  if (products.length === 0) {
    console.log('❌ 沒有找到商品，請先執行商品種子資料')
    return
  }

  console.log(`✅ 找到 ${users.length} 個使用者和 ${products.length} 個商品`)

  // 建立測試訂單
  const testUser = users[0] // 使用第一個使用者
  const testProduct = products[0] // 使用第一個商品

  // 計算訂單總額（使用單一商品，數量為2）
  const quantity = 2
  const subtotal = testProduct.price * quantity

  // 建立測試訂單
  const testOrder = await prisma.order.create({
    data: {
      orderNumber: `25080200001`,
      userId: testUser.id,
      customerName: testUser.name || '',
      customerEmail: testUser.email,
      customerPhone: '0912345678',
      totalAmount: subtotal,
      customerNote: '這是測試訂單，請小心包裝',
      adminNote: '測試客戶，優先處理',
      orderItems: {
        create: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            productImage: testProduct.imageUrl || '',
            unitPrice: testProduct.price,
            quantity: quantity,
            subtotal: subtotal
          }
        ]
      }
    },
    include: {
      orderItems: true
    }
  })

  console.log('✅ 測試訂單建立成功：')
  console.log(`   訂單編號：${testOrder.orderNumber}`)
  console.log(`   客戶：${testOrder.customerName}`)
  console.log(`   商品數量：${testOrder.orderItems.length}`)
  console.log(`   總金額：NT$ ${testOrder.totalAmount / 100}`)
  console.log(`   商品項目：${testOrder.orderItems.length} 項`)
}

main()
  .catch((e) => {
    console.error('❌ 建立測試訂單失敗：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })