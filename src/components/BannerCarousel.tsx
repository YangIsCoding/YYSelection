'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  description?: string
  sortOrder: number
  isActive: boolean
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // 獲取活躍的廣告橫幅
  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners')
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  // 自動切換功能 - 5秒一次
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length])

  // 手動切換到指定圖片
  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // 上一張
  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1)
  }

  // 下一張
  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1)
  }

  if (loading) {
    return (
      <section className="relative h-96 bg-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </section>
    )
  }

  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  const BannerContent = ({ banner }: { banner: Banner }) => (
    <div className="relative w-full h-[500px] overflow-hidden rounded-lg shadow-lg">
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
      />
      {/* 覆蓋層 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
      
      {/* 標題和描述 */}
      {(banner.title || banner.description) && (
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          {banner.title && (
            <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">
              {banner.title}
            </h3>
          )}
          {banner.description && (
            <p className="text-gray-200 drop-shadow-lg line-clamp-2">
              {banner.description}
            </p>
          )}
        </div>
      )}
    </div>
  )

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative">
          {/* 主要輪播區域 */}
          <div className="relative overflow-hidden rounded-lg">
            {currentBanner.linkUrl ? (
              <Link href={currentBanner.linkUrl} className="block">
                <BannerContent banner={currentBanner} />
              </Link>
            ) : (
              <BannerContent banner={currentBanner} />
            )}
          </div>

          {/* 導航按鈕 - 只有多張圖片時顯示 */}
          {banners.length > 1 && (
            <>
              {/* 左箭頭 */}
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
                aria-label="上一張"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* 右箭頭 */}
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
                aria-label="下一張"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* 指示器點點 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentIndex
                          ? 'bg-white scale-110'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`切換到第 ${index + 1} 張圖片`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 縮圖導航 - 只有多張圖片時顯示 */}
        {banners.length > 1 && (
          <div className="mt-4 flex justify-center space-x-4 overflow-x-auto pb-2">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden transition-all duration-200 ${
                  index === currentIndex
                    ? 'ring-2 ring-rose-500 ring-offset-2 scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}