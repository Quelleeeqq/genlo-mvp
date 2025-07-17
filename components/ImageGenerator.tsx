'use client';

import { useState, useRef } from 'react';
import { Download, Upload, Image as ImageIcon, Edit3, Settings, RefreshCw, X } from 'lucide-react';
import Alert from './ui/Alert';
import { useToast } from './ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ImageGeneratorProps {
  onImageGenerated?: (image: any) => void;
}

type ImageMode = 'generate' | 'edit';

type GeneratedImage = {
  imageUrl?: string;
  imageData?: string;
  format: 'url' | 'base64';
  prompt: string;
  settings: {
    model: string;
    size: string;
    quality: string;
    format: string;
    background: string;
  };
};

export default function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [mode, setMode] = useState<ImageMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  
  // Settings
  const [model, setModel] = useState('dall-e-3');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('medium');
  const [format, setFormat] = useState('png');
  const [background, setBackground] = useState('opaque');
  const [outputCompression, setOutputCompression] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Image editing
  const [inputImages, setInputImages] = useState<File[]>([]);
  const [maskImage, setMaskImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [maskPreview, setMaskPreview] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const [productDescription, setProductDescription] = useState('');

  const models = [
    { value: 'dall-e-3', label: 'DALL-E 3', description: 'High quality, larger resolutions' },
    { value: 'gpt-image-1', label: 'GPT Image 1 (Latest)', description: 'Best quality, superior instruction following with world knowledge' },
    { value: 'replicate', label: 'Replicate (FLUX Dev LoRA)', description: 'Excellent for product photography and style transfer' },
    { value: 'google-ai-studio', label: 'Google AI Studio', description: 'Powered by Google Gemini, high quality' },
    { value: 'dall-e-2', label: 'DALL-E 2', description: 'Lower cost, concurrent requests' },
  ];

  const sizes = [
    { value: '1024x1024', label: 'Square (1024×1024)' },
    { value: '1024x1536', label: 'Portrait (1024×1536)' },
    { value: '1536x1024', label: 'Landscape (1536×1024)' },
  ];

  const qualities = [
    { value: 'low', label: 'Low (Fastest)', description: '272 tokens' },
    { value: 'medium', label: 'Medium (Default)', description: '1056 tokens' },
    { value: 'high', label: 'High (Best)', description: '4160 tokens' },
  ];

  const formats = [
    { value: 'png', label: 'PNG', description: 'Lossless, supports transparency' },
    { value: 'jpeg', label: 'JPEG', description: 'Faster, smaller file size' },
    { value: 'webp', label: 'WebP', description: 'Modern format, good compression' },
  ];

  const openaiModels = ['gpt-image-1', 'dall-e-3', 'dall-e-2'];
  const openaiQualities = [
    { value: 'standard', label: 'Standard', description: 'Standard quality' },
    { value: 'hd', label: 'HD', description: 'High definition' },
  ];
  const replicateQualities = [
    { value: 'low', label: 'Low (Fastest)', description: '272 tokens' },
    { value: 'medium', label: 'Medium (Default)', description: '1056 tokens' },
    { value: 'high', label: 'High (Best)', description: '4160 tokens' },
  ];

  const { showToast } = useToast();

  const handleFileUpload = (files: FileList | null, isMask = false) => {
    if (!files || files.length === 0) return;

    if (isMask) {
      const file = files[0];
      setMaskImage(file);
      setMaskPreview(URL.createObjectURL(file));
    } else {
      const newFiles = Array.from(files);
      setInputImages(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreview(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setInputImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const removeMask = () => {
    setMaskImage(null);
    setMaskPreview('');
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      let apiEndpoint = '/api/image-gen';
      if (model === 'google-ai-studio') {
        apiEndpoint = '/api/image-gen/google';
      } else if (model === 'replicate') {
        apiEndpoint = '/api/image-gen/replicate';
      }
      
      let sendQuality = quality;
      if (openaiModels.includes(model) && sendQuality !== 'standard' && sendQuality !== 'hd') {
        sendQuality = 'standard';
      }

      const body: any = {
        prompt: prompt.trim(),
        model,
        size,
        quality: sendQuality,
        format,
        background,
        output_compression: format !== 'png' ? outputCompression : undefined,
        userId: user?.id || undefined,
      };
      if (productDescription.trim()) {
        body.newProductDescription = productDescription.trim();
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (response.ok) {
        const generated: GeneratedImage = {
          prompt: prompt.trim(),
          settings: { model, size, quality, format, background },
          ...data,
        };
        setGeneratedImage(generated);
        onImageGenerated?.(generated);
        showToast('Image generated successfully!', 'success');
      } else {
        console.error('Image generation error:', data);
        setError(data.error || 'Failed to generate image.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image.');
    } finally {
      setLoading(false);
    }
  };

  const editImage = async () => {
    if (!prompt.trim() || inputImages.length === 0) return;
    
    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt.trim());
      formData.append('model', model);
      
      let sendQuality = quality;
      if (openaiModels.includes(model) && sendQuality !== 'standard' && sendQuality !== 'hd') {
        sendQuality = 'standard';
      }
      formData.append('quality', sendQuality);
      formData.append('format', format);
      formData.append('background', background);
      
      if (format !== 'png') {
        formData.append('output_compression', outputCompression.toString());
      }

      inputImages.forEach(image => {
        formData.append('image', image);
      });

      if (maskImage) {
        formData.append('mask', maskImage);
      }

      const response = await fetch('/api/image-gen/edit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        const generated: GeneratedImage = {
          prompt: prompt.trim(),
          settings: { model, size, quality, format, background },
          ...data,
        };
        setGeneratedImage(generated);
        onImageGenerated?.(generated);
      } else {
        setError(data.error || 'Failed to edit image.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to edit image.');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    if (generatedImage.imageData) {
      // Download base64 image
      const link = document.createElement('a');
      link.href = `data:image/${format};base64,${generatedImage.imageData}`;
      link.download = `quelle-image.${format}`;
      link.click();
    } else if (generatedImage.imageUrl) {
      // Download URL image
      const link = document.createElement('a');
      link.href = generatedImage.imageUrl;
      link.download = `quelle-image.${format}`;
      link.click();
    }
  };

  const resetForm = () => {
    setPrompt('');
    setGeneratedImage(null);
    setError('');
    setInputImages([]);
    setMaskImage(null);
    setImagePreview([]);
    setMaskPreview('');
    setProductDescription('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Image Generator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create stunning images with GPT Image 1. Generate from scratch or edit existing images.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('generate')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'generate'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Generate
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'edit'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-4 h-4 inline mr-2" />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === 'generate' ? 'Image Prompt' : 'Edit Instructions'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'generate' 
                ? "Describe the image you want to generate..." 
                : "Describe how you want to edit the image..."
              }
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Product Description for Generate Mode */}
          {mode === 'generate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Description (Optional)
              </label>
              <input
                type="text"
                value={productDescription}
                onChange={e => setProductDescription(e.target.value)}
                placeholder="Describe the product (e.g. black and blue back stretcher)"
                className="w-full p-2 border rounded mb-2"
              />
            </div>
          )}

          {/* Image Upload for Edit Mode */}
          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Input Images
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 transition-colors text-gray-600 dark:text-gray-400"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  <p>Click to upload images</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                
                {/* Image Previews */}
                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Input ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mask Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mask (Optional)
                  </label>
                  <button
                    onClick={() => maskInputRef.current?.click()}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 transition-colors text-gray-600 dark:text-gray-400"
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload mask
                  </button>
                  <input
                    ref={maskInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files, true)}
                    className="hidden"
                  />
                  
                  {maskPreview && (
                    <div className="relative mt-2">
                      <img
                        src={maskPreview}
                        alt="Mask"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={removeMask}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900"
            >
              <Settings className="w-4 h-4" />
              Advanced Settings
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {models.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {sizes.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quality Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quality
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {(openaiModels.includes(model) ? openaiQualities : replicateQualities).map((q) => (
                      <option key={q.value} value={q.value}>
                        {q.label} - {q.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {formats.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label} - {f.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Background */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background
                  </label>
                  <select
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="opaque">Opaque</option>
                    <option value="transparent">Transparent</option>
                  </select>
                </div>

                {/* Compression (for JPEG/WebP) */}
                {(format === 'jpeg' || format === 'webp') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Compression: {outputCompression}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={outputCompression}
                      onChange={(e) => setOutputCompression(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={mode === 'generate' ? generateImage : editImage}
            disabled={loading || !prompt.trim() || (mode === 'edit' && inputImages.length === 0)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {mode === 'generate' ? 'Generating...' : 'Editing...'}
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                {mode === 'generate' ? 'Generate Image' : 'Edit Image'}
              </>
            )}
          </button>

          {/* Error Display */}
          {error && <Alert type="error" className="mb-4">{error}</Alert>}
        </div>

        {/* Output Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
          {!generatedImage && !loading && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
              <p>Your generated image will appear here</p>
            </div>
          )}
          
          {loading && (
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-2 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                {mode === 'generate' ? 'Generating your image...' : 'Editing your image...'}
              </p>
              <p className="text-sm text-gray-500">This may take 30-60 seconds</p>
            </div>
          )}
          
          {generatedImage && (
            <div className="w-full">
              <img
                src={generatedImage.imageData 
                  ? `data:image/${format};base64,${generatedImage.imageData}`
                  : generatedImage.imageUrl
                }
                alt="Generated"
                className="w-full rounded-lg shadow-lg"
              />
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={downloadImage}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  New Image
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Image Details</h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Model: {generatedImage.settings.model}</p>
                  <p>Size: {generatedImage.settings.size}</p>
                  <p>Quality: {generatedImage.settings.quality}</p>
                  <p>Format: {generatedImage.settings.format.toUpperCase()}</p>
                  <p>Background: {generatedImage.settings.background}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 