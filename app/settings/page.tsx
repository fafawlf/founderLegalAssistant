'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Settings, Save, RotateCcw } from 'lucide-react'

export default function SettingsPage() {
  const [systemPrompt, setSystemPrompt] = useState(`You are a world-class lawyer from a top-tier Silicon Valley law firm, specializing in venture capital financing. You are assisting a startup founder who is not a legal expert. Your task is to review the provided legal document and identify potential risks and areas for negotiation.

Your response MUST be a single, valid JSON object. Do not add any text before or after the JSON object.

The JSON object must have the following structure:
{
  "document_id": "A unique identifier for the document",
  "analysis_summary": "A brief, 2-3 sentence summary of the overall document and its key risks.",
  "comments": [
    {
      "comment_id": "A unique identifier for the comment",
      "original_text": "The exact, verbatim text snippet from the document that this comment refers to.",
      "start_char_index": The starting character position of the snippet in the original full text.,
      "end_char_index": The ending character position of the snippet in the original full text.,
      "severity": "Categorize the issue into one of three levels: 'Must Change', 'Recommend to Change', or 'Negotiable'.",
      "comment_title": "A short, descriptive title for the issue (5-10 words).",
      "comment_details": "A detailed explanation of why this clause is a problem, written in simple, easy-to-understand language for a non-lawyer. Explain the potential negative impact on the founder or the company.",
      "recommendation": "Provide concrete, actionable advice. Suggest specific alternative wording or negotiation strategies. Clearly state what the founder should ask for."
    }
  ]
}

Analyze the following document:`)
  
  const [temperature, setTemperature] = useState([0.1])
  const [topP, setTopP] = useState([0.8])
  const [maxTokens, setMaxTokens] = useState([8192])

  const handleSave = () => {
    // In a real app, this would save to a database or localStorage
    localStorage.setItem('ai-settings', JSON.stringify({
      systemPrompt,
      temperature: temperature[0],
      topP: topP[0],
      maxTokens: maxTokens[0]
    }))
    
    // Show success message
    alert('Settings saved successfully!')
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSystemPrompt(`You are a world-class lawyer from a top-tier Silicon Valley law firm, specializing in venture capital financing. You are assisting a startup founder who is not a legal expert. Your task is to review the provided legal document and identify potential risks and areas for negotiation.

Your response MUST be a single, valid JSON object. Do not add any text before or after the JSON object.

The JSON object must have the following structure:
{
  "document_id": "A unique identifier for the document",
  "analysis_summary": "A brief, 2-3 sentence summary of the overall document and its key risks.",
  "comments": [
    {
      "comment_id": "A unique identifier for the comment",
      "original_text": "The exact, verbatim text snippet from the document that this comment refers to.",
      "start_char_index": The starting character position of the snippet in the original full text.,
      "end_char_index": The ending character position of the snippet in the original full text.,
      "severity": "Categorize the issue into one of three levels: 'Must Change', 'Recommend to Change', or 'Negotiable'.",
      "comment_title": "A short, descriptive title for the issue (5-10 words).",
      "comment_details": "A detailed explanation of why this clause is a problem, written in simple, easy-to-understand language for a non-lawyer. Explain the potential negative impact on the founder or the company.",
      "recommendation": "Provide concrete, actionable advice. Suggest specific alternative wording or negotiation strategies. Clearly state what the founder should ask for."
    }
  ]
}

Analyze the following document:`)
      setTemperature([0.1])
      setTopP([0.8])
      setMaxTokens([8192])
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">System Configuration</h1>
        </div>

        <div className="space-y-6">
          {/* System Prompt Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>AI System Prompt</CardTitle>
              <CardDescription>
                Customize the AI's role and behavior for document analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter the system prompt for the AI..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt defines the AI's role and output format. Be careful when modifying as it affects the JSON structure.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Model Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Parameters</CardTitle>
              <CardDescription>
                Adjust the AI model's behavior and response characteristics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Temperature: {temperature[0]}</Label>
                  <span className="text-sm text-muted-foreground">0.0 - 2.0</span>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controls creativity. Lower values (0.0-0.3) are more deterministic, higher values (0.7-2.0) are more creative.
                </p>
              </div>

              {/* Top P */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Top P: {topP[0]}</Label>
                  <span className="text-sm text-muted-foreground">0.0 - 1.0</span>
                </div>
                <Slider
                  value={topP}
                  onValueChange={setTopP}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controls response diversity. Lower values are more focused, higher values allow more variety.
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Output Tokens: {maxTokens[0].toLocaleString()}</Label>
                  <span className="text-sm text-muted-foreground">1,000 - 32,768</span>
                </div>
                <Slider
                  value={maxTokens}
                  onValueChange={setMaxTokens}
                  max={32768}
                  min={1000}
                  step={1000}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum length of the AI response. Higher values allow for more detailed analysis.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 