'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImage {
  id: string
  imageUrl: string
  alt?: string | null
  sortOrder: number
}

interface ImageGalleryProps {
  images: ProductImage[]
  productName: string
  className?: string
  fallbackImageUrl?: string // 後備圖片 URL
}

export default function ImageGallery({ images, productName, className = '', fallbackImageUrl }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  // 打開燈箱模式
  const openLightbox = () => {
    setIsLightboxOpen(true)
  }

  // 關閉燈箱模式
  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  // 切換到下一張圖片
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (images?.length || 1))
  }

  // 切換到上一張圖片
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (images?.length || 1)) % (images?.length || 1))
  }

  // 如果沒有圖片但有後備圖片，顯示後備圖片
  if ((!images || images.length === 0) && fallbackImageUrl) {
    return (
      <div className={`relative ${className}`}>
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
          <Image
            src={fallbackImageUrl}
            alt={productName}
            fill
            className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
            onClick={openLightbox}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://via.placeholder.com/400x400/E5E7EB/9CA3AF?text=圖片載入失敗'
            }}
          />
          
          {/* 放大圖標 */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>

        {/* 後備圖片的燈箱模式 */}
        {isLightboxOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
            >
              ✕
            </button>
            <div className="relative max-w-4xl max-h-full">
              <Image
                src={fallbackImageUrl}
                alt={productName}
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://via.placeholder.com/800x800/E5E7EB/9CA3AF?text=圖片載入失敗'
                }}
              />
            </div>
            <div
              className="absolute inset-0 -z-10"
              onClick={closeLightbox}
            />
          </div>
        )}
      </div>
    )
  }

  // 如果沒有圖片也沒有後備圖片，顯示預設圖片
  if (!images || images.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">暫無圖片</p>
          </div>
        </div>
      </div>
    )
  }

  const currentImage = images[currentImageIndex]

  return (
    <div className={`relative ${className}`}>
      {/* 主圖片 */}
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
        <Image
          src={currentImage.imageUrl}
          alt={currentImage.alt || `${productName} 圖片 ${currentImageIndex + 1}`}
          fill
          className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={openLightbox}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://via.placeholder.com/400x400/E5E7EB/9CA3AF?text=圖片載入失敗'
          }}
        />
        
        {/* 圖片計數器 */}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}

        {/* 導航按鈕 */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* 放大圖標 */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      {/* 縮圖列表 */}
      {images.length > 1 && (
        <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                index === currentImageIndex
                  ? 'border-blue-500 opacity-100'
                  : 'border-gray-300 opacity-60 hover:opacity-80'
              }`}
            >
              <Image
                src={image.imageUrl}
                alt={image.alt || `${productName} 縮圖 ${index + 1}`}
                width={64}
                height={64}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://via.placeholder.com/64x64/E5E7EB/9CA3AF?text=404'
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* 燈箱模式 */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          {/* 關閉按鈕 */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
          >
            ✕
          </button>

          {/* 主圖片 */}
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={currentImage.imageUrl}
              alt={currentImage.alt || `${productName} 圖片 ${currentImageIndex + 1}`}
              width={800}
              height={800}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'https://via.placeholder.com/800x800/E5E7EB/9CA3AF?text=圖片載入失敗'
              }}
            />

            {/* 導航按鈕 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* 圖片資訊 */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>

          {/* 縮圖導航 */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-lg">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-12 h-12 rounded overflow-hidden border transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'border-white opacity-100'
                      : 'border-gray-500 opacity-60 hover:opacity-80'
                  }`}
                >
                  <Image
                    src={image.imageUrl}
                    alt={`縮圖 ${index + 1}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}

          {/* 點擊背景關閉 */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeLightbox}
          />
        </div>
      )}
    </div>
  )
}