import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import type { FileUploadResponse } from '@/types'

export async function processFile(file: File): Promise<FileUploadResponse> {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    const fileType = file.type
    console.log('Processing file type:', fileType)
    let text = ''

    if (fileType === 'application/pdf') {
      console.log('Processing as PDF')
      text = await processPDF(file)
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileType === 'application/msword') {
      console.log('Processing as Word document')
      text = await processDOCX(file)
    } else {
      console.log('Unsupported file type:', fileType)
      return { success: false, error: 'Unsupported file type. Please upload a PDF or Word document.' }
    }

    console.log('Extracted text length:', text.length)
    console.log('Text preview:', text.substring(0, 200))

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Could not extract text from the file. Please ensure the file contains readable text.' }
    }

    return { success: true, text: text.trim() }
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

async function processDOCX(file: File): Promise<string> {
  try {
    console.log('Starting DOCX processing...')
    const arrayBuffer = await file.arrayBuffer()
    console.log('ArrayBuffer size:', arrayBuffer.byteLength)
    
    // Convert ArrayBuffer to Buffer for mammoth
    const buffer = Buffer.from(arrayBuffer)
    console.log('Buffer size:', buffer.length)
    
    const result = await mammoth.extractRawText({ buffer })
    console.log('Mammoth result:', {
      textLength: result.value.length,
      hasMessages: result.messages.length > 0,
      messages: result.messages
    })
    
    return result.value
  } catch (error) {
    console.error('Error processing DOCX:', error)
    throw new Error('Failed to extract text from Word document. The file might be corrupted.')
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