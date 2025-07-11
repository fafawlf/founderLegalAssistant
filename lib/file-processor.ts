import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import JSZip from 'jszip'
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
      wordComments = result.wordComments
    } else {
      return { success: false, error: 'Unsupported file type. Please upload a PDF or Word document.' }
    }

    if (!text.trim()) {
      return { success: false, error: 'No text content found in the file' }
    }

    console.log('File processed successfully, text length:', text.length)
    console.log('Word comments found:', wordComments.length)
    console.log('Word comments:', wordComments)

    return {
      success: true,
      text,
      wordComments: wordComments.length > 0 ? wordComments : undefined
    }
  } catch (error) {
    console.error('Error processing file:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

async function processPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const data = await pdf(buffer)
  return data.text
}

async function processDOCX(file: File): Promise<{ text: string; wordComments: WordComment[] }> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  try {
    // Convert to HTML to get the main text with better formatting preservation
    const htmlResult = await mammoth.convertToHtml({ 
      buffer
    })
    
    // Convert HTML to text while preserving line breaks
    let text = htmlResult.value
      .replace(/<p[^>]*>/g, '\n') // Convert paragraph tags to line breaks
      .replace(/<\/p>/g, '\n') // End paragraphs with line breaks
      .replace(/<br[^>]*>/g, '\n') // Convert br tags to line breaks
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces
      .replace(/&amp;/g, '&') // Convert HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks to max 2
      .trim()
    
    console.log('Extracted text length:', text.length)
    console.log('Text preview with line breaks:', text.substring(0, 500))
    
    // Try to extract comments from the buffer directly using comprehensive methods
    const wordComments = await extractWordCommentsComprehensive(arrayBuffer)
    
    return { text, wordComments }
  } catch (error) {
    console.error('Error processing DOCX:', error)
    return { text: '', wordComments: [] }
  }
}

