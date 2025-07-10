'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/file-upload'
import { TextInput } from '@/components/text-input'
import { WordLikeEditor } from '@/components/word-like-editor'
import { ChatWindow } from '@/components/chat-window'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, MessageSquare, Upload, Type, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { convertToWordLikeComment, type LegalComment, type WordComment } from '@/types'

export default function LegalDocPage() {
  const [documentText, setDocumentText] = useState('')
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [wordComments, setWordComments] = useState<WordComment[]>([])

  const handleDocumentUpload = (text: string, wordComments?: WordComment[]) => {
    setDocumentText(text)
    setWordComments(wordComments || [])
  }

  const handleAnalysis = async (textToAnalyze?: string) => {
    const analysisText = textToAnalyze || documentText
    
    if (!analysisText.trim()) {
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: analysisText }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAnalysisResults(data.data)
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-black dark:via-gray-900 dark:to-gray-800 perspective-2000">
      {/* Floating 3D Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-16 h-16 bg-blue-500/10 rounded-full animate-float-3d" />
        <div className="absolute top-20 right-20 w-12 h-12 bg-green-500/10 rounded-full animate-tilt" />
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-purple-500/10 rounded-full animate-depth-float" />
        <div className="absolute bottom-10 right-10 w-8 h-8 bg-orange-500/10 rounded-full animate-rotate-3d" />
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="transform-style-3d transition-all duration-300 hover:scale-105"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateZ(5px) rotateX(5deg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg)'
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center animate-float-3d">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Legal Document Review
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500 dark:text-gray-400 animate-float">
                Founder-focused AI analysis
              </div>
              <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!documentText ? (
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-12 perspective-1000">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 animate-slide-up transform-style-3d hover:animate-tilt">
                Upload Your Legal Document
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 animate-slide-up [animation-delay:0.2s] transform-style-3d hover:animate-depth-float">
                Get instant, founder-focused analysis of contracts, term sheets, and legal agreements
              </p>
            </div>

            {/* Upload Options */}
            <div className="grid md:grid-cols-2 gap-8 mb-12 perspective-1500">
              <Card 
                className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl transform-style-3d transition-all duration-500 hover:shadow-2xl group animate-slide-up"
                style={{
                  transformStyle: 'preserve-3d',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateZ(20px) rotateX(10deg) rotateY(10deg) scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg) rotateY(0deg) scale(1)'
                }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 transform-style-3d group-hover:animate-rotate-3d">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white transform-style-3d group-hover:animate-float-3d">
                    Upload Document
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 transform-style-3d group-hover:animate-depth-float">
                    PDF, Word, or text files up to 10MB
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <FileUpload 
                    onFileProcessed={handleDocumentUpload} 
                    isProcessing={isAnalyzing} 
                    onStartAnalysis={handleAnalysis}
                  />
                </CardContent>
                
                {/* 3D Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </Card>

              <Card 
                className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl transform-style-3d transition-all duration-500 hover:shadow-2xl group animate-slide-up [animation-delay:0.2s]"
                style={{
                  transformStyle: 'preserve-3d',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateZ(20px) rotateX(10deg) rotateY(10deg) scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg) rotateY(0deg) scale(1)'
                }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 transform-style-3d group-hover:animate-rotate-3d">
                    <Type className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white transform-style-3d group-hover:animate-float-3d">
                    Paste Text
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 transform-style-3d group-hover:animate-depth-float">
                    Copy and paste your document text directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <TextInput 
                    onSubmit={handleDocumentUpload} 
                    isProcessing={isAnalyzing} 
                    onStartAnalysis={handleAnalysis}
                  />
                </CardContent>
                
                {/* 3D Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </Card>
            </div>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 perspective-1500">
              {[
                {
                  icon: FileText,
                  title: "Smart Analysis",
                  description: "AI identifies risks and problematic clauses automatically",
                  color: "blue"
                },
                {
                  icon: MessageSquare,
                  title: "Interactive Chat",
                  description: "Ask questions and get instant explanations",
                  color: "green"
                },
                {
                  icon: Sparkles,
                  title: "Founder Focus",
                  description: "Analysis optimized for startup founders' interests",
                  color: "purple"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="text-center p-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transform-style-3d transition-all duration-500 hover:shadow-xl animate-slide-up group"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    transformStyle: 'preserve-3d',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateZ(15px) rotateX(5deg) rotateY(5deg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg) rotateY(0deg)'
                  }}
                >
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transform-style-3d group-hover:animate-perspective-spin ${
                    feature.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    feature.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    <feature.icon className={`w-6 h-6 ${
                      feature.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      feature.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transform-style-3d group-hover:animate-float-3d">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm transform-style-3d group-hover:animate-depth-float">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Document Status - Show analysis progress */}
            <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transform-style-3d">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isAnalyzing 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 animate-spin-slow' 
                    : 'bg-blue-100 dark:bg-blue-900/30 animate-float-3d'
                }`}>
                  {isAnalyzing ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                      <div className="relative w-6 h-6 bg-white/80 rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${
                    isAnalyzing ? 'animate-pulse' : ''
                  }`}>
                    {isAnalyzing ? 'Analyzing Document...' : analysisResults ? 'Analysis Complete' : 'Document Loaded'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {documentText.length.toLocaleString()} characters
                    {isAnalyzing && (
                      <span className="animate-pulse">
                        {' • '}
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
                          AI is reviewing your document
                        </span>
                      </span>
                    )}
                    {analysisResults && ` • Found ${analysisResults.comments?.length || 0} AI comments`}
                    {wordComments.length > 0 && ` • ${wordComments.length} Word comments`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {isAnalyzing && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">Analyzing...</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setDocumentText('')
                    setAnalysisResults(null)
                  }}
                  className="px-4 py-2 transform-style-3d transition-all duration-300 hover:scale-105"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateZ(5px) rotateX(5deg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg)'
                  }}
                >
                  Upload New Document
                </Button>
              </div>
            </div>

            {/* Document Editor */}
            <div className="transform-style-3d">
              <WordLikeEditor 
                documentText={documentText}
                comments={[
                  // AI comments
                  ...(analysisResults?.comments ? analysisResults.comments.map((comment: LegalComment) => convertToWordLikeComment(comment, documentText)) : []),
                  // Word comments
                  ...wordComments.map((comment: WordComment) => ({
                    id: comment.id,
                    text: `📝 ${comment.text}\n\nAuthor: ${comment.author}\nDate: ${new Date(comment.date).toLocaleDateString()}`,
                    author: comment.author,
                    start: comment.position.start,
                    end: comment.position.end,
                    severity: 'low' as const
                  }))
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Chat Window */}
      {documentText && (
        <ChatWindow documentContent={documentText} />
      )}

      {/* 3D Floating Background Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/5 w-2 h-2 bg-blue-500/20 rounded-full animate-float-3d [animation-delay:3s]" />
        <div className="absolute top-2/3 right-1/5 w-1 h-1 bg-purple-500/20 rounded-full animate-tilt [animation-delay:4s]" />
        <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-green-500/20 rounded-full animate-depth-float [animation-delay:5s]" />
        <div className="absolute bottom-2/3 right-1/3 w-2 h-2 bg-orange-500/20 rounded-full animate-rotate-3d [animation-delay:6s]" />
      </div>
    </div>
  )
} 