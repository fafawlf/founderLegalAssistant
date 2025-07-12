import { GoogleGenAI } from '@google/genai'
import type { AnalysisResult, LegalComment } from '@/types'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })

// 简单的内存缓存
const analysisCache = new Map<string, AnalysisResult>()

// 生成缓存键
function generateCacheKey(text: string, systemPrompt?: string): string {
  const content = `${text}-${systemPrompt || 'default'}`
  // 简单哈希函数
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return hash.toString()
}

function parseRobustJson(textResponse: string): AnalysisResult {
  console.log('Attempting to parse JSON, length:', textResponse.length)
  console.log('JSON preview:', textResponse.substring(0, 500))
  
  try {
    // 基本清理
    let jsonText = textResponse.trim()
    
    // 移除markdown代码块
    jsonText = jsonText.replace(/^```(?:json)?\s*/g, '')
    jsonText = jsonText.replace(/```\s*$/g, '')
    
    // 修复智能引号
    jsonText = jsonText.replace(/[""]/g, '"')
    jsonText = jsonText.replace(/['']/g, "'")
    
    // 移除尾随逗号
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1')
    
    const result = JSON.parse(jsonText)
    console.log('Successfully parsed JSON')
    return result
  } catch (error) {
    console.log('JSON parse error:', error)
    
    // 返回fallback结果
    return {
      document_id: `fallback-${Date.now()}`,
      analysis_summary: 'Document analysis encountered technical issues. Please try again or consult legal counsel.',
      comments: [{
        comment_id: 'fallback-comment',
        context_before: '',
        original_text: 'Document requires review',
        context_after: '',
        severity: 'Recommend to Change',
        comment_title: 'Technical Analysis Issue',
        comment_details: 'The automated analysis could not be completed due to technical issues. Please have this document reviewed manually.',
        recommendation: 'Consult with qualified legal counsel for a thorough review.',
        market_standard: {
          is_standard: 'Partially',
          reasoning: 'Unable to complete market analysis.'
        }
      }]
    }
  }
}

const DEFAULT_SYSTEM_PROMPT = `You are a senior legal advisor helping a startup founder review legal documents. 

Analyze the document and return ONLY a valid JSON object with this exact structure:

{
  "document_id": "unique-id",
  "analysis_summary": "Brief summary of key issues",
  "comments": [
    {
      "comment_id": "comment-1", 
      "context_before": "text before",
      "original_text": "exact text from document",
      "context_after": "text after",
      "severity": "Must Change",
      "comment_title": "Short title",
      "comment_details": "Explanation of the issue",
      "recommendation": "What to do about it",
      "market_standard": {
        "is_standard": "Yes/No/Partially",
        "reasoning": "Brief explanation"
      }
    }
  ]
}

CRITICAL: Return ONLY the JSON object. No markdown formatting, no explanations, no additional text.`

export async function analyzeLegalDocument(
  text: string, 
  systemPrompt?: string, 
  temperature: number = 0.1, 
  topP: number = 0.8
): Promise<AnalysisResult> {
  try {
    // 检查缓存
    const cacheKey = generateCacheKey(text, systemPrompt)
    const cachedResult = analysisCache.get(cacheKey)
    
    if (cachedResult) {
      console.log('Returning cached analysis result')
      return cachedResult
    }

    console.log('Making new AI API call...')
    
    // 使用正确的API调用方式
    const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `${prompt}\n\nDocument to analyze:\n${text}`,
    })

    const textResponse = response.text
    
    if (!textResponse) {
      throw new Error('No response text received from AI model')
    }

    console.log('AI Response length:', textResponse.length)
    console.log('AI Response preview:', textResponse.substring(0, 200))

    const result = parseRobustJson(textResponse)
    
    // 缓存结果
    analysisCache.set(cacheKey, result)
    console.log('Cached analysis result')
    
    return result
  } catch (error) {
    console.error('Error analyzing legal document:', error)
    throw new Error('Failed to analyze document. Please try again.')
  }
} 