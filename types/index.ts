export interface LegalComment {
  comment_id: string
  context_before: string
  original_text: string
  context_after: string
  severity: 'Must Change' | 'Recommend to Change' | 'Negotiable'
  comment_title: string
  comment_details: string
  recommendation: string
  market_standard: {
    is_standard: 'Yes' | 'No' | 'Partially'
    reasoning: string
  }
}

// Bot Card Comment interface
export interface BotCardComment {
  comment_id: string
  source_section: string
  context_before: string
  original_text: string
  context_after: string
  comment_type: 'Content Strength' | 'Content Issue' | 'LLM Issue'
  comment_title: string
  comment_details: string
  recommendation: string
}

// Bot Card Analysis Summary interface
export interface BotCardAnalysisSummary {
  overall_assessment: string
  target_audience_fit: string
  discoverability_and_packaging: string
  narrative_potential_and_originality: string
  key_strengths_summary: string
  key_weaknesses_summary: string
}

// Bot Card Analysis Result interface
export interface BotCardAnalysisResult {
  card_id: string
  analysis_summary: BotCardAnalysisSummary
  locatable_comments: BotCardComment[]
}

// Bot Card Quantitative Scores interfaces
export interface ScoreItem {
  score: number
  comment: string
}

export interface SectionScores {
  title_and_description: {
    title: ScoreItem
    description: ScoreItem
  }
  welcome_message: {
    character_world_building: ScoreItem
    hook_and_attraction: ScoreItem
    guidance: ScoreItem
  }
  bot_prompt: {
    character_story_arc: ScoreItem
    setting_consistency: ScoreItem
    long_term_potential: ScoreItem
  }
  interaction_test_prediction: {
    character_stability: ScoreItem
    plot_driving_force: ScoreItem
    emotional_resonance: ScoreItem
  }
}

export interface AdjustmentScores {
  originality_bonus: ScoreItem
  technical_deduction: ScoreItem
}

export interface QuantitativeScores {
  sections: SectionScores
  adjustments: AdjustmentScores
  final_score: number
}

export interface BotCardQuantitativeResult {
  card_id: string
  quantitative_scores: QuantitativeScores
}

// Comment interface for WordLikeEditor component
export interface Comment {
  id: string
  text: string
  author: string
  start: number
  end: number
  severity: 'low' | 'medium' | 'high'
}

// Word document comment interface
export interface WordComment {
  id: string
  text: string
  author: string
  date: string
  position: { start: number; end: number }
  type: 'word-comment'
}

export interface AnalysisResult {
  document_id: string
  analysis_summary: string
  comments: LegalComment[]
  original_text?: string // Add original text for WordLikeEditor
}

export interface FileUploadResponse {
  success: boolean
  text?: string
  error?: string
  wordComments?: WordComment[]
}

export interface AnalysisRequest {
  text: string
  documentType?: string
}

export interface SystemConfig {
  systemPrompt: string
  temperature: number
  topP: number
  model: string
}

export type SeverityLevel = 'Must Change' | 'Recommend to Change' | 'Negotiable'

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Utility function to convert LegalComment to Comment for WordLikeEditor
export function convertToWordLikeComment(legalComment: LegalComment, fullText: string): Comment {
  console.log('Converting LegalComment to WordLikeComment:', legalComment.comment_id)
  
  const severityMap: Record<SeverityLevel, Comment['severity']> = {
    'Must Change': 'high',
    'Recommend to Change': 'medium',
    'Negotiable': 'low'
  }

  // Calculate start and end positions using context-based matching
  const { start, end } = findTextPosition(legalComment, fullText)
  console.log(`Comment ${legalComment.comment_id} positioned at ${start}-${end}`)

  const marketStandardText = legalComment.market_standard 
    ? `\\n\\nIs this market standard: ${legalComment.market_standard.is_standard}\\n${legalComment.market_standard.reasoning}`
    : ''

  const result = {
    id: legalComment.comment_id,
    text: `${legalComment.comment_title}\\n\\n${legalComment.comment_details}\\n\\nRecommendation: ${legalComment.recommendation}${marketStandardText}`,
    author: 'AI Legal Advisor',
    start,
    end,
    severity: severityMap[legalComment.severity] || 'medium'
  }

  console.log('Converted comment:', result)
  return result
}

// Utility function to convert BotCardComment to Comment for WordLikeEditor
export function convertBotCardCommentToWordLike(botCardComment: BotCardComment, fullText: string): Comment {
  console.log('Converting BotCardComment to WordLikeComment:', botCardComment.comment_id)
  
  const severityMap: Record<BotCardComment['comment_type'], Comment['severity']> = {
    'Content Strength': 'low',
    'Content Issue': 'medium', 
    'LLM Issue': 'high'
  }

  // Calculate start and end positions using context-based matching
  const { start, end } = findBotCardTextPosition(botCardComment, fullText)
  console.log(`Bot Card Comment ${botCardComment.comment_id} positioned at ${start}-${end}`)

  const result = {
    id: botCardComment.comment_id,
    text: `[${botCardComment.source_section}] ${botCardComment.comment_title}\\n\\n${botCardComment.comment_details}\\n\\nRecommendation: ${botCardComment.recommendation}`,
    author: 'AI Content Editor',
    start,
    end,
    severity: severityMap[botCardComment.comment_type] || 'medium'
  }

  console.log('Converted bot card comment:', result)
  return result
}

// Helper function to find text position using context matching
function findTextPosition(comment: LegalComment, fullText: string): { start: number, end: number } {
  // Normalize whitespace for better matching
  const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim()
  
  const normalizedFullText = normalizeText(fullText)
  const normalizedOriginalText = normalizeText(comment.original_text)
  
  // Find the position of the original text
  const start = normalizedFullText.indexOf(normalizedOriginalText)
  
  if (start === -1) {
    console.warn(`Could not find text position for comment ${comment.comment_id}`)
    return { start: 0, end: Math.min(100, fullText.length) }
  }
  
  return { start, end: start + normalizedOriginalText.length }
}

// Helper function to find text position for bot card comments
function findBotCardTextPosition(comment: BotCardComment, fullText: string): { start: number, end: number } {
  // Normalize whitespace for better matching
  const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim()
  
  const normalizedFullText = normalizeText(fullText)
  const normalizedOriginalText = normalizeText(comment.original_text)
  
  // Find the position of the original text
  const start = normalizedFullText.indexOf(normalizedOriginalText)
  
  if (start === -1) {
    console.warn(`Could not find text position for bot card comment ${comment.comment_id}`)
    return { start: 0, end: Math.min(100, fullText.length) }
  }
  
  return { start, end: start + normalizedOriginalText.length }
} 