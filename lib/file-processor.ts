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
    const zip = await JSZip.loadAsync(buffer)
    console.log('Extracting Word comments with position information...')
    
    // Get both document.xml and comments.xml
    const documentFile = zip.file('word/document.xml')
    const commentsFile = zip.file('word/comments.xml')
    
    if (!documentFile || !commentsFile) {
      console.log('Missing required Word document files for comment extraction')
      return comments
    }
    
    const documentXml = await documentFile.async('string')
    const commentsXml = await commentsFile.async('string')
    
    console.log('Document XML length:', documentXml.length)
    console.log('Comments XML length:', commentsXml.length)
    
    // Extract all comments from comments.xml first
    const commentData: Record<string, { text: string; author: string; date: string }> = {}
    
    const commentMatches = commentsXml.match(/<w:comment[^>]*>[\s\S]*?<\/w:comment>/g)
    if (commentMatches) {
      console.log(`Found ${commentMatches.length} comment definitions`)
      
      commentMatches.forEach((commentXml: string) => {
        try {
          // Extract comment ID
          const idMatch = commentXml.match(/w:id="([^"]*)"/)
          if (!idMatch) return
          
          const commentId = idMatch[1]
          
          // Extract author
          const authorMatch = commentXml.match(/w:author="([^"]*)"/)
          const author = authorMatch ? authorMatch[1] : 'Unknown'
          
          // Extract date
          const dateMatch = commentXml.match(/w:date="([^"]*)"/)
          const date = dateMatch ? dateMatch[1] : new Date().toISOString()
          
          // Extract text content
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
          
          // Only store valid, readable comments
          if (commentText && 
              commentText.length > 0 && 
              commentText.length < 1000 &&
              !containsCorruptedText(commentText) &&
              isReadableText(commentText)) {
            
            commentData[commentId] = {
              text: cleanCommentText(commentText),
              author: author,
              date: date
            }
            
            console.log(`Stored comment ${commentId} by ${author}: ${commentText.substring(0, 50)}...`)
          }
        } catch (error) {
          console.error('Error parsing comment definition:', error)
        }
      })
    }
    
    // Now find comment positions in document.xml
    const commentPositions = findCommentPositions(documentXml)
    console.log(`Found ${Object.keys(commentPositions).length} comment positions`)
    
    // Combine comment data with positions
    Object.entries(commentData).forEach(([commentId, data]) => {
      const position = commentPositions[commentId]
      if (position) {
        console.log(`Adding positioned comment ${commentId} at chars ${position.startChar}-${position.endChar}`)
        
        comments.push({
          id: `word-comment-${comments.length + 1}`,
          text: data.text,
          author: data.author,
          date: formatDate(data.date),
          position: { start: position.startChar, end: position.endChar },
          type: 'word-comment'
        })
      } else {
        // Fallback: add comment with estimated position
        console.log(`Adding comment ${commentId} with estimated position (no range markers found)`)
        
        const estimatedPosition = estimateCommentPosition(data.text, comments.length)
        comments.push({
          id: `word-comment-${comments.length + 1}`,
          text: data.text,
          author: data.author,
          date: formatDate(data.date),
          position: estimatedPosition,
          type: 'word-comment'
        })
      }
    })
    
    console.log(`Successfully extracted ${comments.length} positioned Word comments`)
    return comments.slice(0, 10) // Limit to first 10 comments
    
  } catch (error) {
    console.error('Error extracting Word comments:', error)
    return []
  }
}

