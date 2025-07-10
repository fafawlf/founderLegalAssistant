import * as React from 'react'
import { Badge } from './ui/badge'
import { MessageSquare, Sparkles, Loader2 } from 'lucide-react'
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
  if (!text) return { title: 'No title', issue: 'No issue description', recommendation: 'No recommendation' }
  
  const parts = text.split('\n\n')
  return {
    title: parts[0] || 'No title',
    issue: parts[1] || 'No issue description',
    recommendation: parts[2]?.replace('Recommendation: ', '') || 'No recommendation'
  }
}

export function WordLikeEditor({ documentText, comments }: WordLikeEditorProps) {
  const [activeCommentId, setActiveCommentId] = React.useState<string | null>(null)
  const documentRef = React.useRef<HTMLDivElement>(null)
  const commentRefs = React.useRef<Record<string, HTMLSpanElement>>({})
  const [commentPositions, setCommentPositions] = React.useState<Record<string, number>>({})

  if (!documentText) {
    return (
      <div className="flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden min-h-[600px] transform-style-3d">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center animate-fade-in transform-style-3d">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-float-3d">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 italic text-lg">No document loaded.</p>
            <p className="text-gray-500 text-sm mt-2">Upload a document to start reviewing</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate comment positions after render
  React.useEffect(() => {
    if (!documentRef.current) return

    const positions: Record<string, number> = {}
    const usedPositions: number[] = []
    const COMMENT_HEIGHT = 140
    const MIN_SPACING = 20

    sortedComments.forEach((comment) => {
      const commentElement = commentRefs.current[comment.id]
      if (commentElement) {
        const rect = commentElement.getBoundingClientRect()
        const containerRect = documentRef.current!.getBoundingClientRect()
        let targetPosition = rect.top - containerRect.top

        while (usedPositions.some(pos => Math.abs(pos - targetPosition) < COMMENT_HEIGHT + MIN_SPACING)) {
          targetPosition += COMMENT_HEIGHT + MIN_SPACING
        }

        positions[comment.id] = Math.max(0, targetPosition)
        usedPositions.push(targetPosition)
      }
    })

    setCommentPositions(positions)
  }, [documentText, comments, activeCommentId])

  // Sort comments by start index
  const sortedComments = [...comments].sort((a, b) => a.start - b.start)
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
    segments.push(
      <span
        key={comment.id}
        ref={(el) => {
          if (el) commentRefs.current[comment.id] = el
        }}
        className={`relative inline group cursor-pointer ${colors.bg} ${colors.border} border-l-2 px-1 py-0.5 rounded-r transition-all duration-300 transform-style-3d hover:scale-105 ${
          activeCommentId === comment.id ? 'ring-2 ring-offset-1 ' + colors.border + ' shadow-lg' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
        }}
        onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateZ(5px) rotateX(2deg)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg)'
        }}
      >
        <span className={`${colors.text} font-medium whitespace-pre-wrap`}>
          {commentText}
        </span>
        <MessageSquare 
          className={`inline-block w-3 h-3 ml-1 ${colors.text} opacity-70 animate-pulse`}
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
    <div className="flex bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden min-h-[600px] transform-style-3d perspective-1000">
      {/* Document Content */}
      <div 
        className="flex-1 p-8 overflow-y-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 transform-style-3d" 
        ref={documentRef}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="max-w-none text-base leading-relaxed text-gray-900 dark:text-white font-normal transform-style-3d">
          {segments}
        </div>
      </div>

      {/* Comments Column */}
      <div className="w-72 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm relative overflow-y-auto transform-style-3d">
        {/* Header */}
        <div className="sticky top-0 p-4 border-b bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm z-30 transform-style-3d">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center animate-float-3d">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Comments ({comments.length})
            {comments.length > 0 && (
              <Sparkles className="w-4 h-4 text-yellow-500 animate-bounce" />
            )}
          </h3>
        </div>

        {/* Comments positioned relative to their text */}
        <div className="relative transform-style-3d" style={{ pointerEvents: 'none' }}>
          {sortedComments.map((comment, index) => {
            const colors = getSeverityColor(comment.severity)
            const isActive = activeCommentId === comment.id
            const position = commentPositions[comment.id] || (index * 160)
            const { title, issue, recommendation } = parseCommentText(comment.text)
            
            return (
              <div
                key={comment.id}
                className={`absolute inset-x-0 transition-all duration-300 transform-style-3d ${
                  isActive ? 'z-50' : 'z-10'
                }`}
                style={{ 
                  top: `${position}px`,
                  transformStyle: 'preserve-3d',
                  pointerEvents: 'auto',
                }}
              >
                <div
                  className={`mx-3 my-2 p-3 rounded-xl border-l-4 cursor-pointer backdrop-blur-sm transition-all duration-300 transform-style-3d ${
                    isActive
                      ? `${colors.bg} ${colors.border} ring-2 ring-gray-400 dark:ring-gray-500 shadow-2xl scale-105 bg-white/95 dark:bg-gray-800/95`
                      : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 hover:shadow-xl shadow-lg'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveCommentId(isActive ? null : comment.id)
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateZ(10px) rotateX(5deg) rotateY(5deg) scale(1.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg) rotateY(0deg) scale(1)'
                    }
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                    pointerEvents: 'auto',
                    position: 'relative',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${colors.badge} border-0 transform-style-3d animate-pulse`}>
                      {comment.severity === 'high' ? 'Must Change' : 
                       comment.severity === 'medium' ? 'Recommend Change' : 'Negotiable'}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 transform-style-3d flex items-center justify-between">
                    <span>{title}</span>
                    {isActive && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 opacity-70">
                        Click to collapse
                      </span>
                    )}
                  </div>
                  
                  {isActive && (
                    <div className="text-sm text-gray-900 dark:text-gray-50 space-y-3 mt-3 border-t border-gray-200 dark:border-gray-600 pt-3 animate-slide-down transform-style-3d">
                      <div className="transform-style-3d">
                        <span className="font-bold text-gray-900 dark:text-white">Issue:</span>
                        <p className="mt-1 text-gray-900 dark:text-gray-50 leading-relaxed">{issue}</p>
                      </div>
                      <div className="transform-style-3d">
                        <span className="font-bold text-gray-900 dark:text-white">Recommendation:</span>
                        <p className="mt-1 text-gray-900 dark:text-gray-50 leading-relaxed">{recommendation}</p>
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-200 mt-3 p-3 bg-gray-200/80 dark:bg-gray-600/80 rounded-lg transform-style-3d border border-gray-300/50 dark:border-gray-500/50">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">Referenced text:</span> 
                        <span className="text-gray-800 dark:text-gray-100">"{documentText.slice(comment.start, comment.end)}"</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          {comments.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8 animate-fade-in transform-style-3d">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float-3d">
                <MessageSquare className="w-6 h-6 opacity-50" />
              </div>
              <p className="font-medium">No comments found</p>
              <p className="text-sm mt-1">Upload and analyze a document to see AI comments</p>
            </div>
          )}
          
          {/* Spacer to ensure scroll space for all comments */}
          <div style={{ height: `${Math.max(...Object.values(commentPositions)) + 200}px` }} />
        </div>
      </div>
    </div>
  )
} 