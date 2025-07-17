'use client';

import React, { useState } from 'react';

export default function TestLifestyleImage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLifestyleGeneration = async () => {
    setLoading(true);
    try {
      // Test with DALL-E 3 for better quality
      const response = await fetch('/api/image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Professional lifestyle photography of a friendly young woman holding a black curved back stretcher massage device with numerous small pointed acupressure nodes on surface, prominent ribbed light blue strip running down center, rigid ergonomic design for back pain relief, looking directly at camera with warm smile, hands positioned to show the product clearly, clean background, high-quality commercial photography, natural lighting, professional presentation, sharp focus, authentic expression, 8K resolution, studio lighting, professional camera, commercial product photography style, high-end retouching, magazine quality, cinematic composition, perfect exposure, vibrant colors, professional retouching, commercial advertising quality',
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'hd',
          format: 'png'
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Lifestyle Image Generation</h1>
      
      <button 
        onClick={testLifestyleGeneration}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Lifestyle Generation'}
      </button>

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.imageUrl && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Generated Image:</h3>
              <img 
                src={result.imageUrl.startsWith('data:') ? result.imageUrl : `data:image/png;base64,${result.imageUrl}`}
                alt="Generated lifestyle image"
                className="max-w-md border rounded"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 