async function extractWordCommentsComprehensive(buffer: ArrayBuffer): Promise<WordComment[]> {
  const comments: WordComment[] = []
  
  try {
    // Try to use JSZip to properly extract and parse the Word document structure
    const zip = await JSZip.loadAsync(buffer)
    
    console.log('Looking for Word document comment files...')
    
    // Check if comments.xml exists in the Word document
    const commentsFile = zip.file('word/comments.xml')
    if (commentsFile) {
      console.log('Found word/comments.xml, extracting structured comments...')
      const commentsXml = await commentsFile.async('string')
      console.log('Comments XML length:', commentsXml.length)
      
      // Parse the XML more carefully to avoid corrupted text
      const commentMatches = commentsXml.match(/<w:comment[^>]*>[\s\S]*?<\/w:comment>/g)
      if (commentMatches) {
        console.log(`Found ${commentMatches.length} comment elements`)
        
        commentMatches.forEach((commentXml: string, index: number) => {
          try {
            // Extract author
            const authorMatch = commentXml.match(/w:author="([^"]*)"/)
            let author = authorMatch ? authorMatch[1] : ''
            
            // Extract initials as fallback
            const initialsMatch = commentXml.match(/w:initials="([^"]*)"/)
            if (!author && initialsMatch) {
              author = initialsMatch[1]
            }
            
            // Extract date
            const dateMatch = commentXml.match(/w:date="([^"]*)"/)
            const date = dateMatch ? dateMatch[1] : new Date().toISOString()
            
            // Extract text content more carefully
            const textElements = commentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
            let commentText = ''
            
            if (textElements) {
              const textParts = textElements
                .map((element: string) => {
                  const textMatch = element.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
                  return textMatch ? textMatch[1] : ''
                })
                .filter((text: string) => text.trim().length > 0)
              
              commentText = textParts.join(' ').trim()
            }
            
            // Only add comments with valid, readable text
            if (commentText && 
                commentText.length > 0 && 
                commentText.length < 1000 && // Reasonable length limit
                !containsCorruptedText(commentText) &&
                isReadableText(commentText)) {
              
              console.log(`Adding clean comment by ${author || 'Unknown'}: ${commentText.substring(0, 100)}...`)
              
              comments.push({
                id: `word-comment-${comments.length + 1}`,
                text: cleanCommentText(commentText),
                author: author || `Commenter ${index + 1}`,
                date: formatDate(date),
                position: { start: 0, end: 0 },
                type: 'word-comment'
              })
            } else {
              console.log(`Skipping corrupted/invalid comment: ${commentText.substring(0, 50)}...`)
            }
          } catch (parseError) {
            console.error('Error parsing individual comment:', parseError)
          }
        })
      }
    }
    
    // If no valid comments found, try alternative extraction methods
    if (comments.length === 0) {
      console.log('No valid comments found in XML, trying alternative methods...')
      
      // Try to find comments in document.xml with better filtering
      const documentFile = zip.file('word/document.xml')
      if (documentFile && commentsFile) {
        const documentXml = await documentFile.async('string')
        const commentsXml = await commentsFile.async('string')
        
        // Look for comment references and match them with actual comments
        const commentRefs = documentXml.match(/<w:commentRangeStart[^>]*w:id="([^"]*)"[^>]*>/g)
        if (commentRefs) {
          commentRefs.forEach((ref: string, index: number) => {
            const idMatch = ref.match(/w:id="([^"]*)"/)
            if (idMatch) {
              const commentId = idMatch[1]
              
              // Find the corresponding comment
              const commentPattern = new RegExp(`<w:comment[^>]*w:id="${commentId}"[^>]*>([\\s\\S]*?)<\\/w:comment>`, 'g')
              const commentMatch = commentPattern.exec(commentsXml)
              
              if (commentMatch) {
                const commentContent = commentMatch[0]
                const authorMatch = commentContent.match(/w:author="([^"]*)"/)
                const dateMatch = commentContent.match(/w:date="([^"]*)"/)
                
                const author = authorMatch ? authorMatch[1] : `Commenter ${index + 1}`
                const date = dateMatch ? dateMatch[1] : new Date().toISOString()
                
                // Extract text more carefully
                const textElements = commentMatch[1].match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
                let commentText = ''
                
                if (textElements) {
                  const textParts = textElements
                    .map((element: string) => {
                      const textMatch = element.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
                      return textMatch ? textMatch[1] : ''
                    })
                    .filter((text: string) => text.trim().length > 0)
                  
                  commentText = textParts.join(' ').trim()
                }
                
                if (commentText && 
                    !containsCorruptedText(commentText) &&
                    isReadableText(commentText)) {
                  
                  console.log(`Adding referenced comment by ${author}: ${commentText.substring(0, 100)}...`)
                  
                  comments.push({
                    id: `word-comment-${comments.length + 1}`,
                    text: cleanCommentText(commentText),
                    author: author,
                    date: formatDate(date),
                    position: { start: 0, end: 0 },
                    type: 'word-comment'
                  })
                }
              }
            }
          })
        }
      }
    }
    
    if (comments.length > 0) {
      console.log(`Successfully extracted ${comments.length} clean Word comments`)
    } else {
      console.log('No readable Word comments found in document')
    }
    
    return comments.slice(0, 10) // Limit to first 10 comments
    
  } catch (error) {
    console.error('Error extracting Word comments:', error)
    return []
  }
}

function containsCorruptedText(text: string): boolean {
  // Check for signs of corrupted/binary text
  const corruptionIndicators = [
    /[^\x20-\x7E\u00A0-\uFFFF]/g, // Non-printable characters
    /[\x00-\x1F\x7F-\x9F]/g, // Control characters
    /�/g, // Replacement characters
    /\ufffd/g, // Unicode replacement character
  ]
  
  return corruptionIndicators.some(pattern => pattern.test(text))
}

function isReadableText(text: string): boolean {
  if (!text || text.length < 3) return false
  
  // Check if text contains mostly readable characters
  const readableChars = text.match(/[a-zA-Z0-9\s.,!?;:()\-'"]/g) || []
  const readableRatio = readableChars.length / text.length
  
  return readableRatio > 0.7 // At least 70% readable characters
}

function cleanCommentText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML/XML tags
    .replace(/&[a-z]+;/gi, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remove non-printable characters
    .trim()
}

function formatDate(dateStr: string): string {
  try {
    // Try to parse various date formats
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return new Date().toISOString()
    }
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
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