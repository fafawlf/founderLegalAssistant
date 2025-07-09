'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Scale, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              AI Legal Assistant
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Get instant, founder-focused legal document analysis from a Silicon Valley law firm perspective. 
              Identify risks, negotiate better terms, and protect your startup.
            </p>
            <Link href="/legalDoc">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Document Review
                <FileText className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <Scale className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>Founder-Focused Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI trained to always stand on the founder's side and maximize your benefit in every negotiation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Risk Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Identify time-sensitive risks and hidden clauses that founders often miss while busy building.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Zap className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <CardTitle>Instant Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get concrete, actionable advice with specific alternative wording and negotiation strategies.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Ready to Review Your Documents?</CardTitle>
                <CardDescription className="text-blue-100">
                  Upload PDFs, Word documents, or paste text directly for instant analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/legalDoc">
                  <Button variant="secondary" size="lg" className="text-lg px-8 py-3">
                    Get Started Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 