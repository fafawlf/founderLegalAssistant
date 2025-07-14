import { NextRequest, NextResponse } from 'next/server'
import { quantifyBotCard } from '@/lib/ai-service'
import type { BotCardAnalysisResult } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { originalContent, analysisResult } = await request.json()
    
    if (!originalContent || !analysisResult) {
      return NextResponse.json(
        { success: false, error: 'Missing originalContent or analysisResult' },
        { status: 400 }
      )
    }

    console.log('Quantifying bot card, content length:', originalContent.length)
    
    const result = await quantifyBotCard(originalContent, analysisResult as BotCardAnalysisResult)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error quantifying bot card:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to quantify bot card'
      },
      { status: 500 }
    )
  }
} 