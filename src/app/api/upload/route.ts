import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

// 設定 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// 支援的圖片格式
const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 10 // 最多10張圖片

// 本地上傳後備方案（僅用於開發環境）
async function fallbackLocalUpload(files: File[]) {
  const { writeFile } = await import('fs/promises')
  const { join } = await import('path')
  const { v4: uuidv4 } = await import('uuid')
  
  const uploadResults = []
  const errors = []
  
  // 確保上傳目錄存在
  const uploadDir = join(process.cwd(), 'public', 'uploads')

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
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

      // 產生唯一檔名
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${uuidv4()}.${fileExtension}`
      
      // 儲存檔案
      const filePath = join(uploadDir, fileName)
      await writeFile(filePath, buffer)

      // 回傳可訪問的URL
      const fileUrl = `/uploads/${fileName}`

      uploadResults.push({
        success: true,
        url: fileUrl,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        index: i
      })
    } catch (fileError) {
      console.error(`Error uploading file ${i + 1}:`, fileError)
      errors.push(`File ${i + 1}: Failed to upload`)
    }
  }

  // 回傳結果
  const response = {
    success: uploadResults.length > 0,
    uploadedFiles: uploadResults,
    errors: errors.length > 0 ? errors : undefined,
    totalUploaded: uploadResults.length,
    totalErrors: errors.length
  }

  // 如果有成功上傳的文件，回傳200，否則回傳400
  const statusCode = uploadResults.length > 0 ? 200 : 400
  return new Response(JSON.stringify(response), { 
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 開始圖片上傳請求 ===')
    console.log('環境:', process.env.NODE_ENV)
    console.log('Cloudinary 設定檢查:')
    console.log('- CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '已設定' : '未設定')
    console.log('- API_KEY:', process.env.CLOUDINARY_API_KEY ? '已設定' : '未設定') 
    console.log('- API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '已設定' : '未設定')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      console.log('權限檢查失敗:', session?.user?.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('權限檢查通過')

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

    // 檢查 Cloudinary 設定
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('Cloudinary 設定不完整，使用本地上傳')
      return await fallbackLocalUpload(files)
    }
    
    console.log('使用 Cloudinary 上傳')

    const uploadResults = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
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

        // 轉換為 buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // 轉換為 base64
        const base64Data = buffer.toString('base64')
        const dataURI = `data:${file.type};base64,${base64Data}`

        console.log(`開始上傳檔案 ${i + 1}: ${file.name} (${file.size} bytes)`)
        
        // 上傳到 Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'yyselection/products',
          resource_type: 'image',
          public_id: `product_${Date.now()}_${i}`,
        })

        console.log(`檔案 ${i + 1} 上傳成功:`, result.secure_url)

        uploadResults.push({
          success: true,
          url: result.secure_url,
          fileName: result.public_id,
          originalName: file.name,
          size: file.size,
          type: file.type,
          index: i
        })
      } catch (fileError) {
        console.error(`檔案 ${i + 1} 上傳失敗:`, fileError)
        if (fileError instanceof Error) {
          console.error('錯誤詳情:', {
            message: fileError.message,
            stack: fileError.stack,
            name: fileError.name
          })
        }
        errors.push(`File ${i + 1}: Failed to upload - ${fileError instanceof Error ? fileError.message : '未知錯誤'}`)
      }
    }

    // 回傳結果
    const response = {
      success: uploadResults.length > 0,
      uploadedFiles: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadResults.length,
      totalErrors: errors.length
    }

    console.log('上傳結果:', {
      成功: uploadResults.length,
      失敗: errors.length,
      總計: files.length
    })

    // 如果有成功上傳的文件，回傳200，否則回傳400
    const statusCode = uploadResults.length > 0 ? 200 : 400

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('=== 上傳過程發生嚴重錯誤 ===')
    console.error('錯誤:', error)
    if (error instanceof Error) {
      console.error('錯誤詳情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { error: 'Failed to upload files', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}