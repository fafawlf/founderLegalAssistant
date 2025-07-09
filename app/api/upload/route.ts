import { NextRequest, NextResponse } from 'next/server'
import { processFile } from '@/lib/file-processor'
import type { ActionResponse, FileUploadResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse<FileUploadResponse>>> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }
    
    const result = await processFile(file)
    
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