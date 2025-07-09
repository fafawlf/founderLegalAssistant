# AI Legal Document Review Assistant

An AI-powered legal document review assistant designed specifically for startup founders and entrepreneurs. This application uses Google's Gemini 1.5 Pro to analyze legal documents and provide expert-level recommendations from a Silicon Valley law firm perspective.

## 🚀 Features

### Core Functionality
- **File Upload**: Support for PDF and Word documents (DOCX, DOC)
- **Text Input**: Direct text pasting for quick analysis
- **AI Analysis**: Powered by Google Gemini 1.5 Pro for legal expertise
- **Interactive Results**: Dual-panel interface with synchronized highlighting
- **Export Functionality**: Download analysis results as JSON

### Analysis Features
- **Severity Classification**: Three levels of importance
  - 🔴 **Must Change**: Critical issues requiring immediate attention
  - 🟡 **Recommend to Change**: Important suggestions for improvement
  - 🔵 **Negotiable**: Areas for potential negotiation
- **Contextual Comments**: AI provides detailed explanations and recommendations
- **Interactive Navigation**: Click between highlighted text and comments
- **Filtering**: Filter comments by severity level

### User Experience
- **Modern UI**: Built with Next.js 14, Tailwind CSS, and Shadcn UI
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Processing**: Live feedback during document analysis
- **Error Handling**: Comprehensive error messages and validation

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI
- **AI**: Google Gemini 1.5 Pro API
- **File Processing**: pdf-parse, mammoth.js
- **Form Handling**: React Hook Form, Zod validation
- **UI Components**: Lucide React icons

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Google AI API key (Gemini 1.5 Pro)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-legal-review-assistant
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure your API key:
```bash
cp env.example .env.local
```

Edit `.env.local` and add your Google AI API key:
```env
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

### 4. Get Google AI API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env.local` file

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Uploading Documents
1. **File Upload**: Drag and drop or click to upload PDF/DOCX files
2. **Text Input**: Paste legal document text directly into the text area
3. **Processing**: Wait for AI analysis (30-60 seconds typically)

### Understanding Results
1. **Summary**: Review the overall analysis summary
2. **Original Text**: View highlighted sections in the left panel
3. **Comments**: Browse AI recommendations in the right panel
4. **Filtering**: Use severity filters to focus on specific issues
5. **Navigation**: Click highlighted text or comments to navigate between them

### Exporting Results
- Click the "Export" button to download analysis as JSON
- Share results with your legal team or co-founders

## 🔧 Configuration

### System Prompt Customization
The AI system prompt can be customized in `lib/ai-service.ts`:
```typescript
const DEFAULT_SYSTEM_PROMPT = `Your custom prompt here...`
```

### Model Parameters
Adjust AI model parameters in the analysis API:
- `temperature`: Controls creativity (0.0-2.0)
- `topP`: Controls response diversity (0.0-1.0)
- `maxOutputTokens`: Maximum response length

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── analysis-results.tsx
│   ├── file-upload.tsx
│   └── text-input.tsx
├── lib/                  # Utility functions
│   ├── ai-service.ts     # AI integration
│   ├── file-processor.ts # File processing
│   └── utils.ts          # Helper functions
├── types/                # TypeScript definitions
└── public/               # Static assets
```

## 🔒 Security Considerations

- **API Key Security**: Never commit API keys to version control
- **File Processing**: Files are processed in memory, not stored
- **Data Privacy**: No document data is stored permanently
- **HTTPS**: Use HTTPS in production for secure data transmission

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔮 Future Enhancements

- [ ] User authentication and document history
- [ ] Multiple AI model support
- [ ] Advanced export formats (PDF, Word)
- [ ] Collaborative review features
- [ ] Custom legal templates
- [ ] Integration with legal document management systems

---

Built with ❤️ for startup founders and entrepreneurs 