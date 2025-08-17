'use client'

import { useState } from 'react'

interface BulkUrlUploadProps {
  onUrlsUpdate: (urls: string[]) => void
  maxUrls?: number
  className?: string
}

interface UrlItem {
  id: number
  url: string
  isValid: boolean
  error?: string
}

export default function BulkUrlUpload({
  onUrlsUpdate,
  maxUrls = 10,
  className = ''
}: BulkUrlUploadProps) {
  const [urlItems, setUrlItems] = useState<UrlItem[]>(() => 
    Array.from({ length: maxUrls }, (_, i) => ({
      id: i,
      url: '',
      isValid: true
    }))
  )

  const validateUrl = (url: string): { isValid: boolean; error?: string } => {
    if (!url.trim()) {
      return { isValid: true } // 空值是允許的
    }

    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: '只支援 HTTP/HTTPS 網址' }
      }
      return { isValid: true }
    } catch {
      return { isValid: false, error: '請輸入有效的網址' }
    }
  }

  const updateUrl = (id: number, newUrl: string) => {
    const validation = validateUrl(newUrl)
    
    setUrlItems(prev => {
      const updated = prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              url: newUrl, 
              isValid: validation.isValid,
              error: validation.error 
            }
          : item
      )
      
      // 通知父組件有效的 URLs
      const validUrls = updated
        .filter(item => item.url.trim() && item.isValid)
        .map(item => item.url.trim())
      
      onUrlsUpdate(validUrls)
      
      return updated
    })
  }

  const clearAll = () => {
    setUrlItems(prev => prev.map(item => ({
      ...item,
      url: '',
      isValid: true,
      error: undefined
    })))
    onUrlsUpdate([])
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
      
      setUrlItems(prev => {
        const updated = prev.map((item, index) => {
          if (index < lines.length && lines[index]) {
            const validation = validateUrl(lines[index])
            return {
              ...item,
              url: lines[index],
              isValid: validation.isValid,
              error: validation.error
            }
          }
          return item
        })
        
        const validUrls = updated
          .filter(item => item.url.trim() && item.isValid)
          .map(item => item.url.trim())
        
        onUrlsUpdate(validUrls)
        
        return updated
      })
    } catch (error) {
      console.error('無法讀取剪貼簿:', error)
      alert('無法讀取剪貼簿內容，請手動貼上')
    }
  }

  const validCount = urlItems.filter(item => item.url.trim() && item.isValid).length
  const errorCount = urlItems.filter(item => item.url.trim() && !item.isValid).length

  return (
    <div className={className}>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            批量網址輸入 ({validCount}/{maxUrls})
          </h3>
          {errorCount > 0 && (
            <span className="text-sm text-red-600">
              {errorCount} 個網址有錯誤
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={pasteFromClipboard}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            從剪貼簿貼上
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            清空全部
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {urlItems.map((item, index) => (
          <div key={item.id} className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              圖片網址 #{index + 1}
            </label>
            <input
              type="url"
              value={item.url}
              onChange={(e) => updateUrl(item.id, e.target.value)}
              placeholder={`https://example.com/image${index + 1}.jpg`}
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                item.url.trim() && !item.isValid
                  ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {item.error && (
              <p className="text-xs text-red-600">
                {item.error}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">使用說明：</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 可以輸入最多 {maxUrls} 個圖片網址</li>
          <li>• 支援 HTTP/HTTPS 網址格式</li>
          <li>• 可以使用「從剪貼簿貼上」功能批量輸入（每行一個網址）</li>
          <li>• 空白欄位會被忽略</li>
        </ul>
      </div>
    </div>
  )
}