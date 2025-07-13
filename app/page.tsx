'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, MessageCircle, Shield, Zap, CheckCircle, Users, Target } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-black dark:via-gray-900 dark:to-gray-800 perspective-2000">
      {/* Floating 3D Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-float-3d" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-green-500/10 rounded-full animate-tilt" />
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-purple-500/10 rounded-full animate-depth-float" />
        <div className="absolute bottom-20 right-10 w-12 h-12 bg-orange-500/10 rounded-full animate-rotate-3d" />
      </div>

      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center transform-style-3d">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 3D Floating Title */}
          <div className="perspective-1000">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 animate-slide-up transform-style-3d hover:animate-tilt">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Document
              </span>
              <br />
              <span className="inline-block animate-float-3d">
                Review Platform
              </span>
            </h1>
          </div>

          {/* 3D Subtitle */}
          <div className="perspective-1000">
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 animate-slide-up [animation-delay:0.2s] transform-style-3d hover:animate-depth-float">
              AI-powered analysis for legal documents and product requirements
            </p>
          </div>

          {/* 3D CTA Buttons */}
          <div className="perspective-1000 animate-slide-up [animation-delay:0.4s] flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/legalDoc">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform-style-3d transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:rotate-3d animate-glow"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(20px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateZ(30px) rotateX(10deg) rotateY(10deg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateZ(20px) rotateX(0deg) rotateY(0deg)'
                }}
              >
                Legal Document Review
                <Shield className="ml-2 h-5 w-5 animate-bounce" />
              </Button>
            </Link>
            <Link href="/productReview">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-4 text-lg font-semibold border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white shadow-lg transform-style-3d transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:rotate-3d animate-glow"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(20px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateZ(30px) rotateX(10deg) rotateY(10deg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateZ(20px) rotateX(0deg) rotateY(0deg)'
                }}
              >
                Product Review
                <Target className="ml-2 h-5 w-5 animate-bounce" />
              </Button>
            </Link>
            <Link href="/botCardReview">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-4 text-lg font-semibold border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white shadow-lg transform-style-3d transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:rotate-3d animate-glow"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(20px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateZ(30px) rotateX(10deg) rotateY(10deg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateZ(20px) rotateX(0deg) rotateY(0deg)'
                }}
              >
                Bot Card Review
                <MessageCircle className="ml-2 h-5 w-5 animate-bounce" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 3D Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <FileText className="absolute top-1/4 left-1/4 w-8 h-8 text-blue-500/30 animate-float-3d [animation-delay:0.5s]" />
          <Shield className="absolute top-1/3 right-1/4 w-6 h-6 text-green-500/30 animate-tilt [animation-delay:1s]" />
          <MessageCircle className="absolute bottom-1/3 left-1/3 w-7 h-7 text-purple-500/30 animate-depth-float [animation-delay:1.5s]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 transform-style-3d">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 perspective-1000">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 animate-slide-up transform-style-3d hover:animate-tilt">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 animate-slide-up [animation-delay:0.2s] transform-style-3d hover:animate-depth-float">
              AI-powered analysis for both legal documents and product requirements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 perspective-1500">
            {/* Feature Cards with 3D Effects */}
            {[
              {
                icon: Shield,
                title: "Legal Document Analysis",
                description: "Founder-focused AI that identifies problematic clauses and protects your interests",
                delay: "0s"
              },
              {
                icon: Target,
                title: "Product Review",
                description: "Brutally honest PRD analysis that cuts through fluff and focuses on user problems",
                delay: "0.2s"
              },
              {
                icon: MessageCircle,
                title: "Interactive Chat",
                description: "Ask questions about your documents and get instant, expert-level answers",
                delay: "0.4s"
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl transform-style-3d transition-all duration-500 hover:shadow-2xl group animate-slide-up"
                style={{
                  animationDelay: feature.delay,
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
                  <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transform-style-3d group-hover:animate-rotate-3d ${
                    feature.title === "Legal Document Analysis" ? "bg-blue-100 dark:bg-blue-900/30" :
                    feature.title === "Product Review" ? "bg-orange-100 dark:bg-orange-900/30" :
                    "bg-purple-100 dark:bg-purple-900/30"
                  }`}>
                    <feature.icon className={`w-8 h-8 ${
                      feature.title === "Legal Document Analysis" ? "text-blue-600 dark:text-blue-400" :
                      feature.title === "Product Review" ? "text-orange-600 dark:text-orange-400" :
                      "text-purple-600 dark:text-purple-400"
                    }`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white transform-style-3d group-hover:animate-float-3d">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-center leading-relaxed transform-style-3d group-hover:animate-depth-float">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                
                {/* 3D Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
                  feature.title === "Legal Document Analysis" ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10" :
                  feature.title === "Product Review" ? "bg-gradient-to-r from-orange-500/10 to-red-500/10" :
                  "bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                }`} />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900/50 transform-style-3d">
        <div className="max-w-4xl mx-auto text-center perspective-1000">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-12 animate-slide-up transform-style-3d hover:animate-tilt">
            Make Better Decisions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Save Time & Money",
                description: "Catch issues early before expensive reviews and failed launches"
              },
              {
                icon: Users,
                title: "Expert-Level Analysis",
                description: "AI trained on best practices from top lawyers and product managers"
              }
            ].map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start space-x-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transform-style-3d transition-all duration-500 hover:shadow-2xl animate-slide-up group"
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
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center transform-style-3d group-hover:animate-perspective-spin">
                  <benefit.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transform-style-3d group-hover:animate-float-3d">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 transform-style-3d group-hover:animate-depth-float">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 text-center transform-style-3d">
        <div className="max-w-4xl mx-auto perspective-1000">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 animate-slide-up transform-style-3d hover:animate-tilt">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 animate-slide-up [animation-delay:0.2s] transform-style-3d hover:animate-depth-float">
            Upload your document and get expert-level AI analysis in seconds
          </p>
                      <div className="animate-slide-up [animation-delay:0.4s] perspective-1000 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/legalDoc">
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform-style-3d transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-glow"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(20px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateZ(30px) rotateX(10deg) rotateY(10deg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateZ(20px) rotateX(0deg) rotateY(0deg)'
                  }}
                >
                  Legal Documents
                  <Shield className="ml-2 h-5 w-5 animate-bounce" />
                </Button>
              </Link>
              <Link href="/productReview">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white shadow-lg transform-style-3d transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-glow"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(20px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateZ(30px) rotateX(10deg) rotateY(10deg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateZ(20px) rotateX(0deg) rotateY(0deg)'
                  }}
                >
                  Product Reviews
                  <Target className="ml-2 h-5 w-5 animate-bounce" />
                </Button>
              </Link>
            </div>
        </div>
      </section>

      {/* 3D Floating Background Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-500/20 rounded-full animate-float-3d [animation-delay:2s]" />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-500/20 rounded-full animate-tilt [animation-delay:3s]" />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-green-500/20 rounded-full animate-depth-float [animation-delay:4s]" />
        <div className="absolute bottom-1/2 right-1/4 w-2 h-2 bg-orange-500/20 rounded-full animate-rotate-3d [animation-delay:5s]" />
      </div>
    </div>
  )
} 