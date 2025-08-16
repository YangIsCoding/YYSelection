'use client'

import { useState, useRef } from 'react'

interface ImageUploadProps {
  currentImage?: string
  onImageUploaded: (imageUrl: string) => void
  onImageRemoved?: () => void
}

export default function ImageUpload({ 
  currentImage, 
  onImageUploaded, 
  onImageRemoved 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    // 檢查檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('檔案大小不能超過 5MB')
      return
    }

    try {
      setUploading(true)

      // 建立預覽
      const tempPreviewUrl = URL.createObjectURL(file)
      setPreviewUrl(tempPreviewUrl)

      // 上傳檔案
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      // 清理臨時預覽URL
      URL.revokeObjectURL(tempPreviewUrl)
      
      // 設定正式的圖片URL
      setPreviewUrl(result.url)
      onImageUploaded(result.url)

    } catch (error) {
      console.error('Upload error:', error)
      alert(`上傳失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
      
      // 恢復原來的圖片
      setPreviewUrl(currentImage || '')
    } finally {
      setUploading(false)
      
      // 清空input，讓相同檔案可以重新選擇
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl('')
    onImageRemoved?.()
    
    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* 隱藏的檔案選擇input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* 圖片預覽區域 */}
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="商品圖片預覽"
            className="w-48 h-48 object-cover rounded-lg border border-gray-300"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.jpg'
            }}
          />
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-sm">上傳中...</div>
            </div>
          )}
          
          {!uploading && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              title="移除圖片"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={handleClickUpload}
          className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <div className="text-gray-400 text-4xl mb-2">📷</div>
          <div className="text-gray-500 text-sm text-center">
            點擊上傳圖片<br />
            <span className="text-xs text-gray-400">
              支援 JPG、PNG、WebP<br />
              最大 5MB
            </span>
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClickUpload}
          disabled={uploading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? '上傳中...' : previewUrl ? '更換圖片' : '選擇圖片'}
        </button>
        
        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            移除圖片
          </button>
        )}
      </div>
    </div>
  )
}