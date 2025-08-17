'use client'

import { useState, useRef } from 'react'

interface DragDropUploadProps {
  onFileUpload: (file: File) => void
  accept?: string
  maxSize?: number // bytes
  className?: string
  children?: React.ReactNode
}

export default function DragDropUpload({
  onFileUpload,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
  children
}: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // 檢查檔案類型
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      return '請上傳正確的檔案格式'
    }

    // 檢查檔案大小
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return `檔案大小不能超過 ${maxSizeMB}MB`
    }

    return null
  }

  const handleFile = (file: File) => {
    setError(null)
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }

    onFileUpload(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {children || (
          <div className="space-y-4">
            <div className="text-4xl">
              {isDragOver ? '📁' : '📷'}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragOver ? '放開來上傳檔案' : '拖曳圖片到這裡'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                或點擊選擇檔案 (最大 {Math.round(maxSize / (1024 * 1024))}MB)
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg">
            <div className="text-red-600 font-medium">
              ❌ {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}