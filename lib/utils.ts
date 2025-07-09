import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateCommentId(): string {
  return `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'Must Change':
      return 'text-severity-must bg-severity-must/10 border-severity-must'
    case 'Recommend to Change':
      return 'text-severity-recommend bg-severity-recommend/10 border-severity-recommend'
    case 'Negotiable':
      return 'text-severity-negotiable bg-severity-negotiable/10 border-severity-negotiable'
    default:
      return 'text-muted-foreground bg-muted border-border'
  }
}

export function getSeverityHighlightClass(severity: string): string {
  switch (severity) {
    case 'Must Change':
      return 'highlight-must'
    case 'Recommend to Change':
      return 'highlight-recommend'
    case 'Negotiable':
      return 'highlight-negotiable'
    default:
      return ''
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  return file.size <= maxSizeMB * 1024 * 1024
} 