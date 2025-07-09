import { GoogleGenAI } from '@google/genai'
import type { AnalysisResult, LegalComment } from '@/types'

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || ''
})

const DEFAULT_SYSTEM_PROMPT = `You are a world-class lawyer from a top-tier Silicon Valley law firm, specializing in venture capital financing. You are assisting a startup founder who is not a legal expert. Your task is to review the provided legal document and identify potential risks and areas for negotiation.

Your response MUST be a single, valid JSON object. Do not add any text before or after the JSON object.

The JSON object must have the following structure:
{
  "document_id": "A unique identifier for the document",
  "analysis_summary": "A brief, 2-3 sentence summary of the overall document and its key risks.",
  "comments": [
    {
      "comment_id": "A unique identifier for the comment",
      "original_text": "The exact, verbatim text snippet from the document that this comment refers to.",
      "start_char_index": The starting character position of the snippet in the original full text.,
      "end_char_index": The ending character position of the snippet in the original full text.,
      "severity": "Categorize the issue into one of three levels: 'Must Change', 'Recommend to Change', or 'Negotiable'.",
      "comment_title": "A short, descriptive title for the issue (5-10 words).",
      "comment_details": "A detailed explanation of why this clause is a problem, written in simple, easy-to-understand language for a non-lawyer. Explain the potential negative impact on the founder or the company.",
      "recommendation": "Provide concrete, actionable advice. Suggest specific alternative wording or negotiation strategies. Clearly state what the founder should ask for."
    }
  ]
}

Analyze the following document:`

export async function analyzeLegalDocument(
  text: string,
  systemPrompt: string = DEFAULT_SYSTEM_PROMPT,
  temperature: number = 0.1,
  topP: number = 0.8
): Promise<AnalysisResult> {
  try {
    const prompt = `${systemPrompt}\n\n${text}`
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    })
    
    const textResponse = response.text || ''
    
    // Extract JSON from response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI model')
    }
    
    const analysisResult: AnalysisResult = JSON.parse(jsonMatch[0])
    
    // Validate the response structure
    if (!analysisResult.document_id || !analysisResult.comments || !Array.isArray(analysisResult.comments)) {
      throw new Error('Invalid response structure from AI model')
    }
    
    return analysisResult
  } catch (error) {
    console.error('Error analyzing legal document:', error)
    throw new Error('Failed to analyze document. Please try again.')
  }
}

export function validateAnalysisResult(result: any): result is AnalysisResult {
  return (
    typeof result === 'object' &&
    typeof result.document_id === 'string' &&
    typeof result.analysis_summary === 'string' &&
    Array.isArray(result.comments) &&
    result.comments.every((comment: any) => 
      typeof comment === 'object' &&
      typeof comment.comment_id === 'string' &&
      typeof comment.original_text === 'string' &&
      typeof comment.start_char_index === 'number' &&
      typeof comment.end_char_index === 'number' &&
      typeof comment.severity === 'string' &&
      typeof comment.comment_title === 'string' &&
      typeof comment.comment_details === 'string' &&
      typeof comment.recommendation === 'string'
    )
  )
} 