'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Filter, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react'
import type { AnalysisResult, LegalComment, SeverityLevel } from '@/types'
import { getSeverityColor, getSeverityHighlightClass } from '@/lib/utils'

interface AnalysisResultsProps {
  result: AnalysisResult
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'all'>('all')
  const [selectedComment, setSelectedComment] = useState<string | null>(null)
  const [selectedTextRange, setSelectedTextRange] = useState<{ start: number; end: number } | null>(null)
  
  const textRef = useRef<HTMLDivElement>(null)
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const filteredComments = selectedSeverity === 'all' 
    ? result.comments 
    : result.comments.filter(comment => comment.severity === selectedSeverity)

  const severityCounts = {
    'Must Change': result.comments.filter(c => c.severity === 'Must Change').length,
    'Recommend to Change': result.comments.filter(c => c.severity === 'Recommend to Change').length,
    'Negotiable': result.comments.filter(c => c.severity === 'Negotiable').length,
  }

  const handleCommentClick = (comment: LegalComment) => {
    setSelectedComment(comment.comment_id)
    setSelectedTextRange({ start: comment.start_char_index, end: comment.end_char_index })
    
    // Scroll to the text position
    if (textRef.current) {
      const textElement = textRef.current
      const textContent = textElement.textContent || ''
      const beforeText = textContent.substring(0, comment.start_char_index)
      const lines = beforeText.split('\n')
      const lineHeight = 24 // Approximate line height
      const scrollTop = lines.length * lineHeight
      
      textElement.scrollTo({ top: Math.max(0, scrollTop - 100), behavior: 'smooth' })
    }
  }

  const handleTextClick = (comment: LegalComment) => {
    setSelectedComment(comment.comment_id)
    
    // Scroll to the comment
    const commentElement = commentRefs.current[comment.comment_id]
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const exportResults = () => {
    const exportData = {
      documentId: result.document_id,
      summary: result.analysis_summary,
      comments: result.comments,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `legal-analysis-${result.document_id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderHighlightedText = () => {
    if (!result.comments.length) return result.analysis_summary

    let text = result.analysis_summary
    const highlights: Array<{ start: number; end: number; comment: LegalComment }> = []

    // Sort comments by start position to avoid overlapping
    const sortedComments = [...result.comments].sort((a, b) => a.start_char_index - b.start_char_index)
    
    sortedComments.forEach(comment => {
      highlights.push({
        start: comment.start_char_index,
        end: comment.end_char_index,
        comment
      })
    })

    // Create highlighted text
    const parts = []
    let lastIndex = 0

    highlights.forEach(({ start, end, comment }) => {
      if (start > lastIndex) {
        parts.push(text.substring(lastIndex, start))
      }
      
      const highlightedText = text.substring(start, end)
      parts.push(
        <span
          key={comment.comment_id}
          className={`cursor-pointer ${getSeverityHighlightClass(comment.severity)}`}
          onClick={() => handleTextClick(comment)}
          title={`Click to view comment: ${comment.comment_title}`}
        >
          {highlightedText}
        </span>
      )
      
      lastIndex = end
    })

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{result.analysis_summary}</p>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Original Text Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Original Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={textRef}
              className="max-h-96 overflow-y-auto p-4 border rounded-md bg-muted/20 text-sm leading-relaxed whitespace-pre-wrap"
            >
              {renderHighlightedText()}
            </div>
          </CardContent>
        </Card>

        {/* Comments Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Recommendations</CardTitle>
              <Button variant="outline" size="sm" onClick={exportResults}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            
            {/* Filter Controls */}
            <div className="flex items-center gap-2 pt-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                <Button
                  variant={selectedSeverity === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('all')}
                >
                  All ({result.comments.length})
                </Button>
                <Button
                  variant={selectedSeverity === 'Must Change' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('Must Change')}
                  className="bg-severity-must text-white hover:bg-severity-must/80"
                >
                  Must ({severityCounts['Must Change']})
                </Button>
                <Button
                  variant={selectedSeverity === 'Recommend to Change' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('Recommend to Change')}
                  className="bg-severity-recommend text-white hover:bg-severity-recommend/80"
                >
                  Recommend ({severityCounts['Recommend to Change']})
                </Button>
                <Button
                  variant={selectedSeverity === 'Negotiable' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('Negotiable')}
                  className="bg-severity-negotiable text-white hover:bg-severity-negotiable/80"
                >
                  Negotiable ({severityCounts['Negotiable']})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {filteredComments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No comments match the selected filter.
                </div>
              ) : (
                filteredComments.map((comment) => (
                  <div
                    key={comment.comment_id}
                    ref={(el) => {
                      commentRefs.current[comment.comment_id] = el
                    }}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${selectedComment === comment.comment_id ? 'ring-2 ring-primary' : 'hover:border-primary/50'}
                    `}
                    onClick={() => handleCommentClick(comment)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm">{comment.comment_title}</h4>
                      <Badge 
                        variant="severity" 
                        className={
                          comment.severity === 'Must Change' ? 'bg-severity-must' :
                          comment.severity === 'Recommend to Change' ? 'bg-severity-recommend' :
                          'bg-severity-negotiable'
                        }
                      >
                        {comment.severity}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Issue:</p>
                        <p className="text-foreground">{comment.comment_details}</p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground mb-1">Recommendation:</p>
                        <p className="text-foreground font-medium">{comment.recommendation}</p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        "{comment.original_text}"
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 