'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, FileText, Sparkles, Check } from 'lucide-react'

interface TextInputProps {
  onSubmit: (text: string, wordComments?: import('@/types').WordComment[]) => void
  isProcessing: boolean
  onStartAnalysis?: (text?: string) => void
  placeholder?: string
}

export function TextInput({ onSubmit, isProcessing, onStartAnalysis, placeholder = "Paste your legal document text here..." }: TextInputProps) {
  const [text, setText] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text.trim()) // Text input doesn't have Word comments, so don't pass any
      setIsSubmitted(true)
      
      // Trigger automatic analysis
      if (onStartAnalysis) {
        setTimeout(() => {
          onStartAnalysis(text.trim())
        }, 1000)
      }
    }
  }



  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="legal-text" className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <FileText className="w-3 h-3 text-green-600 dark:text-green-400" />
          </div>
          Legal Document Text
        </label>
        <div className="relative">
          <textarea
            id="legal-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setIsSubmitted(false)
            }}
            placeholder={placeholder}
            className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-300"
          />
          {text && !isSubmitted && (
            <div className="absolute top-2 right-2 animate-fade-in">
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100/80 dark:bg-blue-900/30 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-bounce" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ready</span>
              </div>
            </div>
          )}
          {isSubmitted && (
            <div className="absolute top-2 right-2 animate-fade-in">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100/80 dark:bg-green-900/30 rounded-lg backdrop-blur-sm">
                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Starting analysis...</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {text.length.toLocaleString()} characters
          </p>
          {text.length > 0 && (
            <div className="flex items-center gap-1 animate-slide-up">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 dark:text-green-400">
                {isSubmitted ? 'Analysis will start automatically' : 'Ready to load'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <Button 
        type="submit" 
        disabled={!text.trim()}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 transition-all duration-300 hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          <span>{isSubmitted ? 'Document Loaded' : 'Load Document & Analyze'}</span>
          {isSubmitted ? (
            <Check className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4 animate-bounce" />
          )}
        </div>
      </Button>
    </form>
  )
} 