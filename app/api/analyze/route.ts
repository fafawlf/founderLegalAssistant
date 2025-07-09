import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeLegalDocument } from '@/lib/ai-service'
import type { ActionResponse, AnalysisResult } from '@/types'

const analyzeSchema = z.object({
  text: z.string().min(1, 'Document text is required'),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse<AnalysisResult>>> {
  try {
    const body = await request.json()
    const validatedData = analyzeSchema.parse(body)
    
    const { text, systemPrompt, temperature = 0.1, topP = 0.8 } = validatedData
    
    const result = await analyzeLegalDocument(text, systemPrompt, temperature, topP)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Analysis API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data: ' + error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze document'
    }, { status: 500 })
  }
} 