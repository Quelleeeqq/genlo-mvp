'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Trash2, Download, Copy } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imageBase64?: string;
}

export default function TestLifestyleChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1',
      role: 'assistant', 
      content: 'Hi! I\'m Quelle AI. I can help you create lifestyle product images. Try saying "now i need one with a woman holding it" or any other lifestyle request!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearChat = () => {
    setMessages([
      { 
        id: '1',
        role: 'assistant', 
        content: 'Hi! I\'m Quelle AI. I can help you create lifestyle product images. Try saying "now i need one with a woman holding it" or any other lifestyle request!',
        timestamp: new Date()
      }
    ]);
    setError("");
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    setError("");
    const userMsg: ChatMessage = { 
      id: Date.now().toString(),
      role: 'user', 
      content: input,
      timestamp: new Date()
    };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          imageUrl: data.imageUrl,
          imageBase64: data.imageBase64
        };
        setMessages((msgs) => [...msgs, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        };
        setMessages((msgs) => [...msgs, errorMsg]);
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Network error. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages((msgs) => [...msgs, errorMsg]);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const downloadImage = (imageSrc: string, filename: string = 'lifestyle_product') => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyImageUrl = (imageSrc: string) => {
    navigator.clipboard.writeText(imageSrc).then(() => {
      alert('Image URL copied to clipboard!');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = imageSrc;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Image URL copied to clipboard!');
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Lifestyle Product Image Chat</h1>
                <p className="text-blue-100 mt-1">Seamless product image generation in chat</p>
              </div>
              <button
                onClick={clearChat}
                className="p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-[600px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-md' 
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    
                    {/* Generated Image */}
                    {(msg.imageUrl || msg.imageBase64) && (
                      <div className="mt-3">
                        <img
                          src={msg.imageUrl || `data:image/png;base64,${msg.imageBase64}`}
                          alt="Generated product image"
                          className="w-full h-auto rounded-xl max-h-80 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => downloadImage(msg.imageUrl || `data:image/png;base64,${msg.imageBase64}`, 'lifestyle_product')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                          <button
                            onClick={() => copyImageUrl(msg.imageUrl || `data:image/png;base64,${msg.imageBase64}`)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            Copy URL
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs opacity-70 mt-1 ${
                    msg.role === 'user' ? 'text-right text-blue-600' : 'text-left text-gray-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] mr-auto">
                  <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Generating your image...</span>
                    </div>
                  </div>
                  <div className="text-xs opacity-40 mt-1 text-left text-gray-500">
                    {formatTime(new Date())}
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <input
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                type="text"
                placeholder="Try: 'now i need one with a woman holding it' or 'create a lifestyle product image'..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                autoFocus
              />
              <button
                onClick={sendMessage}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
              </button>
            </div>
            
            {error && (
              <div className="mt-3 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Quick Examples */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "now i need one with a woman holding it",
                  "create a lifestyle product image",
                  "person holding the back stretcher",
                  "professional product shot with model"
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(example)}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 