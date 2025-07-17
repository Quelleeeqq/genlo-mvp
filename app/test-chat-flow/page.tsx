'use client';

import { useState } from 'react';
import DashboardChat from '@/components/DashboardChat';

export default function TestChatFlowPage() {
  const [showChat, setShowChat] = useState(false);

  const samplePrompts = [
    {
      category: 'Text Generation',
      prompts: [
        'What are the latest trends in AI technology?',
        'Explain quantum computing in simple terms',
        'Write a short story about a robot learning to paint',
        'What are the benefits of meditation for productivity?'
      ]
    },
    {
      category: 'Image Generation',
      prompts: [
        'Generate an image of a futuristic city skyline',
        'Create a picture of a cat sitting on a laptop',
        'Draw a beautiful sunset over mountains',
        'Make an image of a modern office workspace'
      ]
    },
    {
      category: 'Creative Tasks',
      prompts: [
        'Write a creative poem about artificial intelligence',
        'Compose a short story about time travel',
        'Create a brainstorming session for a new product idea',
        'Write a song about digital transformation'
      ]
    },
    {
      category: 'Structured Outputs Demo',
      prompts: [
        'Analyze the current state of renewable energy with confidence levels',
        'Provide a step-by-step guide to starting a business with suggestions',
        'Research the impact of social media on mental health with sources',
        'Create a detailed analysis of electric vehicle market trends'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Chat Flow Test
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Test the new structured outputs, enhanced prompting, and intelligent routing system
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {showChat ? 'Hide Chat' : 'Show Chat Interface'}
            </button>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2">Structured Outputs</h3>
            <p className="text-gray-600 text-sm">
              Reliable JSON responses with confidence levels, suggestions, and metadata
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Enhanced Prompts</h3>
            <p className="text-gray-600 text-sm">
              Claude AI enhances prompts for better OpenAI generation results
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="text-lg font-semibold mb-2">Smart Routing</h3>
            <p className="text-gray-600 text-sm">
              Intelligent routing between Claude (creative) and OpenAI (general)
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🖼️</div>
            <h3 className="text-lg font-semibold mb-2">Image-to-Image</h3>
            <p className="text-gray-600 text-sm">
              Upload reference images for more accurate product generation
            </p>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Sample Prompts to Test</h2>
          
          <div className="space-y-6">
            {samplePrompts.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  {category.category}
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {category.prompts.map((prompt, promptIndex) => (
                    <div
                      key={promptIndex}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={() => {
                        if (showChat) {
                          // You could implement auto-filling the chat here
                          console.log('Sample prompt:', prompt);
                        }
                      }}
                    >
                      <p className="text-sm text-gray-700">{prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Technical Implementation</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Structured Output Schemas</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>ChatResponseSchema:</strong> Content, confidence, suggestions, metadata</li>
                <li>• <strong>ImageGenerationSchema:</strong> Description, style, mood, composition</li>
                <li>• <strong>CreativeTaskSchema:</strong> Content, genre, tone, themes, word count</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">API Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Conversation State:</strong> Maintains context across messages</li>
                <li>• <strong>Error Handling:</strong> Graceful fallbacks and retry logic</li>
                <li>• <strong>Rate Limiting:</strong> Built-in protection against API limits</li>
                <li>• <strong>Usage Tracking:</strong> Token usage and cost monitoring</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        {showChat && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Interactive Chat Interface</h2>
            <div className="h-96">
              <DashboardChat />
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">For Text Responses:</h4>
              <ul className="space-y-1">
                <li>• Ask general questions or request information</li>
                <li>• Get structured responses with confidence levels</li>
                <li>• Receive helpful suggestions and follow-up ideas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Image Generation:</h4>
              <ul className="space-y-1">
                <li>• Use words like "generate", "create", "draw"</li>
                <li>• Upload reference images for better accuracy</li>
                <li>• Get enhanced prompts automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 