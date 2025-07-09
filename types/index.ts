export interface LegalComment {
  comment_id: string
  context_before: string
  original_text: string
  context_after: string
  severity: 'Must Change' | 'Recommend to Change' | 'Negotiable'
  comment_title: string
  comment_details: string
  recommendation: string
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
  const severityMap: Record<SeverityLevel, Comment['severity']> = {
    'Must Change': 'high',
    'Recommend to Change': 'medium',
    'Negotiable': 'low'
  }

  // Calculate start and end positions using context-based matching
  const { start, end } = findTextPosition(legalComment, fullText)

  return {
    id: legalComment.comment_id,
    text: `${legalComment.comment_title}\n\n${legalComment.comment_details}\n\nRecommendation: ${legalComment.recommendation}`,
    author: 'AI Legal Assistant',
    start,
    end,
    severity: severityMap[legalComment.severity]
  }
}

// Helper function to find text position using context matching
function findTextPosition(comment: LegalComment, fullText: string): { start: number, end: number } {
  const { context_before, original_text, context_after } = comment
  
  // Try different search strategies in order of reliability
  
  // Strategy 1: Full context match (most reliable)
  if (context_before && context_after) {
    const fullPattern = `${context_before}${original_text}${context_after}`
    const fullMatch = fullText.indexOf(fullPattern)
    if (fullMatch !== -1) {
      const start = fullMatch + context_before.length
      return { start, end: start + original_text.length }
    }
  }
  
  // Strategy 2: Before context + original text
  if (context_before) {
    const beforePattern = `${context_before}${original_text}`
    const beforeMatch = fullText.indexOf(beforePattern)
    if (beforeMatch !== -1) {
      const start = beforeMatch + context_before.length
      return { start, end: start + original_text.length }
    }
  }
  
  // Strategy 3: Original text + after context
  if (context_after) {
    const afterPattern = `${original_text}${context_after}`
    const afterMatch = fullText.indexOf(afterPattern)
    if (afterMatch !== -1) {
      return { start: afterMatch, end: afterMatch + original_text.length }
    }
  }
  
  // Strategy 4: Exact text match (fallback)
  const exactMatch = fullText.indexOf(original_text)
  if (exactMatch !== -1) {
    return { start: exactMatch, end: exactMatch + original_text.length }
  }
  
  // Strategy 5: Fuzzy matching for similar text (last resort)
  const words = original_text.trim().split(/\s+/)
  if (words.length > 1) {
    // Try to find a substring with most of the words
    const firstFew = words.slice(0, Math.ceil(words.length / 2)).join(' ')
    const fuzzyMatch = fullText.indexOf(firstFew)
    if (fuzzyMatch !== -1) {
      return { start: fuzzyMatch, end: fuzzyMatch + original_text.length }
    }
  }
  
  // If all else fails, return position 0 (shouldn't happen with good context)
  console.warn('Could not find text position for comment:', comment.comment_id)
  return { start: 0, end: original_text.length }
} 