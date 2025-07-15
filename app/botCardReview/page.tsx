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
import type { BotCardAnalysisResult, BotCardAnalysisSummary, BotCardComment, Comment, WordComment, BotCardQuantitativeResult } from '@/types'
import { convertBotCardCommentToWordLike } from '@/types'

export default function BotCardReviewPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [botPrompt, setBotPrompt] = useState('')
  const [analysisResults, setAnalysisResults] = useState<BotCardAnalysisResult | null>(null)
  const [quantitativeResults, setQuantitativeResults] = useState<BotCardQuantitativeResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isQuantifying, setIsQuantifying] = useState(false)
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

  const handleQuantify = async () => {
    if (!analysisResults) {
      alert('Please complete the analysis first before quantifying')
      return
    }

    setIsQuantifying(true)
    setQuantitativeResults(null)

    try {
      const originalContent = `Title: ${title}

Description: ${description}

Welcome Message: ${welcomeMessage}

Bot Prompt: ${botPrompt}`

      console.log('Starting bot card quantification...', { 
        contentLength: originalContent.length,
        timestamp: new Date().toISOString()
      })

      const response = await fetch('/api/quantify-bot-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalContent,
          analysisResult: analysisResults
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to quantify bot card')
      }

      console.log('Quantification completed successfully:', data.data)
      setQuantitativeResults(data.data)
    } catch (error) {
      console.error('Error quantifying bot card:', error)
      alert(`Failed to quantify bot card: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      console.log('Quantification process completed')
      setIsQuantifying(false)
    }
  }

  // 组合完整的文档文本用于WordLikeEditor
  const documentText = `Title: ${title}

Description: ${description}

Welcome Message: ${welcomeMessage}

Bot Prompt: ${botPrompt}`

  return (
    <div className="min-h-screen bg-gray-900" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-3">
              🤖 Bot Card Review
            </h1>
            <p className="text-orange-400 max-w-3xl mx-auto">
              Analyze and improve your AI character cards with detailed feedback
            </p>
          </div>

          {/* Input Section */}
          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm shadow-lg" style={{ backgroundColor: '#2a2a2a', borderColor: '#404040' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                📝 Bot Card Content
              </CardTitle>
              <CardDescription className="text-orange-400">
                Enter your bot card information below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter bot character title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                      style={{ backgroundColor: '#333333', borderColor: '#555555' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter bot character description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 resize-none"
                      style={{ backgroundColor: '#333333', borderColor: '#555555' }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage" className="text-gray-300">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      placeholder="Enter the welcome message..."
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      rows={4}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 resize-none"
                      style={{ backgroundColor: '#333333', borderColor: '#555555' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="botPrompt" className="text-gray-300">Bot Prompt</Label>
                    <Textarea
                      id="botPrompt"
                      placeholder="Enter the bot system prompt..."
                      value={botPrompt}
                      onChange={(e) => setBotPrompt(e.target.value)}
                      rows={6}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 resize-none"
                      style={{ backgroundColor: '#333333', borderColor: '#555555' }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3">
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  size="lg"
                  className="px-8 min-w-[200px] bg-red-800 hover:bg-red-900 text-white border-red-700 shadow-lg"
                  style={{ backgroundColor: '#991b1b', borderColor: '#b91c1c' }}
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
                  <div className="text-sm text-orange-400 text-center">
                    <p>🤖 AI is analyzing your bot card...</p>
                    <p className="text-xs mt-1">This usually takes 30-60 seconds</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results Summary */}
          {analysisResults && (
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm shadow-lg" style={{ backgroundColor: '#2a2a2a', borderColor: '#404040' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  📊 Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Assessment */}
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600" style={{ backgroundColor: '#333333', borderColor: '#555555' }}>
                    <h3 className="font-semibold text-white mb-2">Overall Assessment</h3>
                    <p className="text-white leading-relaxed">
                      {analysisResults.analysis_summary.overall_assessment}
                    </p>
                  </div>

                  {/* Two-column layout for detailed analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-600/50" style={{ backgroundColor: '#3a3a3a', borderColor: '#555555' }}>
                        <h4 className="font-medium text-orange-400 mb-2">Target Audience Fit</h4>
                        <p className="text-sm text-white leading-relaxed">
                          {analysisResults.analysis_summary.target_audience_fit}
                        </p>
                      </div>
                      
                      <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-600/50" style={{ backgroundColor: '#3a3a3a', borderColor: '#555555' }}>
                        <h4 className="font-medium text-orange-400 mb-2">Discoverability & Packaging</h4>
                        <p className="text-sm text-white leading-relaxed">
                          {analysisResults.analysis_summary.discoverability_and_packaging}
                        </p>
                      </div>

                      <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-600/50" style={{ backgroundColor: '#3a3a3a', borderColor: '#555555' }}>
                        <h4 className="font-medium text-orange-400 mb-2">Key Strengths</h4>
                        <p className="text-sm text-white leading-relaxed">
                          {analysisResults.analysis_summary.key_strengths_summary}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-600/50" style={{ backgroundColor: '#3a3a3a', borderColor: '#555555' }}>
                        <h4 className="font-medium text-orange-400 mb-2">Narrative Potential & Originality</h4>
                        <p className="text-sm text-white leading-relaxed">
                          {analysisResults.analysis_summary.narrative_potential_and_originality}
                        </p>
                      </div>

                      <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-600/50" style={{ backgroundColor: '#3a3a3a', borderColor: '#555555' }}>
                        <h4 className="font-medium text-orange-400 mb-2">Key Weaknesses</h4>
                        <p className="text-sm text-white leading-relaxed">
                          {analysisResults.analysis_summary.key_weaknesses_summary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comment Type Badges */}
                  <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-600/50" style={{ backgroundColor: '#3a3a3a', borderColor: '#555555' }}>
                    <h4 className="font-medium text-white mb-2">Comment Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResults.locatable_comments.map((comment) => (
                        <Badge 
                          key={comment.comment_id}
                          className={`text-sm ${
                            comment.comment_type === 'LLM Issue' ? 'bg-red-600 text-white' :
                            comment.comment_type === 'Content Issue' ? 'bg-orange-600 text-white' :
                            'bg-green-600 text-white'
                          }`}
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

          {/* Quantification Section */}
          {analysisResults && (
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm shadow-lg" style={{ backgroundColor: '#2a2a2a', borderColor: '#404040' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  📊 Quantitative Scoring
                </CardTitle>
                <CardDescription className="text-orange-400">
                  Generate detailed numerical scores based on the analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <Button 
                    onClick={handleQuantify}
                    disabled={isQuantifying}
                    size="lg"
                    className="px-8 min-w-[200px] bg-red-800 hover:bg-red-900 text-white border-red-700 shadow-lg"
                    style={{ backgroundColor: '#991b1b', borderColor: '#b91c1c' }}
                  >
                    {isQuantifying ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Quantifying...
                      </div>
                    ) : (
                      'Generate Quantitative Scores'
                    )}
                  </Button>
                  
                  {isQuantifying && (
                    <div className="text-sm text-orange-400 text-center">
                      <p>🔢 AI is calculating numerical scores...</p>
                      <p className="text-xs mt-1">This usually takes 30-60 seconds</p>
                    </div>
                  )}
                </div>

                {/* Quantitative Results Display */}
                {quantitativeResults && (
                  <div className="mt-8 space-y-6">
                    {/* Final Score */}
                    <div className="text-center p-6 bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-lg border border-red-500/30 shadow-lg" style={{ backgroundColor: '#7f1d1d', borderColor: '#dc2626' }}>
                      <h3 className="text-2xl font-bold text-white mb-2">Final Score</h3>
                      <div className="text-6xl font-bold text-red-300">
                        {quantitativeResults.quantitative_scores.final_score}
                      </div>
                      <p className="text-orange-400 mt-2">out of 100</p>
                    </div>

                    {/* Section Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Title & Description */}
                      <div className="space-y-4 bg-gray-700/20 rounded-lg p-4 border border-gray-600" style={{ backgroundColor: '#333333', borderColor: '#555555' }}>
                        <h4 className="font-semibold text-white border-b border-gray-600 pb-2">Title & Description</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Title</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.title_and_description.title.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.title_and_description.title.score}/5
                            </span>
                          </div>
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Description</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.title_and_description.description.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.title_and_description.description.score}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Welcome Message */}
                      <div className="space-y-4 bg-gray-700/20 rounded-lg p-4 border border-gray-600" style={{ backgroundColor: '#333333', borderColor: '#555555' }}>
                        <h4 className="font-semibold text-white border-b border-gray-600 pb-2">Welcome Message</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Character World Building</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.welcome_message.character_world_building.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.welcome_message.character_world_building.score}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Hook & Attraction</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.welcome_message.hook_and_attraction.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.welcome_message.hook_and_attraction.score}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Guidance</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.welcome_message.guidance.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.welcome_message.guidance.score}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bot Prompt */}
                      <div className="space-y-4 bg-gray-700/20 rounded-lg p-4 border border-gray-600" style={{ backgroundColor: '#333333', borderColor: '#555555' }}>
                        <h4 className="font-semibold text-white border-b border-gray-600 pb-2">Bot Prompt</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Character Story Arc</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.bot_prompt.character_story_arc.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.bot_prompt.character_story_arc.score}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Setting Consistency</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.bot_prompt.setting_consistency.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.bot_prompt.setting_consistency.score}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Long Term Potential</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.bot_prompt.long_term_potential.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.bot_prompt.long_term_potential.score}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Interaction Test Prediction */}
                      <div className="space-y-4 bg-gray-700/20 rounded-lg p-4 border border-gray-600" style={{ backgroundColor: '#333333', borderColor: '#555555' }}>
                        <h4 className="font-semibold text-white border-b border-gray-600 pb-2">Interaction Test Prediction</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Character Stability</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.interaction_test_prediction.character_stability.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.interaction_test_prediction.character_stability.score}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Plot Driving Force</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.interaction_test_prediction.plot_driving_force.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.interaction_test_prediction.plot_driving_force.score}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Emotional Resonance</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.sections.interaction_test_prediction.emotional_resonance.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 rounded text-sm font-medium text-white">
                              {quantitativeResults.quantitative_scores.sections.interaction_test_prediction.emotional_resonance.score}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Adjustments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 bg-gray-700/20 rounded-lg p-4 border border-gray-600" style={{ backgroundColor: '#333333', borderColor: '#555555' }}>
                        <h4 className="font-semibold text-white border-b border-gray-600 pb-2">Adjustments</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Originality Bonus</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.adjustments.originality_bonus.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-green-800 text-green-300 rounded text-sm font-medium">
                              +{quantitativeResults.quantitative_scores.adjustments.originality_bonus.score}
                            </span>
                          </div>
                          <div className="flex justify-between items-start bg-gray-600/30 rounded p-3" style={{ backgroundColor: '#3a3a3a' }}>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-orange-400">Technical Deduction</p>
                              <p className="text-xs text-white mt-1">
                                {quantitativeResults.quantitative_scores.adjustments.technical_deduction.comment}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-red-800 text-red-300 rounded text-sm font-medium">
                              -{quantitativeResults.quantitative_scores.adjustments.technical_deduction.score}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Interactive Review Section */}
          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm shadow-lg" style={{ backgroundColor: '#2a2a2a', borderColor: '#404040' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                ✏️ Interactive Review
              </CardTitle>
              <CardDescription className="text-orange-400">
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
              <div className="bg-gray-800 rounded-lg border border-gray-600 p-1" style={{ backgroundColor: '#1a1a1a', borderColor: '#555555' }}>
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