'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'

interface TextInputProps {
  onSubmit: (text: string) => void
  isProcessing: boolean
}

export function TextInput({ onSubmit, isProcessing }: TextInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !isProcessing) {
      onSubmit(text.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="legal-text" className="text-sm font-medium">
          Legal Document Text
        </label>
        <textarea
          id="legal-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your legal document text here..."
          className="w-full h-48 p-3 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          disabled={isProcessing}
        />
        <p className="text-xs text-muted-foreground">
          {text.length} characters
        </p>
      </div>
      
      <Button 
        type="submit" 
        disabled={!text.trim() || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Analyze Document
          </>
        )}
      </Button>
    </form>
  )
} 