import { GoogleGenAI } from '@google/genai'
import type { AnalysisResult, LegalComment, BotCardAnalysisResult, BotCardAnalysisSummary, BotCardQuantitativeResult } from '@/types'

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

function parseBotCardQuantitativeJson(textResponse: string): BotCardQuantitativeResult {
  console.log('Attempting to parse bot card quantitative JSON, length:', textResponse.length)
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
    
    // 验证并重新计算final score以确保正确性
    const scores = result.quantitative_scores.sections
    const adjustments = result.quantitative_scores.adjustments
    
    // 确保title和description分数不超过5分
    if (scores.title_and_description.title.score > 5) {
      scores.title_and_description.title.score = 5
    }
    if (scores.title_and_description.description.score > 5) {
      scores.title_and_description.description.score = 5
    }
    
    // 重新计算final score
    const calculatedFinalScore = 
      (scores.title_and_description.title.score + scores.title_and_description.description.score) +
      (scores.welcome_message.character_world_building.score + scores.welcome_message.hook_and_attraction.score + scores.welcome_message.guidance.score) +
      (scores.bot_prompt.character_story_arc.score + scores.bot_prompt.setting_consistency.score + scores.bot_prompt.long_term_potential.score) +
      (scores.interaction_test_prediction.character_stability.score + scores.interaction_test_prediction.plot_driving_force.score + scores.interaction_test_prediction.emotional_resonance.score) +
      adjustments.originality_bonus.score - adjustments.technical_deduction.score
    
    // 确保final score在合理范围内 (0-100)
    result.quantitative_scores.final_score = Math.max(0, Math.min(100, calculatedFinalScore))
    
    console.log('Successfully parsed bot card quantitative JSON')
    console.log('Recalculated final score:', result.quantitative_scores.final_score)
    return result
  } catch (error) {
    console.log('Bot card quantitative JSON parse error:', error)
    
    // 返回fallback结果
    return {
      card_id: `fallback-${Date.now()}`,
      quantitative_scores: {
        sections: {
          title_and_description: {
            title: { score: 5, comment: 'Unable to evaluate due to technical issues.' },
            description: { score: 5, comment: 'Unable to evaluate due to technical issues.' }
          },
          welcome_message: {
            character_world_building: { score: 5, comment: 'Unable to evaluate due to technical issues.' },
            hook_and_attraction: { score: 5, comment: 'Unable to evaluate due to technical issues.' },
            guidance: { score: 5, comment: 'Unable to evaluate due to technical issues.' }
          },
          bot_prompt: {
            character_story_arc: { score: 5, comment: 'Unable to evaluate due to technical issues.' },
            setting_consistency: { score: 5, comment: 'Unable to evaluate due to technical issues.' },
            long_term_potential: { score: 5, comment: 'Unable to evaluate due to technical issues.' }
          },
          interaction_test_prediction: {
            character_stability: { score: 5, comment: 'Unable to evaluate due to technical issues.' },
            plot_driving_force: { score: 5, comment: 'Unable to evaluate due to technical issues.' },
            emotional_resonance: { score: 5, comment: 'Unable to evaluate due to technical issues.' }
          }
        },
        adjustments: {
          originality_bonus: { score: 0, comment: 'Unable to evaluate due to technical issues.' },
          technical_deduction: { score: 0, comment: 'Unable to evaluate due to technical issues.' }
        },
        final_score: 50
      }
    }
  }
}

