import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const EMOTIONS = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'happy', label: 'Happy' },
  { value: 'serious', label: 'Serious' },
  { value: 'surprise', label: 'Surprise' },
];
const MODELS = [
  { value: 'eleven_multilingual_v2', label: 'Multilingual v2' },
  { value: 'eleven_turbo_v2', label: 'Turbo v2' },
  { value: 'eleven_turbo_v2_5', label: 'Turbo v2.5' },
  { value: 'eleven_flash_v2_5', label: 'Flash v2.5' },
];

export default function MultiSceneVideoGenerator({ userId, onClose }: { userId: string, onClose: () => void }) {
  // Avatars & Voices
  const [avatars, setAvatars] = useState<any[]>([]);
  const [voices, setVoices] = useState<any[]>([]);

  // Scenes
  const [scenes, setScenes] = useState<any[]>([]);

  // TTS Controls (global)
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [model, setModel] = useState(MODELS[0].value);
  const [ssml, setSsml] = useState(false);

  // Generation
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Fetch avatars and voices
  useEffect(() => {
    const fetchData = async () => {
      // Fetch D-ID avatars from local API route
      try {
        const res = await fetch('/api/did-avatars');
        const json = await res.json();
        // Map D-ID avatars to expected format
        const avatarData = (json.avatars || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          image_url: a.image_url || a.thumbnail_url,
          preview_url: a.preview_url || a.talking_preview_url,
        }));
        setAvatars(avatarData);
        // Fetch voices from Supabase as before
        const { data: voiceData } = await supabase.from('voices').select('*');
        setVoices(voiceData || []);
        setScenes([{
          text: '',
          avatarId: avatarData?.[0]?.id || '',
          voiceId: voiceData?.[0]?.id || '',
          emotion: EMOTIONS[0].value
        }]);
      } catch (err) {
        setAvatars([]);
      }
    };
    fetchData();
  }, []);

  // Scene handlers
  const addScene = () =>
    setScenes([
      ...scenes,
      {
        text: '',
        avatarId: avatars[0]?.id || '',
        voiceId: voices[0]?.id || '',
        emotion: EMOTIONS[0].value
      }
    ]);
  const removeScene = (idx: number) => setScenes(scenes.filter((_: any, i: number) => i !== idx));
  const updateScene = (idx: number, newScene: any) =>
    setScenes(scenes.map((s: any, i: number) => (i === idx ? newScene : s)));

  // Generate video
  const handleGenerate = async () => {
    setError('');
    setVideoUrl('');
    setLoading(true);
    setProgress('Submitting scenes...');
    try {
      const res = await fetch('/api/video-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          scenes,
          stability,
          similarity,
          model,
          ssml,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start video generation');
      setProgress('Generating and stitching video...');
      setVideoUrl(data.url);
      setProgress('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full p-8">
        <button className="absolute top-4 right-4 text-black bg-white/80 rounded-full p-2 shadow hover:bg-gray-100 transition" onClick={onClose} aria-label="Close Video Generator">×</button>
        <h1 className="text-3xl font-extrabold text-black mb-6">Create Multi-Scene UGC Video</h1>
        {/* Scenes */}
        {scenes.map((scene, idx) => (
          <div key={idx} className="mb-6 border-b border-gray-200 pb-4">
            <label className="block font-semibold text-black mb-1">Scene {idx + 1}</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg bg-white text-black p-3 mb-2 focus:ring-2 focus:ring-black"
              maxLength={500}
              rows={3}
              value={scene.text}
              onChange={e => updateScene(idx, { ...scene, text: e.target.value })}
              disabled={loading}
              placeholder={ssml ? 'You can use SSML tags, e.g. <break time=\"2s\"/>' : ''}
            />
            {/* Avatar Gallery with Video Preview */}
            <div className="mb-2">
              <label className="block text-xs font-semibold text-black mb-1">Avatar</label>
              <div className="flex items-center gap-4">
                {/* Preview: Show video if available, else image */}
                {avatars.length > 0 && (
                  <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center bg-gray-100 overflow-hidden">
                    {(() => {
                      const avatar = avatars.find(a => a.id === scene.avatarId);
                      if (avatar?.preview_url) {
                        return (
                          <video
                            src={avatar.preview_url}
                            className="w-full h-full object-cover rounded-full"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        );
                      } else if (avatar?.image_url) {
                        return (
                          <img
                            src={avatar.image_url}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                          />
                        );
                      } else {
                        return null;
                      }
                    })()}
                  </div>
                )}
                {/* Gallery */}
                <div className="flex gap-2 overflow-x-auto">
                  {avatars.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      className={`rounded-full border-2 p-1 transition ${
                        scene.avatarId === a.id
                          ? 'border-black ring-2 ring-black'
                          : 'border-gray-200'
                      }`}
                      onClick={() => updateScene(idx, { ...scene, avatarId: a.id })}
                      disabled={loading}
                    >
                      <img
                        src={a.image_url}
                        alt={a.name}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Voice Selector */}
            <div className="mb-2">
              <label className="block text-xs font-semibold text-black">Voice</label>
              <select
                className="bg-white border border-gray-300 rounded-lg p-2 text-black"
                value={scene.voiceId}
                onChange={e => updateScene(idx, { ...scene, voiceId: e.target.value })}
                disabled={loading}
              >
                {voices.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            {/* Emotion Selector */}
            <div className="mb-2">
              <label className="block text-xs font-semibold text-black">Emotion</label>
              <select
                className="bg-white border border-gray-300 rounded-lg p-2 text-black"
                value={scene.emotion}
                onChange={e => updateScene(idx, { ...scene, emotion: e.target.value })}
                disabled={loading}
              >
                {EMOTIONS.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            {scenes.length > 1 && (
              <button
                className="text-xs text-red-500"
                onClick={() => removeScene(idx)}
                disabled={loading}
              >
                Remove Scene
              </button>
            )}
          </div>
        ))}
        <button
          className="text-black font-semibold hover:underline mb-4"
          onClick={addScene}
          disabled={loading}
        >
          + Add Scene
        </button>
        {/* TTS Controls */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-black">Stability: {stability}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={stability}
            onChange={e => setStability(Number(e.target.value))}
            disabled={loading}
            className="w-full accent-black"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-black">Similarity Boost: {similarity}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={similarity}
            onChange={e => setSimilarity(Number(e.target.value))}
            disabled={loading}
            className="w-full accent-black"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-black">Model</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2 text-black bg-white"
            value={model}
            onChange={e => setModel(e.target.value)}
            disabled={loading}
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-black">
            <input
              type="checkbox"
              checked={ssml}
              onChange={e => setSsml(e.target.checked)}
              disabled={loading}
              className="mr-2"
            />
            Use SSML (for pauses, etc.)
          </label>
        </div>
        {/* Generate Button */}
        <button
          className="w-full bg-black text-white font-bold py-3 rounded-lg mt-6 hover:bg-gray-900 transition"
          onClick={handleGenerate}
          disabled={
            loading ||
            scenes.some(s => !s.text.trim() || !s.avatarId || !s.voiceId)
          }
        >
          {loading ? 'Generating...' : 'Generate Video'}
        </button>
        {/* Progress/Error/Result */}
        {progress && <div className="mt-4 text-blue-600">{progress}</div>}
        {error && <div className="mt-4 text-red-600">{error}</div>}
        {videoUrl && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2 text-black">Your Video</h2>
            <video src={videoUrl} controls className="w-full rounded shadow" />
            <a
              href={videoUrl}
              download
              className="block mt-2 text-blue-600 underline"
            >
              Download Video
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 