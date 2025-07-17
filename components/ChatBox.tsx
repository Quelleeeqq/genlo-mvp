"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Trash2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: 'Hi! I am GenLo. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isTyping]);

  const clearChat = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: 'Hi! I am GenLo. How can I help you today?',
        timestamp: new Date()
      }
    ]);
    setError("");
  };

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    
    setError("");
    const userMsg: ChatMessage = { 
      role: 'user', 
      content: input,
      timestamp: new Date()
    };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      // Prepare conversation history for the API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: conversationHistory,
          prompt: input // Keep for backward compatibility
        }),
      });

      const data = await res.json();
      
      if (data.text) {
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: data.text,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        };
        setMessages((msgs) => [...msgs, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: data.error || 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        };
        setMessages((msgs) => [...msgs, errorMsg]);
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Network error. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages((msgs) => [...msgs, errorMsg]);
      setError('Network error occurred');
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[420px] md:h-[500px] w-full bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">GenLo Chat</h3>
        <button
          onClick={clearChat}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-xl shadow-sm text-sm whitespace-pre-line ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }`}>
              <div className="mb-1">{msg.content}</div>
              {msg.timestamp && (
                <div className={`text-xs opacity-70 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-3 rounded-xl shadow-sm text-sm bg-gray-100 text-gray-900 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-gray-500">GenLo is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </form>
        
        {error && (
          <div className="mt-2 text-red-500 text-sm bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 