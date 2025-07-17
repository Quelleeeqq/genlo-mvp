'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Download, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Veo3FormData {
  scene1: string;
  scene2: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: '1080p' | '4k' | '720p';
  duration: '8' | '15';
  style: 'realistic' | 'cinematic' | 'documentary' | 'hyperrealistic' | 'dramatic';
  audioGeneration: 'native' | 'dialogue' | 'effects' | 'silent';
  seed?: number;
  enhancePrompt: boolean;
  negativePrompt?: string;
  userId?: string;
}

interface Veo3Provider {
  name: string;
  endpoint: string;
  rateLimit?: number;
  model?: string;
}

interface GenerationStep {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  message: string;
}

export default function Veo3VideoGenerator() {
  const [formData, setFormData] = useState<Veo3FormData>({
    scene1: '',
    scene2: '',
    aspectRatio: '16:9',
    resolution: '1080p',
    duration: '8',
    style: 'realistic',
    audioGeneration: 'native',
    enhancePrompt: true,
    negativePrompt: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 1, name: 'Research', status: 'pending', message: 'Researching scene context...' },
    { id: 2, name: 'Prompt Gen', status: 'pending', message: 'Generating Veo 3 Fast prompts...' },
    { id: 3, name: 'Veo 3 Fast Gen', status: 'pending', message: 'Generating with Veo 3 Fast...' },
    { id: 4, name: 'Merge', status: 'pending', message: 'Merging videos...' }
  ]);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<{ videoUrl: string; cost: string; success?: boolean; research?: string; prompts?: string; videos?: any; provider?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [isProMember, setIsProMember] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<string | null>(null);
  const [photoDescription, setPhotoDescription] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const veoProviders: Record<string, Veo3Provider> = {
    'google-cloud': {
      name: 'Google Cloud Vertex AI',
      endpoint: 'https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.0-generate-preview:generateVideo',
      rateLimit: 10
    },
    'replicate': {
      name: 'Replicate',
      endpoint: 'https://api.replicate.com/v1/predictions',
      model: 'google/veo-3-fast'
    },
    'aimlapi': {
      name: 'AI/ML API',
      endpoint: 'https://api.aimlapi.com/v1/generate/video/veo-3'
    },
    'pollo': {
      name: 'Pollo AI',
      endpoint: 'https://api.pollo.ai/v1/veo3/generate'
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateStep = (stepId: number, status: GenerationStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message: message || step.message }
        : step
    ));
  };

  const generateVideo = async () => {
    if (!formData.scene1 || !formData.scene2) {
      setError('Please fill in scene descriptions');
      return;
    }

    // Always use the main generate endpoint - API keys are configured on the backend
    const apiEndpoint = '/api/veo3/generate';
    
    // Add user ID to the request for subscription validation
    // If photoDescription exists, prepend it to the scene descriptions as context
    let scene1 = formData.scene1;
    let scene2 = formData.scene2;
    if (photoDescription) {
      scene1 = `[Image context: ${photoDescription}]\n` + scene1;
      scene2 = `[Image context: ${photoDescription}]\n` + scene2;
    }
    const requestData = {
      ...formData,
      scene1,
      scene2,
      userId: 'demo-user-123' // Replace with actual user ID from authentication
    };

    setIsGenerating(true);
    setError(null);
    setRequiresUpgrade(false);
    setProgress(0);
    setCurrentStep(0);
    setLogs([]);
    setResult(null);

    try {
      // Step 1: Research
      updateStep(1, 'active');
      setCurrentStep(1);
      setProgress(10);
      addLog('🔍 Starting web research for scene context...');
      
      // Step 2: Generate prompts
      updateStep(2, 'active');
      setCurrentStep(2);
      setProgress(30);
      addLog('📝 Generating GenLo optimized prompts...');
      
      // Step 3: Generate videos
      updateStep(3, 'active');
      setCurrentStep(3);
      setProgress(55);
      addLog('📡 Using configured Veo 3 Fast provider for generation');
      addLog('🎥 Generating videos with Veo 3 Fast...');
      
      // Make API call to our backend
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if this is a subscription error
        if (errorData.requiresUpgrade) {
          setRequiresUpgrade(true);
          throw new Error(errorData.error || 'Subscription required');
        }
        
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const result = await response.json();
      
      addLog('✅ Research completed');
      updateStep(1, 'completed');
      addLog('✅ Veo 3 Fast prompts generated');
      updateStep(2, 'completed');
      addLog('✅ Videos generated successfully with Veo 3 Fast');
      updateStep(3, 'completed');
      setProgress(85);

      // Step 4: Merge videos
      updateStep(4, 'active');
      setCurrentStep(4);
      setProgress(90);
      addLog('🔧 Merging videos...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('✅ Videos merged successfully');
      updateStep(4, 'completed');
      setProgress(100);

      // Set result
      setResult({
        videoUrl: result.videos.merged,
        cost: result.cost
      });

      // Add research and prompts to logs
      addLog('📋 Research Results: ' + result.research.substring(0, 100) + '...');
      addLog('📝 Generated Prompts: ' + result.prompts.substring(0, 100) + '...');
      addLog('🎬 Scene 1 Video: ' + result.videos.scene1);
      addLog('🎬 Scene 2 Video: ' + result.videos.scene2);
      addLog('🎬 Merged Video: ' + result.videos.merged);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
      addLog(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Check subscription status on component mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // In a real app, you'd get the user ID from authentication
        const userId = 'demo-user-123'; // Replace with actual user ID
        
        const response = await fetch(`/api/subscription/check?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setIsProMember(data.subscription.isPro);
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    checkSubscription();
  }, []);

  const downloadVideo = () => {
    if (result?.videoUrl) {
      const link = document.createElement('a');
      link.href = result.videoUrl;
      link.download = 'veo3-generated-video.mp4';
      link.click();
    }
  };

    return (
    <div className="space-y-8">
      {/* Pro Feature Banner */}
      {!isLoadingSubscription && (
        <div className={`rounded-xl p-6 ${isProMember ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-purple-600 to-blue-600'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                {isProMember ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isProMember ? 'Pro Member' : 'Pro Feature'}
                </h3>
                <p className="text-sm opacity-90">
                  {isProMember 
                    ? 'You have access to GenLo Veo 3 Fast Video Generation' 
                    : 'GenLo Veo 3 Fast Video Generation is available exclusively for Pro members'
                  }
                </p>
              </div>
            </div>
            {!isProMember && (
              <Link href="/pricing">
                <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Upgrade to Pro
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); generateVideo(); }} className="p-8 space-y-8">

          {/* Scene Configuration */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-1 h-6 bg-black rounded mr-3"></div>
              Scene Configuration
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Scene 1 Description</label>
                <textarea
                  value={formData.scene1}
                  onChange={(e) => setFormData(prev => ({ ...prev, scene1: e.target.value }))}
                  placeholder="Describe the first scene you want to create..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all duration-200 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Scene 2 Description</label>
                <textarea
                  value={formData.scene2}
                  onChange={(e) => setFormData(prev => ({ ...prev, scene2: e.target.value }))}
                  placeholder="Describe the second scene you want to create..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all duration-200 text-black"
                  required
                />
              </div>
            </div>
          </div>

          {/* Upload Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={async e => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setUploadedPhoto(file);
                  setPhotoAnalysis(null);
                  setPhotoDescription(null);
                  setIsAnalyzingPhoto(true);
                  // Scan/analyze the image
                  const formData = new FormData();
                  formData.append('prompt', 'Describe this image');
                  formData.append('image', file);
                  try {
                    const response = await fetch('/api/image-analysis', {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await response.json();
                    if (response.ok && data) {
                      setPhotoAnalysis('Image uploaded and scanned successfully.');
                      setPhotoDescription(data.description || null);
                    } else if (data && data.error) {
                      setPhotoAnalysis('Image scan failed: ' + data.error);
                      setPhotoDescription(null);
                    } else {
                      setPhotoAnalysis('Image scan failed.');
                      setPhotoDescription(null);
                    }
                  } catch (err) {
                    setPhotoAnalysis('Image scan failed.');
                    setPhotoDescription(null);
                  } finally {
                    setIsAnalyzingPhoto(false);
                  }
                } else {
                  setUploadedPhoto(null);
                  setPhotoAnalysis(null);
                  setPhotoDescription(null);
                }
              }}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {uploadedPhoto && (
              <div className="mt-2 text-xs text-gray-600">Selected: {uploadedPhoto.name}</div>
            )}
            {isAnalyzingPhoto && (
              <div className="mt-2 text-xs text-blue-600">Analyzing photo...</div>
            )}
            {photoAnalysis && (
              <div className="mt-2 text-xs text-green-600">{photoAnalysis}</div>
            )}
            {photoDescription && (
              <div className="mt-2 text-xs text-black">Analysis: {photoDescription}</div>
            )}
          </div>

          {/* Generation Settings */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-1 h-6 bg-black rounded mr-3"></div>
              Generation Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aspect Ratio</label>
                <select
                  value={formData.aspectRatio}
                  onChange={(e) => setFormData(prev => ({ ...prev, aspectRatio: e.target.value as Veo3FormData['aspectRatio'] }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-black"
                >
                  <option value="16:9">16:9 (Widescreen)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Square)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution</label>
                <select
                  value={formData.resolution}
                  onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value as Veo3FormData['resolution'] }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-black"
                >
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="4k">4K (Ultra HD)</option>
                  <option value="720p">720p (HD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Video Length Selection */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-900 mb-2">Video Length</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value as Veo3FormData['duration'] }))}
              className="w-full p-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black bg-white text-lg font-semibold"
            >
              <option value="8">8 seconds</option>
              <option value="15">15 seconds</option>
            </select>
          </div>

          {/* Veo 3 Fast Specific Settings */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-1 h-6 bg-black rounded mr-3"></div>
              Veo 3 Fast Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Seed (Optional)</label>
                <input
                  type="number"
                  value={formData.seed || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, seed: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="Random seed for reproducible results"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-black"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for random generation</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Enhance Prompt</label>
                <div className="flex items-center p-3 border border-gray-300 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.enhancePrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, enhancePrompt: e.target.checked }))}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Use Gemini to enhance your prompts
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Negative Prompt (Optional)</label>
              <textarea
                value={formData.negativePrompt || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, negativePrompt: e.target.value }))}
                placeholder="Description of what to discourage in the generated video..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all duration-200 text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Describe what you don't want in the video</p>
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isGenerating || !isProMember}
              className={`flex-1 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg ${
                isProMember 
                  ? 'bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating Video with Veo 3 Fast...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {isProMember ? 'Generate Video with Veo 3 Fast' : 'Upgrade to Generate Videos'}
                </>
              )}
            </button>
            
            {/* Test Mode Button */}
            <button
              type="button"
              onClick={async () => {
                if (isGenerating) return;
                
                setIsGenerating(true);
                setError(null);
                setResult(null);
                setLogs([]);
                setProgress(0);
                
                // Reset steps
                setSteps([
                  { id: 1, name: 'Research', status: 'pending', message: 'Analyzing scenes...' },
                  { id: 2, name: 'Prompts', status: 'pending', message: 'Generating prompts...' },
                  { id: 3, name: 'Veo 3 Fast', status: 'pending', message: 'Generating videos...' },
                  { id: 4, name: 'Merge', status: 'pending', message: 'Merging scenes...' }
                ]);
                
                try {
                  addLog('🧪 Starting test mode (mock data)...');
                  updateStep(1, 'active', 'Researching scenes...');
                  setProgress(25);
                  
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  updateStep(1, 'completed', 'Research completed');
                  updateStep(2, 'active', 'Generating prompts...');
                  setProgress(50);
                  addLog('📝 Generated optimized prompts');
                  
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  updateStep(2, 'completed', 'Prompts generated');
                  updateStep(3, 'active', 'Generating videos...');
                  setProgress(75);
                  addLog('🎬 Generating mock videos...');
                  
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  updateStep(3, 'completed', 'Videos generated');
                  updateStep(4, 'active', 'Merging scenes...');
                  setProgress(90);
                  addLog('🔗 Merging video scenes...');
                  
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  updateStep(4, 'completed', 'Merge completed');
                  setProgress(100);
                  addLog('✅ Test generation completed!');
                  
                  // Mock result
                  setResult({
                    videoUrl: 'https://example.com/test-merged.mp4',
                    success: true,
                    research: `Test research for: ${formData.scene1} and ${formData.scene2}`,
                    prompts: `Test prompts generated for both scenes`,
                    videos: {
                      scene1: 'https://example.com/test-scene1.mp4',
                      scene2: 'https://example.com/test-scene2.mp4',
                      merged: 'https://example.com/test-merged.mp4'
                    },
                    provider: 'Test Provider (Mock)',
                    cost: 'Free (Test Mode)'
                  });
                  
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Test generation failed');
                  addLog(`❌ Test Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg disabled:bg-gray-50 disabled:text-gray-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Test Interface (Mock Data)
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Upgrade Prompt */}
      {requiresUpgrade && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro Feature Required</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              GenLo Video Generation is exclusively available for Pro members. Upgrade your subscription to unlock this powerful AI video generation feature.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pricing">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                  Upgrade to Pro - $29/month
                </button>
              </Link>
              <button 
                onClick={() => setRequiresUpgrade(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>✓ Unlimited GenLo video generation</p>
              <p>✓ Priority processing</p>
              <p>✓ Advanced video settings</p>
              <p>✓ Priority support</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Section */}
      {isGenerating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Veo 3 Fast Generation Progress</h3>
          
          {/* Step Indicators */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`text-center p-4 rounded-lg transition-all duration-200 ${
                  step.status === 'active' 
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-800'
                    : step.status === 'completed'
                    ? 'bg-green-50 border-2 border-green-500 text-green-800'
                    : 'bg-gray-50 border-2 border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : step.status === 'active' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                  )}
                  <span className="font-medium">{step.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div 
              className="bg-black h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-center text-gray-700 font-medium mb-6">
            {steps.find(s => s.status === 'active')?.message || 'Processing...'}
          </p>

          {/* Logs */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
            <h4 className="font-semibold text-gray-900 mb-3">Generation Logs:</h4>
            <div className="font-mono text-sm text-gray-700 space-y-1">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            Generation Complete!
          </h3>
          
          <div className="text-center">
            <div className="bg-black text-white p-8 rounded-xl mb-6">
              <h4 className="text-2xl font-bold mb-2">Veo 3 Fast Video Generated</h4>
              <p className="opacity-90">Ultra-Fast Generation • High Quality • GenLo Powered</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700">
                <strong>Cost:</strong> {result.cost}
              </p>
                                <p className="text-sm text-gray-600 mt-1">
                    Resolution: {formData.resolution} | 
                    Generated: {new Date().toLocaleString()}
                  </p>
            </div>

            <button
              onClick={downloadVideo}
              className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Download className="w-4 h-4" />
              Download Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 