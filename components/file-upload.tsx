'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Sparkles, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateFileType, validateFileSize } from '@/lib/utils'

interface FileUploadProps {
  onFileProcessed: (text: string) => void
  isProcessing: boolean
  onStartAnalysis?: (text?: string) => void
}

export function FileUpload({ onFileProcessed, isProcessing, onStartAnalysis }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const processFile = async (file: File) => {
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
        
        if (onStartAnalysis) {
          setTimeout(() => {
            onStartAnalysis(result.data.text)
          }, 1000)
        }
      } else {
        throw new Error(result.error || result.data?.error || 'Failed to process file')
      }
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload file')
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    await processFile(file)
  }, [onFileProcessed, onStartAnalysis])

  const handleManualFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }, [])

  const handleClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1,
    disabled: isProcessing || uploadStatus === 'uploading',
    noClick: true, // Disable dropzone's click handling, we'll handle it manually
  })

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="w-full p-4 bg-gray-200 text-gray-500 rounded">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleManualFileSelect}
        style={{ display: 'none' }}
      />

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm
          ${isDragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105' : 'border-gray-300 dark:border-gray-600'}
          ${isProcessing || uploadStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
        `}
        onClick={handleClick}
      >
        {/* We still include getInputProps for drag & drop, but it's hidden */}
        <input {...getInputProps()} style={{ display: 'none' }} />
        
        {uploadStatus === 'uploading' ? (
          <div className="space-y-4 animate-fade-in">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
              <div className="relative w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Processing {fileName}...</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This may take a moment</p>
            </div>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="space-y-4 animate-slide-up">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
              <div className="relative w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">File processed successfully!</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fileName}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Sparkles className="w-3 h-3 text-yellow-500 animate-bounce" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Starting analysis...</span>
              </div>
            </div>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="space-y-4 animate-slide-up">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" />
              <div className="relative w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Upload failed</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{errorMessage}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse" />
              <div className="relative w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Supports PDF, DOCX, and DOC files up to 10MB
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Analysis will start automatically</span>
              </div>
            </div>
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
          className="w-full transition-all duration-300 hover:scale-105"
        >
          Try Again
        </Button>
      )}
    </div>
  )
} 