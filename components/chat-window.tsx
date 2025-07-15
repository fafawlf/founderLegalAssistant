'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputMessage(value)
    
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
          documentText: documentContent,
          chatHistory: messages.map(msg => ({
            id: `${msg.timestamp.getTime()}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.data?.response || 'Sorry, I encountered an error. Please try again.',
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

  if (!mounted) {
    return null
  }

  if (!isOpen) {
    return createPortal(
      <div 
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 2147483647
        }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-900 text-white shadow-2xl transition-all duration-300 hover:scale-110 p-0 overflow-hidden"
        >
          <div className="relative w-full h-full overflow-hidden rounded-full">
            <Image
              src="/chat-icon.jpeg"
              alt="Chat"
              fill
              className="object-cover object-center"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <MessageCircle className="w-8 h-8 hidden" />
          </div>
        </Button>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div 
      style={{ 
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2147483647,
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
    >
      <Card 
        className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl transition-all duration-500 ${
          isMinimized ? 'w-80 h-16' : 'w-96'
        }`}
        style={{
          maxHeight: isMinimized ? '64px' : 'calc(100vh - 48px)',
          height: isMinimized ? '64px' : '32rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader 
          className="flex flex-row items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-300"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 overflow-hidden rounded-full">
              <Image
                src="/chat-icon.jpeg"
                alt="Chat"
                fill
                className="object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <MessageCircle className="w-8 h-8 text-gray-600 dark:text-gray-400 hidden" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
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
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-full" style={{ minHeight: 0 }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0, maxHeight: 'calc(100% - 100px)' }}>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Ask me anything about your document!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
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
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4" style={{ flexShrink: 0 }}>
              <div className="flex space-x-2">
                <Textarea
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your document..."
                  className="flex-1 resize-none border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400"
                  rows={inputRows}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white"
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
      </Card>
    </div>,
    document.body
  )
} 