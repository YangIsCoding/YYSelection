import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reviews?productId=xxx - 獲取商品的所有評價
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: '缺少商品ID' }, { status: 400 })
    }

    // 獲取商品的所有評價
    const reviews = await prisma.review.findMany({
      where: {
        productId: productId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 計算平均評分
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0

    // 格式化響應數據
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isAnonymous: review.isAnonymous,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.isAnonymous ? null : {
        id: review.user.id,
        name: review.user.name,
        image: review.user.image
      }
    }))

    return NextResponse.json({
      reviews: formattedReviews,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10 // 保留一位小數
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: '獲取評價失敗' }, 
      { status: 500 }
    )
  }
}

// POST /api/reviews - 創建新評價
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 })
    }

    const { productId, rating, comment, isAnonymous } = await request.json()

    // 驗證必填欄位
    if (!productId || !rating) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    // 驗證評分範圍
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: '評分必須在1-5之間' }, { status: 400 })
    }

    // 檢查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    // 檢查用戶是否已經評價過此商品
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    if (existingReview) {
      return NextResponse.json({ error: '您已經評價過此商品' }, { status: 409 })
    }

    // 創建新評價
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId: productId,
        rating: rating,
        comment: comment || null,
        isAnonymous: isAnonymous || false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // 格式化響應數據
    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isAnonymous: review.isAnonymous,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.isAnonymous ? null : {
        id: review.user.id,
        name: review.user.name,
        image: review.user.image
      }
    }

    return NextResponse.json(formattedReview, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: '創建評價失敗' }, 
      { status: 500 }
    )
  }
}