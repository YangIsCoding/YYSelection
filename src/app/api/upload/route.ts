import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

// 支援的圖片格式
const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 10 // 最多10張圖片

export async function POST(request: NextRequest) {
  try {
    console.log('=== 開始 Vercel Blob 圖片上傳 ===')
    console.log('環境:', process.env.NODE_ENV)
    
    // 檢查權限
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      console.log('權限檢查失敗:', session?.user?.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('權限檢查通過，使用 Vercel Blob 上傳')

    const formData = await request.formData()
    
    // 支援單個文件或多個文件上傳
    const files: File[] = []
    
    // 檢查是否為單個文件上傳
    const singleFile = formData.get('file') as File
    if (singleFile) {
      files.push(singleFile)
    }
    
    // 檢查是否為多個文件上傳
    const multipleFiles = formData.getAll('files') as File[]
    if (multipleFiles.length > 0) {
      files.push(...multipleFiles.filter(f => f instanceof File))
    }

    if (files.length === 0) {
      console.log('錯誤: 沒有檔案上傳')
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    console.log(`檔案數量: ${files.length}`)

    // 檢查文件數量限制
    if (files.length > MAX_FILES) {
      console.log(`錯誤: 檔案數量超過限制 (${files.length} > ${MAX_FILES})`)
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} files allowed.` },
        { status: 400 }
      )
    }

    const uploadResults = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        console.log(`處理檔案 ${i + 1}: ${file.name} (${file.size} bytes)`)
        
        // 檢查檔案類型
        if (!SUPPORTED_TYPES.includes(file.type)) {
          errors.push(`File ${i + 1}: Unsupported file type. Please upload JPEG, PNG, or WebP images.`)
          continue
        }

        // 檢查檔案大小
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`File ${i + 1}: File too large. Maximum size is 5MB.`)
          continue
        }

        // 產生有意義的檔名
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(7)
        const fileName = `${timestamp}-${randomSuffix}.${fileExtension}`
        
        // 上傳到 Vercel Blob
        console.log(`上傳到 Vercel Blob: ${fileName}`)
        const blob = await put(fileName, file, {
          access: 'public',
          addRandomSuffix: false // 我們已經自己加了隨機後綴
        })

        console.log(`檔案 ${i + 1} 上傳成功: ${blob.url}`)

        uploadResults.push({
          success: true,
          url: blob.url,
          fileName: fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          index: i,
          blobUrl: blob.url // Vercel Blob 的完整 URL
        })
      } catch (fileError) {
        console.error(`檔案 ${i + 1} 處理失敗:`, fileError)
        const errorMessage = fileError instanceof Error ? fileError.message : '未知錯誤'
        errors.push(`File ${i + 1}: Failed to upload - ${errorMessage}`)
      }
    }

    // 回傳結果
    const response = {
      success: uploadResults.length > 0,
      uploadedFiles: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadResults.length,
      totalErrors: errors.length,
      storage: 'vercel-blob'
    }

    console.log('Vercel Blob 上傳結果:', {
      成功: uploadResults.length,
      失敗: errors.length,
      總計: files.length
    })

    // 如果有成功上傳的文件，回傳200，否則回傳400
    const statusCode = uploadResults.length > 0 ? 200 : 400

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('=== Vercel Blob 上傳過程發生嚴重錯誤 ===')
    console.error('錯誤:', error)
    
    // 特別處理 Vercel Blob 相關錯誤
    let errorMessage = 'Failed to upload files'
    let details = error instanceof Error ? error.message : '未知錯誤'
    
    if (details.includes('BLOB_READ_WRITE_TOKEN')) {
      errorMessage = 'Vercel Blob 未設定'
      details = '請在 Vercel Dashboard 中設定 BLOB_READ_WRITE_TOKEN 環境變數'
    }
    
    return NextResponse.json(
      { error: errorMessage, details, storage: 'vercel-blob' },
      { status: 500 }
    )
  }
}