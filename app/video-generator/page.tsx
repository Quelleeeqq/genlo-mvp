'use client'

import { useEffect, useState, Suspense } from 'react';
import VideoGenerator from '@/components/VideoGenerator';
import FloatingGenLoAI from '../../components/FloatingGenLoAI';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

const PLACEHOLDER_VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4'; // Replace with your preferred placeholder

// Remove all actor-related state, mock data, and UI
// Replace with a simple video generator UI

function VideoGeneratorContent() {
  const searchParams = useSearchParams();
  const actorId = searchParams.get('actor');
  const initialActor = actorId ? null : null; // No longer using initialActor from search params
  const [selectedActor, setSelectedActor] = useState<any | null>(null); // Changed to any
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredActorId, setHoveredActorId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Mock data for actors
    const mockActors = [
      { id: 'actor1', name: 'Sophia', age: '25', ethnicity: 'Caucasian', thumbnailUrl: 'https://via.placeholder.com/150' },
      { id: 'actor2', name: 'Michael', age: '30', ethnicity: 'Asian', thumbnailUrl: 'https://via.placeholder.com/150' },
      { id: 'actor3', name: 'Emma', age: '22', ethnicity: 'African-American', thumbnailUrl: 'https://via.placeholder.com/150' },
      { id: 'actor4', name: 'David', age: '28', ethnicity: 'Hispanic', thumbnailUrl: 'https://via.placeholder.com/150' },
    ];
    // setActors(mockActors); // This line is no longer needed
  }, []);

  return (
    <>
      <FloatingGenLoAI onClick={() => router.push('/')} />
      <div className="min-h-screen bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-black mb-4">
              AI Video Generator
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Create stunning product videos with your choice of AI actors.<br />Welcome to the GenLo Video Studio.
            </p>
          </div>

          {/* How it works section moved here */}
          <div className="mt-0 mb-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-black mb-4">
                How it works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-black mb-2">
                    Choose Your Actor
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Browse our diverse library of AI actors and select the one that fits your brand and message.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-black mb-2">
                    Write Your Script
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Enter your video script and customize language, emotion, and speed for your ad.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-black mb-2">
                    Generate & Download
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Our AI creates a professional video with your chosen actor. Download and use it anywhere!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actor Selection Dashboard - only show if no initialActor */}
          {/* This section is no longer needed as actor selection is removed */}

          {/* Video Generator Form */}
          <div className="mb-12">
            <VideoGenerator />
          </div>
        </div>
      </div>
    </>
  );
}

export default function VideoGeneratorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoGeneratorContent />
    </Suspense>
  );
} 