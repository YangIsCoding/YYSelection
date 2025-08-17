import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 建立測試商品
  const products = [
    {
      name: '測試商品',
      price: 100000, // 1000元 = 100000分
      description: '這是一個測試商品的描述',
      imageUrl: 'https://picsum.photos/300/200?random=1',
      category: '測試分類',
      stock: 10,
      minStock: 2,
      isActive: true
    },
    {
      name: '測試多圖',
      price: 200000, // 2000元 = 200000分
      description: '這是一個有多張圖片的測試商品',
      imageUrl: 'https://picsum.photos/300/200?random=2',
      category: '測試分類',
      stock: 5,
      minStock: 1,
      isActive: true
    }
  ]

  // 檢查並建立商品資料（如果不存在）
  for (const product of products) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name }
    })
    
    if (!existingProduct) {
      await prisma.product.create({
        data: product
      })
      console.log(`✅ 建立商品：${product.name}`)
    } else {
      console.log(`⏭️ 商品已存在：${product.name}`)
    }
  }

  console.log('✅ 種子資料已建立')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })