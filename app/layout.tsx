import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Legal Document Review Assistant',
  description: 'AI-powered legal document review assistant for startup founders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} dark:bg-black transition-colors duration-300`}>
        <div className="min-h-screen bg-white dark:bg-black transition-all duration-500">
          {/* Subtle animated background elements - Apple style */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-100/40 to-gray-200/30 dark:from-gray-800/20 dark:to-gray-700/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-gray-50/50 to-gray-100/40 dark:from-gray-900/30 dark:to-gray-800/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 dark:from-blue-950/10 dark:to-indigo-950/5 rounded-full blur-3xl animate-spin-slow"></div>
          </div>
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
} 