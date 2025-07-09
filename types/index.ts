export interface LegalComment {
  comment_id: string
  original_text: string
  start_char_index: number
  end_char_index: number
  severity: 'Must Change' | 'Recommend to Change' | 'Negotiable'
  comment_title: string
  comment_details: string
  recommendation: string
}

export interface AnalysisResult {
  document_id: string
  analysis_summary: string
  comments: LegalComment[]
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