'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/file-upload'
import { TextInput } from '@/components/text-input'
import { WordLikeEditor } from '@/components/word-like-editor'
import { ChatWindow } from '@/components/chat-window'
import { convertToWordLikeComment } from '@/types'
import type { AnalysisResult } from '@/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function Dashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [originalText, setOriginalText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleAnalysis = async (text: string) => {
    if (!text.trim()) {
      setError('Please provide document text to analyze')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setOriginalText(text.trim()) // Store original text

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setAnalysisResult({
          ...result.data,
          original_text: text.trim() // Add original text to result
        })
      } else {
        setError(result.error || 'Failed to analyze document')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = async (text: string) => {
    await handleAnalysis(text)
  }

  const handleTextSubmit = async (text: string) => {
    await handleAnalysis(text)
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="p-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Legal Document Review Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your legal documents or paste text to get AI-powered analysis and recommendations from a Silicon Valley law firm perspective.
          </p>
        </div>

        {!analysisResult ? (
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>
                  Upload a PDF or Word document for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFileProcessed={handleFileUpload}
                  isProcessing={isAnalyzing}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paste Text</CardTitle>
                <CardDescription>
                  Paste legal document text directly for quick analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TextInput 
                  onSubmit={handleTextSubmit}
                  isProcessing={isAnalyzing}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Legal Document Review</h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAnalysisResult(null)
                  setOriginalText('')
                }}
              >
                Analyze New Document
              </Button>
            </div>
            
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{analysisResult.analysis_summary}</p>
              </CardContent>
            </Card>

            {/* Document with Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Document Review</CardTitle>
                <CardDescription>
                  Click on highlighted text or comment bubbles to view AI recommendations. Comments appear in the right sidebar.
                  You can also use the chat feature to ask specific questions about the document.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <WordLikeEditor 
                  documentText={originalText}
                  comments={analysisResult.comments.map(comment => convertToWordLikeComment(comment, originalText))}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <Card className="mt-6 border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive text-center">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {isAnalyzing && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Analyzing your document... This may take 30-60 seconds.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Window - Only show if we have document text */}
        {originalText && (
          <ChatWindow 
            documentText={originalText}
            isOpen={isChatOpen}
            onToggle={toggleChat}
          />
        )}
      </div>
    </div>
  )
} 