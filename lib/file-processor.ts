import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import type { FileUploadResponse, WordComment } from '@/types'

export async function processFile(file: File): Promise<FileUploadResponse> {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    const fileType = file.type
    console.log('Processing file type:', fileType)
    let text = ''
    let wordComments: WordComment[] = []

    if (fileType === 'application/pdf') {
      console.log('Processing as PDF')
      text = await processPDF(file)
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileType === 'application/msword') {
      console.log('Processing as Word document')
      const result = await processDOCX(file)
      text = result.text
      wordComments = result.comments
    } else {
      console.log('Unsupported file type:', fileType)
      return { success: false, error: 'Unsupported file type. Please upload a PDF or Word document.' }
    }

    console.log('Extracted text length:', text.length)
    console.log('Text preview:', text.substring(0, 200))
    console.log('Word comments found:', wordComments.length)

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Could not extract text from the file. Please ensure the file contains readable text.' }
    }

    return { 
      success: true, 
      text: text.trim(),
      wordComments: wordComments.length > 0 ? wordComments : undefined
    }
  } catch (error) {
    console.error('Error processing file:', error)
    return { success: false, error: 'Failed to process file. Please try again.' }
  }
}

async function processPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('Error processing PDF:', error)
    throw new Error('Failed to extract text from PDF. The file might be corrupted or password-protected.')
  }
}

async function processDOCX(file: File): Promise<{ text: string; comments: WordComment[] }> {
  try {
    console.log('Starting DOCX processing...')
    const arrayBuffer = await file.arrayBuffer()
    console.log('ArrayBuffer size:', arrayBuffer.byteLength)
    
    // Convert ArrayBuffer to Buffer for mammoth
    const buffer = Buffer.from(arrayBuffer)
    console.log('Buffer size:', buffer.length)
    
    // Extract text
    const textResult = await mammoth.extractRawText({ buffer })
    console.log('Mammoth text result:', {
      textLength: textResult.value.length,
      hasMessages: textResult.messages.length > 0,
      messages: textResult.messages
    })
    
    // Extract comments using mammoth's HTML conversion
    const htmlResult = await mammoth.convertToHtml({ buffer })
    
    console.log('Mammoth HTML result:', {
      htmlLength: htmlResult.value.length,
      hasMessages: htmlResult.messages.length > 0
    })
    
    // Extract comments from HTML
    const comments = extractCommentsFromHtml(htmlResult.value, textResult.value)
    console.log('Extracted comments:', comments.length)
    
    return {
      text: textResult.value,
      comments
    }
  } catch (error) {
    console.error('Error processing DOCX:', error)
    throw new Error('Failed to extract text from Word document. The file might be corrupted.')
  }
}

function extractCommentsFromHtml(html: string, plainText: string): WordComment[] {
  const comments: WordComment[] = []
  
  try {
    // Look for comment patterns in the HTML
    // Mammoth typically includes comments as spans or other elements
    const commentRegex = /<span[^>]*class="[^"]*comment[^"]*"[^>]*>(.*?)<\/span>/gi
    const commentMatches = Array.from(html.matchAll(commentRegex))
    
    let commentId = 1
    for (const match of commentMatches) {
      const commentText = match[1]
      if (commentText && commentText.trim()) {
        // Try to find the position in the plain text
        const position = findCommentPosition(commentText, plainText)
        
        comments.push({
          id: `word-comment-${commentId}`,
          text: commentText.replace(/<[^>]*>/g, '').trim(), // Remove HTML tags
          author: 'Word Comment',
          date: new Date().toISOString(),
          position: position || { start: 0, end: 0 },
          type: 'word-comment'
        })
        commentId++
      }
    }
    
    // Also look for other comment patterns
    const altCommentRegex = /\[Comment:\s*(.*?)\]/gi
    const altMatches = Array.from(plainText.matchAll(altCommentRegex))
    
    for (const match of altMatches) {
      const commentText = match[1]
      if (commentText && commentText.trim()) {
        const start = match.index || 0
        const end = start + match[0].length
        
        comments.push({
          id: `word-comment-${commentId}`,
          text: commentText.trim(),
          author: 'Word Comment',
          date: new Date().toISOString(),
          position: { start, end },
          type: 'word-comment'
        })
        commentId++
      }
    }
    
  } catch (error) {
    console.error('Error extracting comments from HTML:', error)
  }
  
  return comments
}

function findCommentPosition(commentText: string, plainText: string): { start: number; end: number } | null {
  // Try to find where this comment might be positioned in the text
  // This is a simplified approach - in reality, Word comments are more complex
  const searchText = commentText.substring(0, 50) // Use first 50 chars to search
  const index = plainText.indexOf(searchText)
  
  if (index !== -1) {
    return {
      start: index,
      end: index + searchText.length
    }
  }
  
  return null
}

export function preprocessText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function findTextPosition(fullText: string, searchText: string): { start: number; end: number } | null {
  const startIndex = fullText.indexOf(searchText)
  if (startIndex === -1) {
    return null
  }
  
  return {
    start: startIndex,
    end: startIndex + searchText.length
  }
} 