function findCommentPositions(documentXml: string): Record<string, { startChar: number; endChar: number; commentedText: string }> {
  const positions: Record<string, { startChar: number; endChar: number; commentedText: string }> = {}
  
  try {
    // Extract all text content and build a character map
    const { textContent, charToXmlMap } = extractTextWithPositions(documentXml)
    console.log('Extracted text content length:', textContent.length)
    
    // Find all comment range markers
    const rangeStarts: RegExpExecArray[] = []
    const rangeEnds: RegExpExecArray[] = []
    
    let startMatch: RegExpExecArray | null
    const startRegex = /<w:commentRangeStart[^>]*w:id="([^"]*)"[^>]*>/g
    while ((startMatch = startRegex.exec(documentXml)) !== null) {
      rangeStarts.push(startMatch)
    }
    
    let endMatch: RegExpExecArray | null
    const endRegex = /<w:commentRangeEnd[^>]*w:id="([^"]*)"[^>]*>/g
    while ((endMatch = endRegex.exec(documentXml)) !== null) {
      rangeEnds.push(endMatch)
    }
    
    console.log(`Found ${rangeStarts.length} comment range starts and ${rangeEnds.length} comment range ends`)
    
    // Match starts with ends
    rangeStarts.forEach((startMatch) => {
      const commentId = startMatch[1]
      const startXmlPos = startMatch.index!
      
      // Find corresponding end marker
      const endMatch = rangeEnds.find(end => end[1] === commentId)
      if (!endMatch) {
        console.log(`No end marker found for comment ${commentId}`)
        return
      }
      
      const endXmlPos = endMatch.index!
      
      // Convert XML positions to text character positions
      const startChar = xmlPositionToTextPosition(startXmlPos, charToXmlMap)
      const endChar = xmlPositionToTextPosition(endXmlPos, charToXmlMap)
      
      if (startChar !== -1 && endChar !== -1 && endChar > startChar) {
        const commentedText = textContent.substring(startChar, endChar)
        positions[commentId] = {
          startChar,
          endChar,
          commentedText
        }
        
        console.log(`Comment ${commentId} positioned at ${startChar}-${endChar}: "${commentedText.substring(0, 50)}..."`)
      } else {
        console.log(`Invalid position calculation for comment ${commentId}: start=${startChar}, end=${endChar}`)
      }
    })
    
  } catch (error) {
    console.error('Error finding comment positions:', error)
  }
  
  return positions
}

function extractTextWithPositions(documentXml: string): { textContent: string; charToXmlMap: number[] } {
  let textContent = ''
  const charToXmlMap: number[] = []
  
  // Find all text elements and track their positions
  const textMatches: RegExpExecArray[] = []
  let textMatch: RegExpExecArray | null
  const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
  while ((textMatch = textRegex.exec(documentXml)) !== null) {
    textMatches.push(textMatch)
  }
  
  textMatches.forEach((match) => {
    const text = match[1]
    const xmlPosition = match.index!
    
    // Add text to content and map each character to its XML position
    for (let i = 0; i < text.length; i++) {
      textContent += text[i]
      charToXmlMap.push(xmlPosition + match[0].indexOf(text) + i)
    }
    
    // Add space between text elements (Word behavior)
    if (text.length > 0) {
      textContent += ' '
      charToXmlMap.push(xmlPosition + match[0].length)
    }
  })
  
  return { textContent, charToXmlMap }
}

function xmlPositionToTextPosition(xmlPos: number, charToXmlMap: number[]): number {
  // Find the closest text character position for the given XML position
  let closestIndex = -1
  let minDistance = Infinity
  
  for (let i = 0; i < charToXmlMap.length; i++) {
    const distance = Math.abs(charToXmlMap[i] - xmlPos)
    if (distance < minDistance) {
      minDistance = distance
      closestIndex = i
    }
  }
  
  return closestIndex
}

function estimateCommentPosition(commentText: string, commentIndex: number): { start: number; end: number } {
  // Fallback: distribute comments evenly throughout a typical document
  const estimatedDocLength = 50000 // Assume average document length
  const spacing = estimatedDocLength / 10 // Distribute across document
  const position = commentIndex * spacing
  
  return {
    start: Math.floor(position),
    end: Math.floor(position) + Math.min(commentText.length, 100)
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