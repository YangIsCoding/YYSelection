import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('API: Starting to fetch products...')
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('Environment:', process.env.NODE_ENV)
    
    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1 // 只取第一張圖片用於列表顯示
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('API: Found products:', products.length)
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products - Full error:', error)
    console.error('Error name:', (error as any)?.name)
    console.error('Error message:', (error as any)?.message)
    console.error('Error stack:', (error as any)?.stack)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, price, description, imageUrl, category } = body

    if (!name || !price || !description || !imageUrl || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: Math.round(price * 100), // 轉換為分
        description,
        imageUrl,
        category
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}