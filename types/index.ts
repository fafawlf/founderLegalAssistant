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
  const severityMap: Record<SeverityLevel, Comment['severity']> = {
    'Must Change': 'high',
    'Recommend to Change': 'medium',
    'Negotiable': 'low'
  }

  // Calculate start and end positions using context-based matching
  const { start, end } = findTextPosition(legalComment, fullText)

  const marketStandardText = legalComment.market_standard 
    ? `\n\nIs this market standard: ${legalComment.market_standard.is_standard}\n${legalComment.market_standard.reasoning}`
    : ''

  return {
    id: legalComment.comment_id,
    text: `${legalComment.comment_title}\n\n${legalComment.comment_details}\n\nRecommendation: ${legalComment.recommendation}${marketStandardText}`,
    author: 'AI Legal Assistant',
    start,
    end,
    severity: severityMap[legalComment.severity]
  }
}

// Helper function to find text position using context matching
function findTextPosition(comment: LegalComment, fullText: string): { start: number, end: number } {
  const { context_before, original_text, context_after } = comment
  
  console.log('Finding position for comment:', comment.comment_id)
  console.log('Context before:', JSON.stringify(context_before))
  console.log('Original text:', JSON.stringify(original_text))
  console.log('Context after:', JSON.stringify(context_after))
  
  // Normalize whitespace for better matching
  const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim()
  const normalizedFullText = normalizeText(fullText)
  
  // Try different search strategies in order of reliability
  
  // Strategy 1: Full context match (most reliable)
  if (context_before && context_after) {
    const fullPattern = `${context_before}${original_text}${context_after}`
    const normalizedPattern = normalizeText(fullPattern)
    
    let fullMatch = fullText.indexOf(fullPattern)
    if (fullMatch === -1) {
      // Try with normalized whitespace
      fullMatch = normalizedFullText.indexOf(normalizedPattern)
      if (fullMatch !== -1) {
        // Convert back to original text position
        const beforeNormalized = normalizeText(context_before)
        const beforeMatch = normalizedFullText.indexOf(beforeNormalized)
        if (beforeMatch !== -1) {
          fullMatch = beforeMatch
        }
      }
    }
    
    if (fullMatch !== -1) {
      const start = fullMatch + context_before.length
      console.log('✅ Full context match found at position:', start)
      return { start, end: start + original_text.length }
    }
  }
  
  // Strategy 2: Before context + original text
  if (context_before) {
    const beforePattern = `${context_before}${original_text}`
    let beforeMatch = fullText.indexOf(beforePattern)
    
    if (beforeMatch === -1) {
      // Try with normalized whitespace
      const normalizedPattern = normalizeText(beforePattern)
      beforeMatch = normalizedFullText.indexOf(normalizedPattern)
    }
    
    if (beforeMatch !== -1) {
      const start = beforeMatch + context_before.length
      console.log('✅ Before context match found at position:', start)
      return { start, end: start + original_text.length }
    }
  }
  
  // Strategy 3: Original text + after context
  if (context_after) {
    const afterPattern = `${original_text}${context_after}`
    let afterMatch = fullText.indexOf(afterPattern)
    
    if (afterMatch === -1) {
      // Try with normalized whitespace
      const normalizedPattern = normalizeText(afterPattern)
      afterMatch = normalizedFullText.indexOf(normalizedPattern)
    }
    
    if (afterMatch !== -1) {
      console.log('✅ After context match found at position:', afterMatch)
      return { start: afterMatch, end: afterMatch + original_text.length }
    }
  }
  
  // Strategy 4: Exact text match (fallback)
  let exactMatch = fullText.indexOf(original_text)
  if (exactMatch === -1) {
    // Try with normalized whitespace
    const normalizedOriginal = normalizeText(original_text)
    exactMatch = normalizedFullText.indexOf(normalizedOriginal)
  }
  
  if (exactMatch !== -1) {
    console.log('✅ Exact text match found at position:', exactMatch)
    return { start: exactMatch, end: exactMatch + original_text.length }
  }
  
  // Strategy 5: Fuzzy matching for similar text
  const words = original_text.trim().split(/\s+/)
  if (words.length > 2) {
    // Try to find a substring with most of the words
    const firstHalf = words.slice(0, Math.ceil(words.length / 2)).join(' ')
    const secondHalf = words.slice(Math.floor(words.length / 2)).join(' ')
    
    let fuzzyMatch = fullText.indexOf(firstHalf)
    if (fuzzyMatch === -1) {
      fuzzyMatch = fullText.indexOf(secondHalf)
    }
    
    if (fuzzyMatch !== -1) {
      console.log('✅ Fuzzy match found at position:', fuzzyMatch)
      return { start: fuzzyMatch, end: fuzzyMatch + original_text.length }
    }
  }
  
  // Strategy 6: Word-by-word search (last resort)
  const firstWord = words[0]
  if (firstWord && firstWord.length > 3) {
    const wordMatch = fullText.indexOf(firstWord)
    if (wordMatch !== -1) {
      console.log('✅ First word match found at position:', wordMatch)
      return { start: wordMatch, end: wordMatch + original_text.length }
    }
  }
  
  // If all else fails, distribute comments evenly instead of position 0
  console.warn('❌ Could not find text position for comment:', comment.comment_id)
  console.warn('Falling back to distributed positioning')
  
  // Use a hash of the comment ID to create consistent but distributed positioning
  const hash = comment.comment_id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  const fallbackPosition = Math.abs(hash) % Math.max(1, Math.floor(fullText.length / 4))
  
  return { start: fallbackPosition, end: fallbackPosition + original_text.length }
} 