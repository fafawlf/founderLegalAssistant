import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GoogleGenAI } from '@google/genai'
import type { ActionResponse } from '@/types'

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || ''
})

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  documentText: z.string().min(1, 'Document text is required'),
  chatHistory: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string().or(z.date()).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    )
  })).optional().default([])
})

interface ChatResponse {
  response: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse<ChatResponse>>> {
  try {
    const body = await request.json()
    const validatedData = chatSchema.parse(body)
    
    const { message, documentText, chatHistory } = validatedData
    
    // Build conversation context
    const conversationContext = chatHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n')
    
    const systemPrompt = `You are a world-class lawyer from a top-tier Silicon Valley law firm, specializing in venture capital financing and startup legal matters. You are helping a startup founder understand their legal document and answer questions about it.

IMPORTANT CONTEXT:
- You have access to the founder's legal document
- The founder may have received feedback from their lawyer
- You should always prioritize the founder's interests and provide founder-friendly advice
- Be conversational but professional
- Provide specific, actionable advice
- Reference specific parts of the document when relevant
- If asked about lawyer feedback or suggestions, help the founder understand and evaluate them

DOCUMENT CONTENT:
${documentText}

${conversationContext ? `PREVIOUS CONVERSATION:\n${conversationContext}\n\n` : ''}

Please respond to the founder's question in a helpful, conversational manner. Be specific and reference the document when relevant.`

    const userPrompt = `Founder's question: ${message}`
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `${systemPrompt}\n\n${userPrompt}`,
    })
    
    const aiResponse = response.text || 'I apologize, but I was unable to generate a response. Please try again.'
    
    return NextResponse.json({
      success: true,
      data: { response: aiResponse }
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data: ' + error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process chat message'
    }, { status: 500 })
  }
} 