import { NextRequest, NextResponse } from 'next/server'
import { processFile } from '@/lib/file-processor'
import type { ActionResponse, FileUploadResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse<FileUploadResponse>>> {
  try {
    console.log('Upload API called')
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('No file provided')
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }
    
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    })
    
    const result = await processFile(file)
    console.log('Process file result:', result)
    
    return NextResponse.json({
      success: result.success,
      data: result
    })
  } catch (error) {
    console.error('Upload API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process file'
    }, { status: 500 })
  }
} 