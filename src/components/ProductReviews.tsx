'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import StarRating from './StarRating'

interface Review {
  id: string
  rating: number
  comment: string | null
  isAnonymous: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    image: string | null
  } | null
}

interface ReviewsData {
  reviews: Review[]
  totalReviews: number
  averageRating: number
}

interface ProductReviewsProps {
  productId: string
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    isAnonymous: false
  })
  const [submitting, setSubmitting] = useState(false)

  // 獲取評價數據
  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${productId}`)
      if (response.ok) {
        const data = await response.json()
        setReviewsData(data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  // 提交新評價
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      alert('請先登入才能撰寫評價')
      return
    }

    if (newReview.rating === 0) {
      alert('請選擇評分')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          rating: newReview.rating,
          comment: newReview.comment.trim() || null,
          isAnonymous: newReview.isAnonymous
        })
      })

      if (response.ok) {
        alert('感謝您的評價！')
        setShowWriteReview(false)
        setNewReview({ rating: 0, comment: '', isAnonymous: false })
        fetchReviews() // 重新獲取評價
      } else {
        const error = await response.json()
        alert(error.error || '提交評價失敗')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('提交評價時發生錯誤')
    } finally {
      setSubmitting(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 檢查用戶是否已經評價過
  const userHasReviewed = reviewsData?.reviews.some(
    review => review.user?.id === session?.user?.id
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 評價統計 */}
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          商品評價
        </h3>
        
        {reviewsData && reviewsData.totalReviews > 0 ? (
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {reviewsData.averageRating}
              </div>
              <StarRating rating={reviewsData.averageRating} readonly size="sm" />
              <div className="text-sm text-gray-600 mt-1">
                平均評分
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-700">
                {reviewsData.totalReviews}
              </div>
              <div className="text-sm text-gray-600">
                總評價數
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.392 2.46a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54 1.118l-3.392-2.46a1 1 0 00-1.176 0l-3.392 2.46c-.784.57-1.838-.197-1.539-1.118l1.286-3.97a1 1 0 00-.364-1.118L2.045 9.397c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              尚無評價
            </h4>
            <p className="text-gray-600">
              成為第一個評價此商品的用戶
            </p>
          </div>
        )}

        {/* 撰寫評價按鈕 */}
        {session && !userHasReviewed && !showWriteReview && (
          <button
            onClick={() => setShowWriteReview(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            撰寫評價
          </button>
        )}

        {!session && (
          <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
            請先登入才能撰寫評價
          </p>
        )}

        {userHasReviewed && (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-700">
              您已經評價過此商品
            </p>
          </div>
        )}
      </div>

      {/* 撰寫評價表單 */}
      {showWriteReview && (
        <div className="bg-white rounded-lg p-6 border">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            撰寫評價
          </h4>
          
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                評分 *
              </label>
              <StarRating
                rating={newReview.rating}
                onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                showText
                size="lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                評價內容
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="分享您的使用心得..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={newReview.isAnonymous}
                onChange={(e) => setNewReview(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
              />
              <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                匿名評價
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || newReview.rating === 0}
                className="bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : '提交評價'}
              </button>
              <button
                type="button"
                onClick={() => setShowWriteReview(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 評價列表 */}
      {reviewsData && reviewsData.reviews.length > 0 && (
        <div className="space-y-4">
          {reviewsData.reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg p-6 border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {review.user && !review.isAnonymous ? (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {review.user.image ? (
                        <img
                          src={review.user.image}
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 text-sm font-medium">
                          {review.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm">?</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="font-medium text-gray-900">
                      {review.user && !review.isAnonymous ? review.user.name : '匿名用戶'}
                    </h5>
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}