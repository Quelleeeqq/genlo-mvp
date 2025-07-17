'use client';

import { useState } from 'react';
import { Image, Eye, Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';

export default function TestGPTImage() {
  const [mode, setMode] = useState<'generate' | 'analyze'>('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detail, setDetail] = useState<'low' | 'high' | 'auto'>('auto');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResult('');
    setError('');
    setGeneratedImage('');

    try {
      const response = await fetch('/api/openai/gpt-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          prompt: prompt.trim(),
          model: 'gpt-4.1-mini'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedImage(`data:image/png;base64,${data.imageData}`);
        setResult('Image generated successfully!');
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setResult('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('prompt', prompt.trim() || 'What is in this image?');
      formData.append('image', selectedFile);
      formData.append('detail', detail);
      formData.append('model', 'gpt-4.1-mini');

      const response = await fetch('/api/openai/gpt-image', {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.output_text || 'Analysis completed');
      } else {
        setError(data.error || 'Failed to analyze image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const testPrompts = [
    'A gray tabby cat hugging an otter with an orange scarf',
    'A glass cabinet displaying the most popular semi-precious stones',
    'A futuristic cityscape with flying cars and neon lights',
    'A cozy coffee shop interior with warm lighting',
    'A majestic mountain landscape at sunset'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GPT Image 1 Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            Test OpenAI's latest GPT Image 1 model for image generation and vision analysis.
          </p>

          {/* Mode Toggle */}
          <div className="mb-8">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('generate')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'generate' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Image className="w-4 h-4 inline mr-2" />
                Generate Images
              </button>
              <button
                onClick={() => setMode('analyze')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'analyze' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Analyze Images
              </button>
            </div>
          </div>

          {mode === 'generate' ? (
            /* Image Generation Mode */
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Generate Images with GPT Image 1</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sample Prompts
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {testPrompts.map((testPrompt, index) => (
                        <button
                          key={index}
                          onClick={() => setPrompt(testPrompt)}
                          className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          {testPrompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
                    {loading ? 'Generating...' : 'Generate Image'}
                  </button>
                </div>
              </div>

              {/* Generated Image */}
              {generatedImage && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Generated Image</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="max-w-full h-auto rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Image Analysis Mode */
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Analyze Images with GPT Image 1</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        Click to upload an image
                      </label>
                      {selectedFile && (
                        <p className="mt-2 text-sm text-gray-600">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Prompt (Optional)
                    </label>
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="What would you like to know about this image?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detail Level
                    </label>
                    <select
                      value={detail}
                      onChange={(e) => setDetail(e.target.value as 'low' | 'high' | 'auto')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="auto">Auto (Let model decide)</option>
                      <option value="low">Low (85 tokens, faster)</option>
                      <option value="high">High (More detailed analysis)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !selectedFile}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                    {loading ? 'Analyzing...' : 'Analyze Image'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Result
              </h3>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-green-800">{result}</pre>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Error
              </h3>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">About GPT Image 1</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Image Generation:</strong> Uses world knowledge for better instruction following</li>
              <li>• <strong>Vision Analysis:</strong> Understands images with text, objects, colors, and textures</li>
              <li>• <strong>Detail Levels:</strong> Low (85 tokens) for speed, High for detailed analysis</li>
              <li>• <strong>Supported Formats:</strong> PNG, JPEG, WEBP, GIF (non-animated)</li>
              <li>• <strong>Size Limits:</strong> Up to 50 MB per request</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 