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
      console.log('Comments XML preview:', commentsXml.substring(0, 500))
      
             // Parse the XML properly
       const commentMatches = commentsXml.match(/<w:comment[^>]*>[\s\S]*?<\/w:comment>/g)
       if (commentMatches) {
         commentMatches.forEach((commentXml: string, index: number) => {
          try {
            // Extract author
            const authorMatch = commentXml.match(/w:author="([^"]*)"/)
            const author = authorMatch ? authorMatch[1] : `Commenter ${index + 1}`
            
            // Extract date
            const dateMatch = commentXml.match(/w:date="([^"]*)"/)
            const date = dateMatch ? dateMatch[1] : new Date().toISOString()
            
            // Extract initials as fallback author
            const initialsMatch = commentXml.match(/w:initials="([^"]*)"/)
            const finalAuthor = author || (initialsMatch ? initialsMatch[1] : `Commenter ${index + 1}`)
            
            // Extract text content properly
            const textElements = commentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
            let commentText = ''
            if (textElements) {
              commentText = textElements
                .map((element: string) => {
                  const textMatch = element.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
                  return textMatch ? textMatch[1] : ''
                })
                .filter((text: string) => text.trim().length > 0)
                .join(' ')
                .trim()
            }
            
            if (commentText && commentText.length > 0 && !commentText.includes('')) {
              console.log(`Extracted clean comment by ${finalAuthor}: ${commentText.substring(0, 100)}...`)
              
              comments.push({
                id: `word-comment-${comments.length + 1}`,
                text: cleanCommentText(commentText),
                author: finalAuthor,
                date: formatDate(date),
                position: { start: 0, end: 0 },
                type: 'word-comment'
              })
            }
          } catch (parseError) {
            console.error('Error parsing individual comment:', parseError)
          }
        })
      }
    }
    
    // If no comments found in comments.xml, try alternative approach with document.xml
    if (comments.length === 0) {
      console.log('No comments in comments.xml, trying document.xml approach...')
      
      const documentFile = zip.file('word/document.xml')
      if (documentFile) {
        const documentXml = await documentFile.async('string')
        
        // Look for comment reference ranges in the document
        const commentRefs = documentXml.match(/<w:commentRangeStart[^>]*w:id="([^"]*)"[^>]*>/g)
        if (commentRefs && commentsFile) {
          const commentsXml = await commentsFile.async('string')
          
          commentRefs.forEach((ref: string, index: number) => {
            const idMatch = ref.match(/w:id="([^"]*)"/)
            if (idMatch) {
              const commentId = idMatch[1]
              
              // Find the corresponding comment in comments.xml
              const commentPattern = new RegExp(`<w:comment[^>]*w:id="${commentId}"[^>]*>([\\s\\S]*?)<\\/w:comment>`, 'g')
              const commentMatch = commentPattern.exec(commentsXml)
              
              if (commentMatch) {
                const commentContent = commentMatch[0]
                const authorMatch = commentContent.match(/w:author="([^"]*)"/)
                const dateMatch = commentContent.match(/w:date="([^"]*)"/)
                
                const author = authorMatch ? authorMatch[1] : `Commenter ${index + 1}`
                const date = dateMatch ? dateMatch[1] : new Date().toISOString()
                
                // Extract clean text
                const textElements = commentMatch[1].match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
                let commentText = ''
                if (textElements) {
                  commentText = textElements
                    .map((element: string) => {
                      const textMatch = element.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
                      return textMatch ? textMatch[1] : ''
                    })
                    .filter((text: string) => text.trim().length > 0)
                    .join(' ')
                    .trim()
                }
                
                if (commentText && commentText.length > 0 && !commentText.includes('')) {
                  console.log(`Extracted referenced comment by ${author}: ${commentText.substring(0, 100)}...`)
                  
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
    
    // If still no comments found, try mammoth's comment extraction as fallback
    if (comments.length === 0) {
      console.log('No comments found in XML files, trying mammoth extraction...')
      try {
        const mammothBuffer = Buffer.from(buffer)
        const result = await mammoth.convertToHtml({ buffer: mammothBuffer })
        
        // Look for any comment-like patterns in the converted text
        const htmlText = result.value
        if (htmlText.includes('comment') || htmlText.includes('Comment')) {
          console.log('Found potential comments in mammoth output, but extraction method needs improvement')
          // For now, we'll rely on the XML-based extraction above
        }
      } catch (mammothError) {
        console.error('Mammoth fallback failed:', mammothError)
      }
    }
    
    if (comments.length > 0) {
      console.log(`Successfully extracted ${comments.length} clean Word comments:`)
      comments.forEach((comment, idx) => {
        console.log(`  ${idx + 1}. Author: ${comment.author}, Text: ${comment.text.substring(0, 100)}...`)
      })
    } else {
      console.log('No readable Word comments found')
    }
    
    return comments.slice(0, 10) // Limit to first 10 comments
    
  } catch (error) {
    console.error('Error extracting Word comments:', error)
    
    // Final fallback: try the old method but with better text cleaning
    try {
      const uint8Array = new Uint8Array(buffer)
      const decoder = new TextDecoder('utf-8', { fatal: false })
      const content = decoder.decode(uint8Array)
      
      // Look for readable text patterns that might be comments
      const readablePatterns = [
        /(?:Lifan\s+Wang|Wang,?\s+Lifan|Coronado,?\s+Andre|Andre\s+Coronado)[\s:]+([A-Za-z\s,.\-!?]{10,200})/gi,
        /Comment[\s:]+([A-Za-z\s,.\-!?]{10,200})/gi
      ]
      
      for (const pattern of readablePatterns) {
        let match
        while ((match = pattern.exec(content)) !== null && comments.length < 5) {
          const text = match[1]?.trim()
          if (text && !text.includes('') && text.length > 10) {
            comments.push({
              id: `word-comment-${comments.length + 1}`,
              text: cleanCommentText(text),
              author: match[0].includes('Lifan') ? 'Lifan Wang' : 
                      match[0].includes('Coronado') ? 'Coronado, Andre' : 'Unknown Author',
              date: new Date().toISOString(),
              position: { start: 0, end: 0 },
              type: 'word-comment'
            })
          }
        }
      }
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError)
    }
    
    return comments
  }
}

function cleanCommentText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML/XML tags
    .replace(/&[a-z]+;/gi, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remove control characters but keep unicode
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