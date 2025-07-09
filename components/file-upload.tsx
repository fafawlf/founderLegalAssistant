'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateFileType, validateFileSize, formatFileSize } from '@/lib/utils'

interface FileUploadProps {
  onFileProcessed: (text: string) => void
  isProcessing: boolean
}

export function FileUpload({ onFileProcessed, isProcessing }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadStatus('uploading')
    setErrorMessage('')
    setFileName(file.name)

    try {
      if (!validateFileType(file)) {
        throw new Error('Unsupported file type. Please upload a PDF or Word document.')
      }

      if (!validateFileSize(file)) {
        throw new Error('File size too large. Please upload a file smaller than 10MB.')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.data?.text) {
        setUploadStatus('success')
        onFileProcessed(result.data.text)
      } else {
        throw new Error(result.data?.error || 'Failed to process file')
      }
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload file')
    }
  }, [onFileProcessed])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1,
    disabled: isProcessing || uploadStatus === 'uploading'
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isProcessing || uploadStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadStatus === 'uploading' ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Processing {fileName}...</p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="space-y-2">
            <FileText className="h-8 w-8 text-green-600 mx-auto" />
            <p className="text-sm text-green-600 font-medium">File processed successfully!</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-destructive font-medium">Upload failed</p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, and DOC files up to 10MB
            </p>
          </div>
        )}
      </div>

      {uploadStatus === 'error' && (
        <Button 
          variant="outline" 
          onClick={() => {
            setUploadStatus('idle')
            setErrorMessage('')
            setFileName('')
          }}
          className="w-full"
        >
          Try Again
        </Button>
      )}
    </div>
  )
} 