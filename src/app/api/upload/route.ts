import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// 支援的圖片格式
const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 10 // 最多10張圖片

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    // 檢查文件數量限制
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} files allowed.` },
        { status: 400 }
      )
    }

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

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}