import * as React from 'react'
import { Badge } from './ui/badge'
import { MessageSquare } from 'lucide-react'
import type { Comment } from '@/types'

interface WordLikeEditorProps {
  documentText: string
  comments: Comment[]
}

function getSeverityColor(severity: Comment['severity']) {
  if (severity === 'high') return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' }
  if (severity === 'medium') return { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' }
  return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' }
}

export function WordLikeEditor({ documentText, comments }: WordLikeEditorProps) {
  const [activeCommentId, setActiveCommentId] = React.useState<string | null>(null)
  const documentRef = React.useRef<HTMLDivElement>(null)
  const commentRefs = React.useRef<Record<string, HTMLSpanElement>>({})
  const [commentPositions, setCommentPositions] = React.useState<Record<string, number>>({})

  if (!documentText) return <div className="text-gray-400 italic p-8">No document loaded.</div>

  // Calculate comment positions after render
  React.useEffect(() => {
    if (!documentRef.current) return

    const positions: Record<string, number> = {}
    const usedPositions: number[] = []
    const COMMENT_HEIGHT = 140 // Approximate height of a comment
    const MIN_SPACING = 20 // Minimum spacing between comments

    sortedComments.forEach((comment) => {
      const commentElement = commentRefs.current[comment.id]
      if (commentElement) {
        const rect = commentElement.getBoundingClientRect()
        const containerRect = documentRef.current!.getBoundingClientRect()
        let targetPosition = rect.top - containerRect.top

        // Collision detection - adjust position if too close to other comments
        while (usedPositions.some(pos => Math.abs(pos - targetPosition) < COMMENT_HEIGHT + MIN_SPACING)) {
          targetPosition += COMMENT_HEIGHT + MIN_SPACING
        }

        positions[comment.id] = Math.max(0, targetPosition) // Ensure position is not negative
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
        className={`relative inline group cursor-pointer ${colors.bg} ${colors.border} border-l-2 px-1 py-0.5 rounded-r transition-all duration-200 ${
          activeCommentId === comment.id ? 'ring-2 ring-offset-1 ' + colors.border : ''
        }`}
        onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
      >
        <span className={`${colors.text} font-medium whitespace-pre-wrap`}>
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
    <div className="flex bg-white border rounded-lg shadow-lg overflow-hidden min-h-[600px]">
      {/* Document Content */}
      <div className="flex-1 p-8 overflow-y-auto bg-white border-r border-gray-200" ref={documentRef}>
        <div className="max-w-none text-base leading-relaxed text-gray-900 font-normal">
          {segments}
        </div>
      </div>

      {/* Comments Column */}
      <div className="w-72 bg-gray-50 relative overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 p-4 border-b bg-gray-100 z-30">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments ({comments.length})
          </h3>
        </div>

        {/* Comments positioned relative to their text */}
        <div className="relative">
          {sortedComments.map((comment, index) => {
            const colors = getSeverityColor(comment.severity)
            const isActive = activeCommentId === comment.id
            const position = commentPositions[comment.id] || (index * 160) // Fallback spacing
            
            return (
              <div
                key={comment.id}
                className={`absolute inset-x-0 transition-all duration-200 ${
                  isActive ? 'z-20' : 'z-10'
                }`}
                style={{ 
                  top: `${position}px`,
                }}
              >
                <div
                  className={`mx-3 my-2 p-3 rounded-lg border-l-4 cursor-pointer shadow-sm ${
                    isActive
                      ? `${colors.bg} ${colors.border} ring-1 ring-gray-300`
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveCommentId(isActive ? null : comment.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${colors.badge} border-0`}>
                      {comment.severity === 'high' ? 'Must Change' : 
                       comment.severity === 'medium' ? 'Recommend Change' : 'Negotiable'}
                    </Badge>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {comment.text.split('\n\n')[0]} {/* Title */}
                  </div>
                  
                  {isActive && (
                    <div className="text-sm text-gray-700 space-y-2 mt-2 border-t pt-2">
                      <div>
                        <span className="font-medium">Issue:</span>
                        <p className="mt-1">{comment.text.split('\n\n')[1]}</p>
                      </div>
                      <div>
                        <span className="font-medium">Recommendation:</span>
                        <p className="mt-1">{comment.text.split('\n\n')[2]?.replace('Recommendation: ', '')}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Referenced text: "{documentText.slice(comment.start, comment.end)}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          {comments.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments found</p>
            </div>
          )}
          
          {/* Spacer to ensure scroll space for all comments */}
          <div style={{ height: `${Math.max(...Object.values(commentPositions)) + 200}px` }} />
        </div>
      </div>
    </div>
  )
} 