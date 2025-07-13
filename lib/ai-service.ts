import { GoogleGenAI } from '@google/genai'
import type { AnalysisResult, LegalComment, BotCardAnalysisResult, BotCardAnalysisSummary } from '@/types'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })

// 简单的内存缓存
const analysisCache = new Map<string, AnalysisResult>()
const botCardCache = new Map<string, BotCardAnalysisResult>()

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

function parseBotCardJson(textResponse: string): BotCardAnalysisResult {
  console.log('Attempting to parse bot card JSON, length:', textResponse.length)
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
    console.log('Successfully parsed bot card JSON')
    return result
  } catch (error) {
    console.log('Bot card JSON parse error:', error)
    
    // 返回fallback结果
    return {
      card_id: `fallback-${Date.now()}`,
      analysis_summary: {
        overall_assessment: 'Bot card analysis encountered technical issues. Please try again.',
        target_audience_fit: 'Unable to determine target audience due to technical issues.',
        discoverability_and_packaging: 'Unable to assess packaging due to technical issues.',
        narrative_potential_and_originality: 'Unable to evaluate narrative potential due to technical issues.',
        key_strengths_summary: 'Unable to identify strengths due to technical issues.',
        key_weaknesses_summary: 'Unable to identify weaknesses due to technical issues.'
      },
      locatable_comments: [{
        comment_id: 'fallback-comment',
        source_section: 'General',
        context_before: '',
        original_text: 'Bot card requires review',
        context_after: '',
        comment_type: 'Content Issue',
        comment_title: 'Technical Analysis Issue',
        comment_details: 'The automated analysis could not be completed due to technical issues. Please have this bot card reviewed manually.',
        recommendation: 'Review the bot card content manually and ensure all sections are properly formatted.'
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

const BOT_CARD_REVIEW_PROMPT = `You are a top-tier AI character content strategy analyst. Analyze the provided bot card content and create a comprehensive analysis report in JSON format.

Your analysis should include:

1. ANALYSIS SUMMARY - A detailed strategic assessment covering:
   - overall_assessment: Overall quality, core experience, and creation level
   - target_audience_fit: Target user analysis (RPG players, casual users, etc.) and how well it meets their needs
   - discoverability_and_packaging: Title, description quality, searchability, and appeal
   - narrative_potential_and_originality: Long-term playability, creativity, uniqueness vs generic templates
   - key_strengths_summary: Main strengths and highlights
   - key_weaknesses_summary: Main areas needing improvement

2. LOCATABLE COMMENTS - Specific, evidence-based feedback on text segments:
   - comment_type options: "内容优点" (content strengths), "内容问题" (content issues), "LLM问题" (LLM/prompt issues)
   - Provide detailed analysis and specific recommendations

Return ONLY this JSON structure:
{
  "card_id": "unique_id_for_card",
  "analysis_summary": {
    "overall_assessment": "detailed overall assessment",
    "target_audience_fit": "detailed target audience analysis", 
    "discoverability_and_packaging": "detailed packaging analysis",
    "narrative_potential_and_originality": "detailed creativity analysis",
    "key_strengths_summary": "detailed strengths summary",
    "key_weaknesses_summary": "detailed weaknesses summary"
  },
  "locatable_comments": [
    {
      "comment_id": "comment-1",
      "source_section": "Title|Description|Welcome Message|Bot Prompt",
      "context_before": "text before highlighted section",
      "original_text": "exact text being commented on",
      "context_after": "text after highlighted section", 
      "comment_type": "内容优点|内容问题|LLM问题",
      "comment_title": "concise comment title",
      "comment_details": "detailed analysis explanation",
      "recommendation": "specific actionable improvement"
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
  // Check cache first
  const cacheKey = generateCacheKey(text, systemPrompt)
  if (analysisCache.has(cacheKey)) {
    console.log('Using cached analysis result')
    return analysisCache.get(cacheKey)!
  }

  try {
    console.log('Making new AI API call...')
    
    // 使用正确的API调用方式
    const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `${prompt}\\n\\nDocument to analyze:\\n${text}`,
    })

    const textResponse = response.text
    
    if (!textResponse) {
      throw new Error('No response text received from AI model')
    }

    console.log('AI Response length:', textResponse.length)
    console.log('AI Response preview:', textResponse.substring(0, 200))

    const result = parseRobustJson(textResponse)
    
    // Cache the result
    analysisCache.set(cacheKey, result)
    console.log('Cached analysis result')
    
    return result
  } catch (error) {
    console.error('Error in analyzeLegalDocument:', error)
    throw error
  }
}

export async function analyzeBotCard(
  cardContent: string,
  temperature: number = 0.1, 
  topP: number = 0.8
): Promise<BotCardAnalysisResult> {
  // Check cache first
  const cacheKey = generateCacheKey(cardContent, BOT_CARD_REVIEW_PROMPT)
  if (botCardCache.has(cacheKey)) {
    console.log('Using cached bot card analysis result')
    return botCardCache.get(cacheKey)!
  }

  try {
    console.log('Making new AI API call for bot card analysis...')
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `${BOT_CARD_REVIEW_PROMPT}\\n\\nBot Card Content to analyze:\\n${cardContent}`,
    })

    const textResponse = response.text
    
    if (!textResponse) {
      throw new Error('No response text received from AI model')
    }

    console.log('AI Response length:', textResponse.length)
    console.log('AI Response preview:', textResponse.substring(0, 200))

    const result = parseBotCardJson(textResponse)
    
    // Cache the result
    botCardCache.set(cacheKey, result)
    console.log('Cached bot card analysis result')
    
    return result
  } catch (error) {
    console.error('Error in analyzeBotCard:', error)
    throw error
  }
} 