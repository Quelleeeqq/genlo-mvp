'use client';

import { useState, useEffect } from 'react';
import { Play, Download, RefreshCw } from 'lucide-react';

const PLACEHOLDER_VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4';

interface VideoGeneratorProps {
  onVideoGenerated?: (video: any) => void;
  initialActor?: any;
}

type GeneratedVideo = {
  videoUrl: string;
  thumbnailUrl: string;
  actor: any; // Removed actor type as it's no longer used
  metadata: { language: string; emotion: string; speed: string };
  duration: number;
};

export default function VideoGenerator({ onVideoGenerated, initialActor }: VideoGeneratorProps) {
  const [scene1, setScene1] = useState('');
  const [scene2, setScene2] = useState('');
  // Remove all actor-related state, mock data, and UI
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [language, setLanguage] = useState('en-US');
  const [emotion, setEmotion] = useState('neutral');
  const [speed, setSpeed] = useState('normal');
  const [videoLength, setVideoLength] = useState(8);

  const languages = [
    { code: 'en-US', name: 'English (USA)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese' },
  ];

  const emotions = [
    { value: 'neutral', label: 'Neutral' },
    { value: 'excited', label: 'Excited' },
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'confident', label: 'Confident' },
  ];

  // Remove all actor-related useEffect
  // useEffect(() => {
  //   if (initialActor) {
  //     setSelectedActor(initialActor);
  //   }
  // }, [initialActor]);

  // Refactor to generate videos without actor selection
  const generateVideo = async () => {
    if (!scene1.trim() || !scene2.trim()) return;
    setLoading(true);
    setVideoStatus('processing');

    try {
      const response = await fetch('/api/veo3/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene1,
          scene2,
          language,
          emotion,
          speed,
          duration: videoLength,
        }),
      });

      const data = await response.json();

      if (response.ok && data.videos && data.videos.merged) {
        setGeneratedVideo({
          videoUrl: data.videos.merged,
          thumbnailUrl: 'https://via.placeholder.com/150', // Optionally use a real thumbnail
          actor: null,
          metadata: { language, emotion, speed },
          duration: videoLength,
        });
        setVideoStatus('completed');
      } else {
        setVideoStatus('failed');
      }
    } catch (err) {
      setVideoStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = () => {
    if (generatedVideo?.videoUrl) {
      const link = document.createElement('a');
      link.href = generatedVideo.videoUrl;
      link.download = `quelle-video.mp4`;
      link.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Video Generator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create professional video ads with AI actors. No signup required.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Scene 1 Prompt */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scene 1
            </label>
            <textarea
              value={scene1}
              onChange={(e) => setScene1(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter your first scene script here..."
              required
            />
          </div>
          {/* Scene 2 Prompt */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scene 2
            </label>
            <textarea
              value={scene2}
              onChange={(e) => setScene2(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter your second scene script here..."
              required
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emotion
              </label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {emotions.map((emotion) => (
                  <option key={emotion.value} value={emotion.value}>
                    {emotion.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Speed
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video Length
              </label>
              <select
                value={videoLength}
                onChange={(e) => setVideoLength(8)} // Always set to 8
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled
              >
                <option value={8}>8 seconds (max)</option>
              </select>
            </div>
          </div>
          <button
            onClick={generateVideo}
            disabled={loading || !scene1.trim() || !scene2.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Generate Video
              </>
            )}
          </button>
        </div>
        {/* Output Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
          {videoStatus === 'idle' && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Play className="w-12 h-12 mx-auto mb-2" />
              <p>Your video will appear here</p>
            </div>
          )}
          {videoStatus === 'processing' && (
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-2 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Generating your video...</p>
              <p className="text-sm text-gray-500">This usually takes 2-3 seconds</p>
            </div>
          )}
          {videoStatus === 'completed' && generatedVideo && (
            <div className="w-full">
              <video
                src={generatedVideo.videoUrl}
                controls
                className="w-full rounded-lg"
                poster={generatedVideo.thumbnailUrl}
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={downloadVideo}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    setGeneratedVideo(null);
                    setVideoStatus('idle');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  New Video
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Video Details</h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Scene 1: {scene1}</p>
                  <p>Scene 2: {scene2}</p>
                  <p>Actor: {generatedVideo.actor ? generatedVideo.actor.name : 'N/A'}</p>
                  <p>Duration: {generatedVideo.duration}s</p>
                  <p>Language: {generatedVideo.metadata?.language}</p>
                  <p>Emotion: {generatedVideo.metadata?.emotion}</p>
                  <p>Speed: {generatedVideo.metadata?.speed}</p>
                </div>
              </div>
            </div>
          )}
          {videoStatus === 'failed' && (
            <div className="text-center text-red-600 dark:text-red-400">
              <p>Failed to generate video</p>
              <button
                onClick={() => setVideoStatus('idle')}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 