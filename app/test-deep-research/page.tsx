'use client';

import { useState } from 'react';
import { Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestDeepResearch() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [testCases] = useState([
    'Research the market opportunity for electric vehicles in Europe',
    'Analyze the competitive landscape for cloud computing providers',
    'What are the latest trends in artificial intelligence?',
    'Study the impact of remote work on commercial real estate',
    'Research the economic impact of AI on healthcare systems'
  ]);

  const handleTest = async (testPrompt: string) => {
    setPrompt(testPrompt);
    setLoading(true);
    setResult('');
    setError('');

    try {
      const response = await fetch('/api/openai/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          model: 'o3-deep-research',
          tools: ['web_search_preview', 'code_interpreter'],
          maxToolCalls: 10,
          background: false
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.output_text || 'No output received');
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTest = async () => {
    if (!prompt.trim()) return;
    await handleTest(prompt);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Deep Research Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            Test OpenAI's deep research models with web search and code interpreter capabilities.
          </p>

          {/* Custom Test */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Custom Research Request</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your research question..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleCustomTest}
                disabled={loading || !prompt.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Research
              </button>
            </div>
          </div>

          {/* Test Cases */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Sample Research Requests</h2>
            <div className="grid gap-3">
              {testCases.map((testCase, index) => (
                <button
                  key={index}
                  onClick={() => handleTest(testCase)}
                  disabled={loading}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{testCase}</span>
                    {loading && prompt === testCase && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Research Results
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-96 overflow-y-auto">
                  {result}
                </pre>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Error
              </h2>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Enter a custom research question or click a sample request</li>
              <li>• The system will use web search and code interpreter to find comprehensive information</li>
              <li>• Results include inline citations and source references</li>
              <li>• Research can take 30-60 seconds for comprehensive analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 