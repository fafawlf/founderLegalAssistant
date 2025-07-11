import * as React from 'react'
import { Badge } from './ui/badge'
import { MessageSquare, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import type { Comment } from '@/types'

interface WordLikeEditorProps {
  documentText: string
  comments: Comment[]
}

function getSeverityColor(severity: Comment['severity']) {
  if (severity === 'high') return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', badge: 'bg-red-100 text-red-800' }
  if (severity === 'medium') return { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800' }
  return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-800' }
}

function parseCommentText(text: string | undefined) {
  if (!text) return { title: 'No title', issue: 'No issue description', recommendation: 'No recommendation', marketStandard: null, isWordComment: false }
  
  // Ensure text is a string
  const textStr = String(text)
  
  // Handle Word comments (they start with 📝)
  if (textStr.startsWith('📝')) {
    const lines = textStr.split('\n')
    const title = (lines[0] || '').replace('📝 ', '') || 'Word Comment'
    const content = lines.slice(1).filter(line => line && !line.startsWith('Author:') && !line.startsWith('Date:')).join('\n').trim()
    const authorLine = lines.find(line => line && line.startsWith('Author:'))
    const dateLine = lines.find(line => line && line.startsWith('Date:'))
    const author = authorLine ? authorLine.replace('Author: ', '') : 'Unknown'
    const date = dateLine ? dateLine.replace('Date: ', '') : 'Unknown'
    
    return {
      title,
      issue: content || 'No content',
      recommendation: `Comment by ${author} on ${date}`,
      marketStandard: null,
      isWordComment: true
    }
  }
  
  // Check if this looks like a simple Word comment (just the text without formatting)
  // Word comments from our processor are usually just plain text
  if (!textStr.includes('\n\n') && textStr.length < 200) {
    return {
      title: textStr.length > 50 ? textStr.substring(0, 50) + '...' : textStr,
      issue: textStr,
      recommendation: 'Original comment from Word document',
      marketStandard: null,
      isWordComment: true
    }
  }
  
  // Handle AI comments
  const parts = textStr.split('\n\n')
  const recommendation = parts[2] ? parts[2].replace('Recommendation: ', '') : 'No recommendation'
  
  // Parse market standard information
  let marketStandard = null
  if (parts[3] && parts[3].includes('Is this market standard:')) {
    const marketStandardText = parts[3]
    const lines = marketStandardText.split('\n')
    const isStandardLine = lines.find(line => line.includes('Is this market standard:'))
    const reasoning = lines.slice(1).join('\n').trim()
    
    if (isStandardLine) {
      const isStandard = isStandardLine.replace('Is this market standard:', '').trim()
      marketStandard = {
        isStandard,
        reasoning
      }
    }
  }
  
  return {
    title: parts[0] || 'No title',
    issue: parts[1] || 'No issue description',
    recommendation,
    marketStandard,
    isWordComment: false
  }
}

export function WordLikeEditor({ documentText, comments }: WordLikeEditorProps) {
  const [expandedComments, setExpandedComments] = React.useState<Set<string>>(new Set())
  const documentRef = React.useRef<HTMLDivElement>(null)
  const commentRefs = React.useRef<Record<string, HTMLSpanElement>>({})
  const [commentPositions, setCommentPositions] = React.useState<Record<string, number>>({})

  if (!documentText) {
    return (
      <div className="flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 italic text-lg">No document loaded.</p>
            <p className="text-gray-500 text-sm mt-2">Upload a document to start reviewing</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort comments by start index
  const sortedComments = [...comments].sort((a, b) => a.start - b.start)

  // Calculate comment positions after render
  React.useEffect(() => {
    if (!documentRef.current) return

    const positions: Record<string, number> = {}
    const usedPositions: number[] = []
    const COMMENT_HEIGHT = 160
    const MIN_SPACING = 20

    sortedComments.forEach((comment) => {
      const commentElement = commentRefs.current[comment.id]
      if (commentElement) {
        const rect = commentElement.getBoundingClientRect()
        const containerRect = documentRef.current!.getBoundingClientRect()
        let targetPosition = rect.top - containerRect.top

        // Avoid overlapping comments
        while (usedPositions.some(pos => Math.abs(pos - targetPosition) < COMMENT_HEIGHT + MIN_SPACING)) {
          targetPosition += COMMENT_HEIGHT + MIN_SPACING
        }

        positions[comment.id] = Math.max(0, targetPosition)
        usedPositions.push(targetPosition)
      }
    })

    setCommentPositions(positions)
  }, [documentText, comments, sortedComments])

  const toggleComment = React.useCallback((commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }, [])

  const segments: React.ReactNode[] = []
  let lastIdx = 0

  sortedComments.forEach((comment, i) => {
    const colors = getSeverityColor(comment.severity)
    
    // Add normal text before comment (preserve line breaks)
    if (comment.start > lastIdx) {
      const textSegment = documentText.slice(lastIdx, comment.start)
      segments.push(
        <span key={`text-${lastIdx}`} className="whitespace-pre-wrap">
          {textSegment}
        </span>
      )
    }
    
    // Add commented text with indicator
    const commentText = documentText.slice(comment.start, comment.end)
    const isExpanded = expandedComments.has(comment.id)
    
    segments.push(
      <span
        key={comment.id}
        ref={(el) => {
          if (el) commentRefs.current[comment.id] = el
        }}
        className={`relative inline-block cursor-pointer ${colors.bg} ${colors.border} border-l-2 px-1 py-0.5 rounded-r transition-all duration-200 hover:scale-[1.02] ${
          isExpanded ? 'ring-2 ring-offset-1 ' + colors.border + ' shadow-lg' : ''
        }`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleComment(comment.id)
        }}
      >
        <span className={`${colors.text} font-medium whitespace-pre-wrap select-none`}>
          {commentText}
        </span>
        <MessageSquare 
          className={`inline-block w-3 h-3 ml-1 ${colors.text} opacity-70`}
          strokeWidth={2}
        />
      </span>
    )
    lastIdx = comment.end
  })

  // Add any remaining text
  if (lastIdx < documentText.length) {
    const remainingText = documentText.slice(lastIdx)
    segments.push(
      <span key={`text-${lastIdx}`} className="whitespace-pre-wrap">
        {remainingText}
      </span>
    )
  }

  return (
    <div className="flex bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
      {/* Document Content */}
      <div 
        className="flex-1 p-8 overflow-y-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700" 
        ref={documentRef}
      >
        <div className="max-w-none text-base leading-relaxed text-gray-900 dark:text-white font-normal">
          {segments}
        </div>
      </div>

      {/* Comments Column */}
      <div className="w-80 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm relative overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 p-4 border-b bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm z-30">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Comments ({comments.length})
            {comments.length > 0 && (
              <Sparkles className="w-4 h-4 text-yellow-500" />
            )}
          </h3>
        </div>

        {/* Comments positioned relative to their text */}
        <div className="relative" style={{ minHeight: '100%' }}>
          {sortedComments.map((comment, index) => {
            const colors = getSeverityColor(comment.severity)
            const isExpanded = expandedComments.has(comment.id)
            const position = commentPositions[comment.id] || (index * 180)
            const { title, issue, recommendation, marketStandard, isWordComment } = parseCommentText(comment.text)
            
            return (
              <div
                key={comment.id}
                className={`absolute left-0 right-0 transition-all duration-300 ease-in-out ${
                  isExpanded ? 'z-50' : 'z-10'
                }`}
                style={{ 
                  top: `${position}px`,
                }}
              >
                <div
                  className={`mx-3 my-2 p-4 rounded-xl border-l-4 cursor-pointer transition-all duration-300 ${
                    isExpanded
                      ? `${colors.bg} ${colors.border} ring-2 ring-gray-400 dark:ring-gray-500 shadow-xl bg-white/95 dark:bg-gray-800/95 scale-[1.02]`
                      : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 hover:shadow-lg shadow-md'
                  } hover:scale-[1.01]`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleComment(comment.id)
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${colors.badge} border-0`}>
                      {isWordComment ? 'Word Comment' : 
                       comment.severity === 'high' ? 'Must Change' : 
                       comment.severity === 'medium' ? 'Recommend Change' : 'Negotiable'}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
                      {title}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {isExpanded ? (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span>Collapse</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-4 h-4" />
                          <span>Expand</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="text-sm text-gray-900 dark:text-gray-50 space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {isWordComment ? 'Content:' : 'Issue:'}
                        </span>
                        <p className="mt-1 text-gray-900 dark:text-gray-50 leading-relaxed whitespace-pre-wrap">{issue}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {isWordComment ? 'Details:' : 'Recommendation:'}
                        </span>
                        <p className="mt-1 text-gray-900 dark:text-gray-50 leading-relaxed whitespace-pre-wrap">{recommendation}</p>
                      </div>
                      {marketStandard && !isWordComment && (
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white">Market Standard:</span>
                          <div className="mt-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                marketStandard.isStandard === 'Yes' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : marketStandard.isStandard === 'No'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}>
                                {marketStandard.isStandard}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                              {marketStandard.reasoning}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-700 dark:text-gray-200 p-3 bg-gray-200/80 dark:bg-gray-600/80 rounded-lg border border-gray-300/50 dark:border-gray-500/50">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">Referenced text:</span> 
                        <span className="text-gray-800 dark:text-gray-100 break-words ml-1">"{documentText.slice(comment.start, comment.end)}"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {comments.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 opacity-50" />
              </div>
              <p className="font-medium">No comments found</p>
              <p className="text-sm mt-1">Upload and analyze a document to see AI comments</p>
            </div>
          )}
          
          {/* Spacer to ensure scroll space for all comments */}
          <div style={{ height: `${Math.max(...Object.values(commentPositions), 0) + 200}px` }} />
        </div>
      </div>
    </div>
  )
} 