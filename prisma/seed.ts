import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 建立範例商品
  const products = [
    {
      name: '歪歪精選商品 A',
      price: 99900, // 999元 = 99900分
      description: '這是一個超棒的商品！質量優良，值得信賴。',
      imageUrl: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=商品+A',
      category: '3C數碼',
      stock: 50,
      minStock: 10,
      isActive: true
    },
    {
      name: '歪歪精選商品 B',
      price: 129900, // 1299元 = 129900分
      description: '另一個超棒的商品！功能強大，使用方便。',
      imageUrl: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=商品+B',
      category: '服裝配件',
      stock: 3, // 設為低庫存
      minStock: 5,
      isActive: true
    },
    {
      name: '歪歪限量商品 C',
      price: 199900, // 1999元 = 199900分
      description: '限量發售的特殊商品，機會難得！',
      imageUrl: 'https://via.placeholder.com/300x200/DC2626/FFFFFF?text=商品+C',
      category: '美妝保養',
      stock: 0, // 設為缺貨
      minStock: 2,
      isActive: true
    },
    {
      name: 'iPhone 15 Pro Max',
      price: 4990000, // 49900元
      description: '最新的iPhone 15 Pro Max，功能強大，拍照效果絕佳。',
      imageUrl: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSR4MZFkhXRof2QYu-5Gl-Ei-5mMd4R-Gk5PRW7C-cK-o9jdsLLLV_5It2UZM8HNW6d7yWG2fnq2lJfeCjifrRV_y5LTqxNCurW4Q99dA',
      category: '3C數碼',
      stock: 25,
      minStock: 5,
      isActive: true
    },
    {
      name: 'MacBook Air M2',
      price: 3590000, // 35900元
      description: '輕薄的MacBook Air搭載M2晶片，效能與續航力兼具。',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8vD8wGJQr0nYVfRWyZwqQU8B7Jl6kLLhLIA&s',
      category: '3C數碼',
      stock: 15,
      minStock: 3,
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