const BOT_CARD_QUANTITATIVE_PROMPT = `### 角色与任务 (Role & Task)
你是一名精确的AI内容量化评估员。你的唯一任务是依据下方提供的【角色卡原始数据】和完整的【深度分析报告】，将其中的质性分析结果，精准地转换为一套量化的分数。

### 操作指南 (Instructions)
1.  **核心依据：** 你的所有评分都必须严格基于【深度分析报告】中的 \`analysis_summary\` 和 \`locatable_comments\`。这份报告是唯一的评分标准。
2.  **分数转换：**
    * 阅读\`analysis_summary\`中的所有宏观评价，形成对各项指标的初步分数判断。
    * 阅读\`locatable_comments\`中的具体点评，对分数进行微调。例如：
        * 一条关于Welcome Message的"内容优点"点评，应该为\`welcome_message\`的子项目加分。
        * 一条"LLM问题"的点评，应该在\`adjustments.technical_deduction\`中体现为扣分。
        * \`narrative_potential_and_originality\`的评价，直接影响\`long_term_potential\`和\`originality_bonus\`的分数。
3.  **完成评分表：** 依次填写\`quantitative_scores\`中的所有子项分数和简短评语（comment）。评语应用一句话说明该分数的主要依据。

### 评分标准与权重
**分数范围：** 0-10分
- 8-10分：优秀
- 6-7分：良好  
- 4-5分：一般
- 2-3分：较差
- 0-1分：很差

**重要：title和description各自最高只能得5分，不能超过5分！**

**Final Score计算方法：**
final_score = (title×0.5 + description×0.5) + (character_world_building + hook_and_attraction + guidance) + (character_story_arc + setting_consistency + long_term_potential) + (character_stability + plot_driving_force + emotional_resonance) + originality_bonus - technical_deduction

**权重说明：**
- Title & Description：共占10分 (title最高5分 + description最高5分)
- Welcome Message：共占30分 (三个维度各10分)
- Bot Prompt：共占30分 (三个维度各10分)  
- Interaction Prediction：共占30分 (三个维度各10分)
- 调整项：originality_bonus (0-10分), technical_deduction (0-10分)
- **总分范围：0-100分**

### 输出要求 (Output Requirement)
你的输出必须是且只能是一个JSON对象，该对象只包含\`card_id\`和\`quantitative_scores\`。不要输出任何其他分析性文本。

### 输出JSON结构 (Output JSON Structure)
{
  "card_id": "string_placeholder_for_card_id",
  "quantitative_scores": {
    "sections": {
        "title_and_description": { "title": { "score": "integer (0-5)", "comment": "string" }, "description": { "score": "integer (0-5)", "comment": "string" } },
        "welcome_message": { "character_world_building": { "score": "integer", "comment": "string" }, "hook_and_attraction": { "score": "integer", "comment": "string" }, "guidance": { "score": "integer", "comment": "string" } },
        "bot_prompt": { "character_story_arc": { "score": "integer", "comment": "string" }, "setting_consistency": { "score": "integer", "comment": "string" }, "long_term_potential": { "score": "integer", "comment": "string" } },
        "interaction_test_prediction": { "character_stability": { "score": "integer", "comment": "string" }, "plot_driving_force": { "score": "integer", "comment": "string" }, "emotional_resonance": { "score": "integer", "comment": "string" } }
    },
    "adjustments": {
        "originality_bonus": { "score": "integer", "comment": "string" },
        "technical_deduction": { "score": "integer", "comment": "string" }
    },
    "final_score": "integer"
  }
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
    
    // Add retry logic for better reliability
    let response
    let textResponse
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: `${BOT_CARD_REVIEW_PROMPT}\\n\\nBot Card Content to analyze:\\n${cardContent}`,
        })

        textResponse = response.text
        
        if (textResponse && textResponse.trim().length > 0) {
          break // Success, exit retry loop
        }
        
        throw new Error('Empty response received')
      } catch (error) {
        retryCount++
        console.log(`Bot card analysis attempt ${retryCount} failed:`, error)
        
        if (retryCount >= maxRetries) {
          throw error
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)))
      }
    }
    
    if (!textResponse) {
      throw new Error('No response text received from AI model after retries')
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

export async function quantifyBotCard(
  originalContent: string,
  analysisResult: BotCardAnalysisResult,
  temperature: number = 0.1, 
  topP: number = 0.8
): Promise<BotCardQuantitativeResult> {
  try {
    console.log('Making new AI API call for bot card quantification...')
    
    const inputData = `【角色卡原始数据】
${originalContent}

【深度分析报告】
${JSON.stringify(analysisResult, null, 2)}`

    // Add retry logic for better reliability
    let response
    let textResponse
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: `${BOT_CARD_QUANTITATIVE_PROMPT}\\n\\n${inputData}`,
        })

        textResponse = response.text
        
        if (textResponse && textResponse.trim().length > 0) {
          break // Success, exit retry loop
        }
        
        throw new Error('Empty response received')
      } catch (error) {
        retryCount++
        console.log(`Bot card quantification attempt ${retryCount} failed:`, error)
        
        if (retryCount >= maxRetries) {
          throw error
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)))
      }
    }
    
    if (!textResponse) {
      throw new Error('No response text received from AI model after retries')
    }

    console.log('AI Response length:', textResponse.length)
    console.log('AI Response preview:', textResponse.substring(0, 200))

    const result = parseBotCardQuantitativeJson(textResponse)
    
    return result
  } catch (error) {
    console.error('Error in quantifyBotCard:', error)
    throw error
  }
} 