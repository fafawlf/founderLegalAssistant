'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { WordLikeEditor } from '@/components/word-like-editor'
import { ChatWindow } from '@/components/chat-window'
import type { BotCardAnalysisResult, BotCardAnalysisSummary, BotCardComment, Comment, WordComment } from '@/types'
import { convertBotCardCommentToWordLike } from '@/types'

export default function BotCardReviewPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [botPrompt, setBotPrompt] = useState('')
  const [analysisResults, setAnalysisResults] = useState<BotCardAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [wordComments, setWordComments] = useState<WordComment[]>([])

  const handleAnalyze = async () => {
    if (!title && !description && !welcomeMessage && !botPrompt) {
      alert('Please provide at least one section of the bot card')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResults(null)

    try {
      // 组合所有内容
      const cardContent = `Title: ${title}

Description: ${description}

Welcome Message: ${welcomeMessage}

Bot Prompt: ${botPrompt}`

      console.log('Starting bot card analysis...', { 
        contentLength: cardContent.length,
        timestamp: new Date().toISOString()
      })

      const response = await fetch('/api/analyze-bot-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cardContent }),
      })

      console.log('API response received:', {
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString()
      })

      const data = await response.json()
      console.log('API data:', data)

      if (data.success) {
        console.log('Analysis successful, setting results...')
        setAnalysisResults(data.data)
        console.log('Results set:', data.data)
      } else {
        throw new Error(data.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Error analyzing bot card:', error)
      alert(`Failed to analyze bot card: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      console.log('Analysis process completed')
      setIsAnalyzing(false)
    }
  }

  const handleWordCommentAdd = (comment: WordComment) => {
    setWordComments(prev => [...prev, comment])
  }

  const handleWordCommentUpdate = (commentId: string, newText: string) => {
    setWordComments(prev => 
      prev.map(comment => 
        comment.id === commentId ? { ...comment, text: newText } : comment
      )
    )
  }

  const handleWordCommentDelete = (commentId: string) => {
    setWordComments(prev => prev.filter(comment => comment.id !== commentId))
  }

  // 组合完整的文档文本用于WordLikeEditor
  const documentText = `Title: ${title}

Description: ${description}

Welcome Message: ${welcomeMessage}

Bot Prompt: ${botPrompt}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🤖 AI Bot Card Review
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get detailed feedback on your AI character bot cards to improve content quality and AI performance
            </p>
          </div>

          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📝 Bot Card Content
              </CardTitle>
              <CardDescription>
                Enter your bot card information below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter bot character title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter bot character description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      placeholder="Enter the welcome message..."
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="botPrompt">Bot Prompt</Label>
                    <Textarea
                      id="botPrompt"
                      placeholder="Enter the bot system prompt..."
                      value={botPrompt}
                      onChange={(e) => setBotPrompt(e.target.value)}
                      rows={6}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3">
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  size="lg"
                  className="px-8 min-w-[200px]"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </div>
                  ) : (
                    'Analyze Bot Card'
                  )}
                </Button>
                
                {isAnalyzing && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    <p>🤖 AI is analyzing your bot card...</p>
                    <p className="text-xs mt-1">This usually takes 30-60 seconds</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results Summary */}
          {analysisResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Assessment */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Overall Assessment</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {analysisResults.analysis_summary.overall_assessment}
                    </p>
                  </div>

                  {/* Two-column layout for detailed analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Target Audience Fit</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {analysisResults.analysis_summary.target_audience_fit}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Discoverability & Packaging</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {analysisResults.analysis_summary.discoverability_and_packaging}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Strengths</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {analysisResults.analysis_summary.key_strengths_summary}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Narrative Potential & Originality</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {analysisResults.analysis_summary.narrative_potential_and_originality}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Weaknesses</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {analysisResults.analysis_summary.key_weaknesses_summary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comment Type Badges */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Comment Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResults.locatable_comments.map((comment) => (
                        <Badge 
                          key={comment.comment_id}
                          variant={
                            comment.comment_type === 'LLM Issue' ? 'destructive' :
                            comment.comment_type === 'Content Issue' ? 'default' :
                            'secondary'
                          }
                          className="text-sm"
                        >
                          {comment.comment_type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interactive Review Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ✏️ Interactive Review
              </CardTitle>
              <CardDescription>
                Review and add comments to your bot card content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Analysis Results: {analysisResults ? 'Present' : 'None'}
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      AI Comments: {analysisResults?.locatable_comments ? analysisResults.locatable_comments.length : 0}
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Word Comments: {wordComments.length}
                    </p>
                  </div>
                  {analysisResults && (
                    <details className="mt-3">
                      <summary className="text-sm text-yellow-700 dark:text-yellow-300 cursor-pointer hover:text-yellow-600">
                        View AI Comments Data
                      </summary>
                      <pre className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 overflow-auto max-h-40 bg-yellow-100/50 dark:bg-yellow-900/30 p-2 rounded">
                        {JSON.stringify(analysisResults.locatable_comments, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Document Editor */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                <WordLikeEditor
                  documentText={documentText}
                  comments={[
                    // AI comments
                    ...(analysisResults?.locatable_comments ? analysisResults.locatable_comments.map((comment: BotCardComment) => convertBotCardCommentToWordLike(comment, documentText)) : []),
                    // Word comments
                    ...wordComments.map((comment: WordComment) => ({
                      id: comment.id,
                      text: comment.text,
                      author: comment.author,
                      start: comment.position.start,
                      end: comment.position.end,
                      severity: 'medium' as const
                    }))
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow 
        documentContent={documentText}
      />
    </div>
  )
} 