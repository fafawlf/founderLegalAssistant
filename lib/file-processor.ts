import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import type { FileUploadResponse } from '@/types'

export async function processFile(file: File): Promise<FileUploadResponse> {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    const fileType = file.type
    let text = ''

    if (fileType === 'application/pdf') {
      text = await processPDF(file)
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileType === 'application/msword') {
      text = await processDOCX(file)
    } else {
      return { success: false, error: 'Unsupported file type. Please upload a PDF or Word document.' }
    }

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
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
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