'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface UploadedImage {
  url: string
  alt?: string
  sortOrder?: number
}

interface MultiImageUploadProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
  maxFileSize?: number // 以MB為單位
  className?: string
}

export default function MultiImageUpload({
  images = [],
  onChange,
  maxImages = 10,
  maxFileSize = 5,
  className = ''
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 處理文件選擇
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    // 檢查圖片數量限制
    if (images.length + files.length > maxImages) {
      setError(`最多只能上傳 ${maxImages} 張圖片`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // 創建FormData
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      // 上傳圖片
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.uploadedFiles) {
        // 添加新圖片到現有圖片列表
        const newImages = result.uploadedFiles.map((file: any, index: number) => ({
          url: file.url,
          alt: '', // 確保alt有初始值
          sortOrder: images.length + index
        }))

        onChange([...images, ...newImages])
      } else {
        setError(result.error || '上傳失敗')
      }

      // 如果有錯誤，顯示錯誤信息
      if (result.errors && result.errors.length > 0) {
        setError(result.errors.join(', '))
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('上傳時發生錯誤')
    } finally {
      setUploading(false)
      // 清空file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 刪除圖片
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // 重新排序
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sortOrder: i
    }))
    onChange(reorderedImages)
  }

  // 更新圖片alt文字
  const updateImageAlt = (index: number, alt: string) => {
    const newImages = [...images]
    newImages[index] = { 
      ...newImages[index], 
      alt: alt || '' // 確保alt永遠不是undefined
    }
    onChange(newImages)
  }

  // 拖拽重新排序
  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    
    // 重新排序
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sortOrder: i
    }))
    onChange(reorderedImages)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上傳按鈕 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          商品圖片 ({images.length}/{maxImages})
        </h3>
        
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm transition"
          >
            {uploading ? '上傳中...' : '選擇圖片'}
          </button>
        )}
      </div>

      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 圖片網格 */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              {/* 圖片預覽 */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors">
                <Image
                  src={image.url}
                  alt={image.alt || `圖片 ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/200x200/E5E7EB/9CA3AF?text=載入失敗'
                  }}
                />
              </div>

              {/* 圖片序號 */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* 操作按鈕 */}
              <div className="absolute top-2 right-2 flex gap-1">
                {/* 左移 */}
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="向左移動"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* 右移 */}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="向右移動"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* 刪除按鈕 */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="bg-red-600 hover:bg-red-700 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="刪除圖片"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Alt文字輸入 */}
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="圖片描述（可選）"
                  value={image.alt ?? ''}
                  onChange={(e) => updateImageAlt(index, e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 空狀態 */
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 mb-2">尚未上傳圖片</p>
          <p className="text-sm text-gray-400">
            支援 JPEG、PNG、WebP 格式，單檔最大 {maxFileSize}MB
          </p>
        </div>
      )}

      {/* 使用說明 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 第一張圖片將作為主要展示圖片</p>
        <p>• 支援格式：JPEG、PNG、WebP</p>
        <p>• 單檔大小限制：{maxFileSize}MB</p>
        <p>• 圖片總數限制：{maxImages}張</p>
        <p>• 可拖拽排序或使用箭頭按鈕調整順序</p>
      </div>
    </div>
  )
}