'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Minimize2, Maximize2, Send, Loader2, X } from 'lucide-react'
import Image from 'next/image'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatWindowProps {
  documentContent: string
}

export function ChatWindow({ documentContent }: ChatWindowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [inputRows, setInputRows] = useState(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputMessage(value)
    
    // Auto-resize textarea
    const lines = value.split('\n').length
    const newRows = Math.min(Math.max(lines, 1), 3)
    setInputRows(newRows)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setInputRows(1)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          documentContent,
          conversationHistory: messages
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 perspective-1000">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl transform-style-3d transition-all duration-300 hover:scale-110 animate-float group"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(10px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateZ(20px) rotateX(15deg) rotateY(15deg) scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateZ(10px) rotateX(0deg) rotateY(0deg) scale(1)'
          }}
        >
          <div className="relative w-8 h-8 transform-style-3d group-hover:animate-rotate-3d overflow-hidden rounded-full">
            <Image
              src="/chat-icon.jpeg"
              alt="Chat"
              fill
              className="object-cover object-center scale-150"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <MessageCircle className="w-8 h-8 hidden" />
          </div>
          
          {/* 3D Glow Effect */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse group-hover:animate-glow pointer-events-none" />
          
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-bounce opacity-80" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-60" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 perspective-1500">
      <Card 
        className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl transform-style-3d transition-all duration-500 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[32rem]'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: 'translateZ(20px)',
        }}
      >
        {/* 3D Header */}
        <CardHeader 
          className="flex flex-row items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 cursor-pointer transform-style-3d hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-300"
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            transformStyle: 'preserve-3d',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateZ(5px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateZ(0px)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 transform-style-3d animate-float-3d overflow-hidden rounded-full">
              <Image
                src="/chat-icon.jpeg"
                alt="Chat"
                fill
                className="object-cover object-center scale-150"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 hidden" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white transform-style-3d">
              Chat with Document
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsMinimized(!isMinimized)
              }}
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transform-style-3d transition-all duration-300"
              style={{
                transformStyle: 'preserve-3d',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateZ(5px) rotateX(10deg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg)'
              }}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transform-style-3d transition-all duration-300"
              style={{
                transformStyle: 'preserve-3d',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateZ(5px) rotateX(10deg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateZ(0px) rotateX(0deg)'
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-full transform-style-3d">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 transform-style-3d">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8 transform-style-3d animate-fade-in">
                  <div className="animate-float-3d">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm">Ask me anything about your document!</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up transform-style-3d`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl transform-style-3d transition-all duration-300 hover:scale-105 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
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
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start animate-slide-up transform-style-3d">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl transform-style-3d animate-pulse">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 transform-style-3d">
              <div className="flex space-x-2">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your document..."
                  className="flex-1 resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transform-style-3d transition-all duration-300"
                  rows={inputRows}
                  disabled={isLoading}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.transform = 'translateZ(5px)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.transform = 'translateZ(0px)'
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transform-style-3d transition-all duration-300 hover:scale-105"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(5px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateZ(10px) rotateX(10deg) rotateY(10deg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateZ(5px) rotateX(0deg) rotateY(0deg)'
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
        
        {/* 3D Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </Card>
    </div>
  )
} 