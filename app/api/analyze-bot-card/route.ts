import { NextRequest, NextResponse } from 'next/server'
import { analyzeBotCard } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { success: false, error: 'No text provided' },
        { status: 400 }
      )
    }

    console.log('Analyzing bot card, text length:', text.length)
    
    const result = await analyzeBotCard(text)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error analyzing bot card:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze bot card'
      },
      { status: 500 }
    )
  }
} 