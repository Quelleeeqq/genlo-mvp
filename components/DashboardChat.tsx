'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { Toast } from './ui/Toast';
import Sidebar from './Sidebar';
import { supabase, chatMessages } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imageBase64?: string;
  enhancedPrompt?: string;
  structuredData?: {
    confidence?: number;
    suggestions?: string[];
    metadata?: {
      reasoning?: string;
      sources?: string[];
      functions_used?: string[];
      web_search_used?: boolean;
      search_calls?: any[];
      file_search_used?: boolean;
      file_sources?: any[];
    };
  };
  imageMetadata?: {
    description?: string;
    style?: string;
    mood?: string;
    composition?: string;
    revisedPrompt?: string;
    imageId?: string;
  };
  functionCalls?: Array<{
    functionName: string;
    result: string;
  }>;
  webSearchCalls?: Array<{
    id: string;
    status: string;
    action: string;
    query?: string;
    domains?: string[];
  }>;
  fileSearchCalls?: Array<{
    id: string;
    status: string;
    queries?: string[];
    searchResults?: any[];
  }>;
  usage?: any;
}

interface DashboardChatProps {
  className?: string;
  activeChatId?: string | null;
  onChatCreated?: (chatId: string) => void;
  onChatUpdated?: () => void;
}

export default function DashboardChat({ className = '', activeChatId: propActiveChatId, onChatCreated, onChatUpdated }: DashboardChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [internalActiveChatId, setInternalActiveChatId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]); // Add this state

  // Use prop if provided, otherwise use internal state
  const activeChatId = propActiveChatId ?? internalActiveChatId;
  const setActiveChatId = (id: string | null) => {
    if (propActiveChatId !== undefined) {
      onChatCreated?.(id!);
    } else {
      setInternalActiveChatId(id);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chats and auto-select most recent if none selected
  useEffect(() => {
    if (!user?.id) return;
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (!error) {
        setChats(data || []);
        if (data && data.length > 0 && !activeChatId) {
          setActiveChatId(data[0].id);
        } else if (data && data.length === 0 && !activeChatId) {
          // No chats, create a new one
          await createNewChat();
        }
      }
    };
    fetchChats();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && activeChatId) {
      loadMessages();
    }
  }, [activeChatId, user?.id]);

  const createNewChat = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([{ user_id: user.id, title: 'New Chat' }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setActiveChatId(data.id);
        onChatCreated?.(data.id);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const loadMessages = async () => {
    if (!activeChatId) return;
    
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        ...msg,
        timestamp: new Date(msg.created_at),
        role: msg.role as 'user' | 'assistant',
        imageUrl: msg.image_url,
        imageBase64: msg.image_base64,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const updateChatTitle = async (title: string) => {
    if (!activeChatId) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title })
        .eq('id', activeChatId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!user?.id || !activeChatId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: activeChatId,
          role: message.role,
          content: message.content,
          user_id: user.id,
          image_base64: message.imageBase64,
          image_url: message.imageUrl,
          enhanced_prompt: message.enhancedPrompt,
          structured_data: message.structuredData,
          image_metadata: message.imageMetadata,
          function_calls: message.functionCalls,
          web_search_calls: message.webSearchCalls,
          file_search_calls: message.fileSearchCalls,
          usage: message.usage
        });

      if (error) throw error;

      // Update chat title with first message if it's still "New Chat"
      if (message.role === 'user' && messages.length === 0) {
        const title = message.content.length > 50 
          ? message.content.substring(0, 50) + '...' 
          : message.content;
        await updateChatTitle(title);
        // Trigger sidebar refresh after a short delay to ensure the update is saved
        setTimeout(() => onChatUpdated?.(), 100);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setReferenceImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !referenceImage) return;
    if (!user?.id) {
      showToastMessage('Please log in to send messages', 'error');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      imageBase64: referenceImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setReferenceImage(null);
    
    // Check if this is a lifestyle product image request
    const isLifestyleRequest = userMessage.content.toLowerCase().includes('woman holding') || 
                              userMessage.content.toLowerCase().includes('person holding') ||
                              userMessage.content.toLowerCase().includes('lifestyle') ||
                              userMessage.content.toLowerCase().includes('product shot') ||
                              userMessage.content.toLowerCase().includes('with a woman') ||
                              userMessage.content.toLowerCase().includes('need one with');
    
    setIsLoading(true);
    if (isLifestyleRequest) {
      setIsGeneratingImage(true);
    }

    // Check if both prompt and image are present for full image generation
    try {
      if (userMessage.content && userMessage.imageBase64) {
        // Convert base64 to Blob
        const res = await fetch(userMessage.imageBase64);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append('prompt', userMessage.content);
        formData.append('image', blob, 'image.png');

        const response = await fetch('/api/ai-image-gen-from-photo', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (response.ok) {
          let assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Here is your generated image!',
            timestamp: new Date(),
            imageUrl: data.generatedImage,
            // Fill in other optional Message fields as undefined
            imageBase64: undefined,
            enhancedPrompt: undefined,
            structuredData: undefined,
            imageMetadata: undefined,
            functionCalls: undefined,
            webSearchCalls: undefined,
            fileSearchCalls: undefined,
            usage: undefined
          };
          setMessages(prev => [...prev, assistantMessage]);
          await saveMessage(userMessage);
          await saveMessage(assistantMessage);
          showToastMessage('Message sent successfully');
        } else {
          throw new Error(data.error || 'Failed to generate image');
        }
              } else {
          // Use streaming endpoint for all requests
          if (userMessage.content) {
            // Streaming completion for both text and image requests
            let streamedContent = '';
            let assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              imageBase64: undefined,
              imageUrl: undefined,
              enhancedPrompt: undefined,
              structuredData: undefined,
              imageMetadata: undefined,
              functionCalls: undefined,
              webSearchCalls: undefined,
              fileSearchCalls: undefined,
              usage: undefined
            };
            setMessages(prev => [...prev, assistantMessage]);
            
            const response = await fetch('/api/ai-chat-flow/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: userMessage.content,
                referenceImageUrl: userMessage.imageBase64,
                userId: user.id,
                chatId: activeChatId
              }),
            });
            
            if (!response.body) {
              showToastMessage('Failed to stream response', 'error');
              setIsLoading(false);
              return;
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let isImageResponse = false;
            
            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              if (value) {
                const chunk = decoder.decode(value, { stream: true });
                // Each chunk is a JSON string per line
                chunk.split('\n').forEach(line => {
                  if (line.trim()) {
                    try {
                      const event = JSON.parse(line);
                      
                      // Check if this is an image response
                      if (event.type === 'image') {
                        isImageResponse = true;
                        assistantMessage.content = event.content;
                        assistantMessage.imageUrl = event.imageUrl;
                        assistantMessage.imageBase64 = event.imageUrl;
                        assistantMessage.enhancedPrompt = event.enhancedPrompt;
                        assistantMessage.structuredData = event.structuredData;
                        setMessages(prev => {
                          const updated = [...prev];
                          updated[updated.length - 1] = { ...assistantMessage };
                          return updated;
                        });
                        return;
                      }
                      
                      // Handle regular text streaming
                      const delta = event.choices?.[0]?.delta?.content || event.choices?.[0]?.message?.content || '';
                      if (delta) {
                        streamedContent += delta;
                        assistantMessage.content = streamedContent;
                        setMessages(prev => {
                          const updated = [...prev];
                          updated[updated.length - 1] = { ...assistantMessage };
                          return updated;
                        });
                      }
                    } catch (e) { /* ignore parse errors */ }
                  }
                });
              }
            }
            
            setIsLoading(false);
            await saveMessage(userMessage);
            
            if (!isImageResponse) {
              assistantMessage.content = streamedContent;
            }
            
            await saveMessage(assistantMessage);
            showToastMessage('Message sent successfully');
          } else {
          // Fallback to your existing chat flow for other cases
          const response = await fetch('/api/ai-chat-flow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMessage.content,
              referenceImageUrl: userMessage.imageBase64,
              userId: user.id
            }),
          });
          const data = await response.json();

          if (response.ok) {
            let assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: data.content,
              timestamp: new Date(),
              imageBase64: data.imageBase64,
              imageUrl: data.imageUrl,
              enhancedPrompt: data.enhancedPrompt,
              structuredData: data.structuredData,
              imageMetadata: data.imageMetadata,
              functionCalls: data.functionCalls,
              webSearchCalls: data.webSearchCalls,
              fileSearchCalls: data.fileSearchCalls,
              usage: data.usage
            };
            setMessages(prev => [...prev, assistantMessage]);
            await saveMessage(userMessage);
            await saveMessage(assistantMessage);
            showToastMessage('Message sent successfully');
          } else {
            throw new Error(data.error || 'Failed to send message');
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToastMessage('Failed to send message', 'error');
    } finally {
      setIsLoading(false);
      setIsGeneratingImage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageClick = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const downloadImage = (imageSrc: string, filename: string = 'image') => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}
      >
        <div className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
          {/* Message content */}
          <div className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser 
              ? 'bg-black text-white rounded-br-md' 
              : 'bg-gray-200 text-gray-900 rounded-bl-md'
          }`}>
            {/* Only show text content if there's no image or if it's a user message */}
            {(!isUser && (message.imageBase64 || message.imageUrl)) ? null : (
              <div className="whitespace-pre-wrap leading-relaxed text-sm font-normal">{message.content}</div>
            )}
            
            {/* Uploaded image display (for user messages) */}
            {isUser && message.imageBase64 && (
              <div className="mt-3">
                <img
                  src={message.imageBase64.startsWith('data:') ? message.imageBase64 : `data:image/jpeg;base64,${message.imageBase64}`}
                  alt="Uploaded image"
                  className="w-full h-auto rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    if (message.imageBase64) {
                      const imageSrc = message.imageBase64.startsWith('data:') ? message.imageBase64 : `data:image/jpeg;base64,${message.imageBase64}`;
                      handleImageClick(imageSrc);
                    }
                  }}
                />
              </div>
            )}
            
            {/* Generated image display (for assistant messages) */}
            {!isUser && (message.imageBase64 || message.imageUrl) && (
              <div className="mt-3">
                <img
                  src={message.imageBase64 ? `data:image/png;base64,${message.imageBase64}` : message.imageUrl}
                  alt="Generated image"
                  className="w-full h-auto rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    const imageSrc = message.imageBase64 ? `data:image/png;base64,${message.imageBase64}` : message.imageUrl;
                    if (imageSrc) {
                      handleImageClick(imageSrc);
                    }
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Enhanced prompt info - only show if no image */}
          {message.enhancedPrompt && !(!isUser && (message.imageBase64 || message.imageUrl)) && (
            <div className="mt-2 text-xs opacity-70 bg-white/10 rounded-lg p-2">
              <strong>Enhanced prompt:</strong> {message.enhancedPrompt}
            </div>
          )}
          
          {/* Function calls display - only show if no image */}
          {message.functionCalls && message.functionCalls.length > 0 && !(!isUser && (message.imageBase64 || message.imageUrl)) && (
            <div className="mt-2 space-y-2 p-3 bg-white/10 rounded-lg">
              <div className="text-xs opacity-80">
                <strong>🔧 Functions Used:</strong>
              </div>
              {message.functionCalls.map((fc, index) => (
                <div key={index} className="text-xs opacity-70 ml-2">
                  <div className="font-medium">{fc.functionName}</div>
                  <div className="text-xs opacity-60 mt-1">{fc.result}</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Structured data display - only show if no image */}
          {message.structuredData && !(!isUser && (message.imageBase64 || message.imageUrl)) && (
            <div className="mt-2 space-y-2 p-3 bg-white/10 rounded-lg">
              {message.structuredData.confidence && (
                <div className="text-xs opacity-80">
                  <strong>Confidence:</strong> {message.structuredData.confidence}%
                </div>
              )}
              {message.structuredData.suggestions && message.structuredData.suggestions.length > 0 && (
                <div className="text-xs opacity-80">
                  <strong>Suggestions:</strong>
                  <ul className="ml-2 mt-1">
                    {message.structuredData.suggestions.map((suggestion, index) => (
                      <li key={index} className="opacity-70">• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              {message.structuredData.metadata?.reasoning && (
                <div className="text-xs opacity-80">
                  <strong>Reasoning:</strong> {message.structuredData.metadata.reasoning}
                </div>
              )}
            </div>
          )}
          
          {/* Web search calls display - only show if no image */}
          {message.webSearchCalls && message.webSearchCalls.length > 0 && !(!isUser && (message.imageBase64 || message.imageUrl)) && (
            <div className="mt-2 space-y-2 p-3 bg-white/10 rounded-lg">
              <div className="text-xs opacity-80">
                <strong>🔍 Web Search:</strong>
              </div>
              {message.webSearchCalls.map((ws, index) => (
                <div key={index} className="text-xs opacity-70 ml-2">
                  <div className="font-medium">
                    Status: {ws.status}
                  </div>
                  {ws.query && (
                    <div className="text-xs opacity-60 mt-1">
                      <strong>Query:</strong> {ws.query}
                    </div>
                  )}
                  {ws.domains && ws.domains.length > 0 && (
                    <div className="text-xs opacity-60 mt-1">
                      <strong>Domains:</strong> {ws.domains.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Web search sources display - only show if no image */}
          {message.structuredData?.metadata?.sources && message.structuredData.metadata.sources.length > 0 && !(!isUser && (message.imageBase64 || message.imageUrl)) && (
            <div className="mt-2 space-y-2 p-3 bg-white/10 rounded-lg">
              <div className="text-xs opacity-80">
                <strong>📚 Sources:</strong>
              </div>
              {message.structuredData.metadata.sources.map((source: any, index: number) => (
                <div key={index} className="text-xs opacity-70 ml-2">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    {source.title || source.url}
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* File search calls display - only show if no image */}
          {message.fileSearchCalls && message.fileSearchCalls.length > 0 && !(!isUser && (message.imageBase64 || message.imageUrl)) && (
            <div className="mt-2 space-y-2 p-3 bg-white/10 rounded-lg">
              <div className="text-xs opacity-80">
                <strong>📁 File Search:</strong>
              </div>
              {message.fileSearchCalls.map((fs, index) => (
                <div key={index} className="text-xs opacity-70 ml-2">
                  <div className="font-medium">
                    Status: {fs.status}
                  </div>
                  {fs.queries && fs.queries.length > 0 && (
                    <div className="text-xs opacity-60 mt-1">
                      <strong>Queries:</strong> {fs.queries.join(', ')}
                    </div>
                  )}
                  {fs.searchResults && fs.searchResults.length > 0 && (
                    <div className="text-xs opacity-60 mt-1">
                      <strong>Results:</strong> {fs.searchResults.length} found
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* File search sources display - only show if no image */}
          {message.structuredData?.metadata?.file_sources && message.structuredData.metadata.file_sources.length > 0 && !(!isUser && (message.imageBase64 || message.imageUrl)) && (
            <div className="mt-2 space-y-2 p-3 bg-white/10 rounded-lg">
              <div className="text-xs opacity-80">
                <strong>📄 File Sources:</strong>
              </div>
              {message.structuredData.metadata.file_sources.map((source: any, index: number) => (
                <div key={index} className="text-xs opacity-70 ml-2">
                  <div className="font-medium">
                    {source.filename}
                  </div>
                  <div className="text-xs opacity-60">
                    File ID: {source.fileId}
                  </div>
                  {source.index && (
                    <div className="text-xs opacity-50">
                      Index: {source.index}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs opacity-40 mt-1 text-center">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden">
      {/* Sidebar - sticky/fixed */}
      <div className="h-screen w-64 flex-shrink-0 bg-transparent border-r border-gray-200 fixed left-0 top-0 z-30">
        <Sidebar onSelectChat={setActiveChatId} activeChatId={activeChatId} onChatCreated={onChatCreated} onChatUpdated={onChatUpdated} />
      </div>

      {/* Main chat area - with left margin for sidebar */}
      <div className="flex flex-col flex-1 bg-transparent ml-64 h-screen">
        {/* Welcome message if no messages */}
        {messages.length === 0 && !isLoadingMessages && (
          <div className="flex flex-col items-center justify-center h-full w-full px-4">
            <div className="rounded-full bg-black flex items-center justify-center mb-6" style={{ width: 72, height: 72 }}>
              <span className="text-3xl text-white">✨</span>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-center text-gray-900">Welcome to GenLo</h2>
            <p className="text-gray-600 text-center mb-4">
              Ask me anything about design, marketing, or creative projects.
            </p>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              <span role="img" aria-label="tip">💡</span> Try these lifestyle product image examples:
            </p>
            
            {/* Quick example buttons */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {[
                "now i need one with a woman holding it",
                "create a lifestyle product image",
                "person holding the back stretcher",
                "professional product shot with model"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(example)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  {example}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-gray-400 text-center max-w-md mt-4">
              <span role="img" aria-label="tip">🎨</span> I can also generate regular images, help with design, and answer questions!
            </p>
          </div>
        )}

        {/* Loading messages indicator */}
        {isLoadingMessages && (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="rounded-full bg-black flex items-center justify-center mb-6" style={{ width: 72, height: 72 }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <p className="text-gray-600 text-center">Loading messages...</p>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-2"
            style={{ maxHeight: 'calc(100vh - 80px)', paddingBottom: '96px' }} // 96px for input bar height
          >
            <div className="flex flex-col">
              {messages.map(renderMessage)}
              
              {/* Loading bubble for general message sending */}
              {isLoading && !isGeneratingImage && (
                <div className="flex justify-start px-4 py-2">
                  <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mr-auto">
                    <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">Generating response...</span>
                      </div>
                    </div>
                    <div className="text-xs opacity-40 mt-1 text-center">
                      {formatTimestamp(new Date())}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading bubble for image generation */}
              {isGeneratingImage && (
                <div className="flex justify-start px-4 py-2">
                  <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mr-auto">
                    <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">Creating your lifestyle product image...</span>
                      </div>
                    </div>
                    <div className="text-xs opacity-40 mt-1 text-center">
                      {formatTimestamp(new Date())}
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input bar - follows scroll */}
        <div className="w-full flex-none flex items-center px-4 py-4 border-t border-gray-100 shadow-lg fixed bottom-0 left-0 w-full z-40 ml-64" style={{maxWidth: 'calc(100vw - 16rem)', background: 'transparent'}}>
          <form className="flex w-full max-w-4xl mx-auto items-center bg-gray-100 rounded-2xl px-4 py-3" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
            {/* Attachment/upload icon on the left */}
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-black focus:outline-none transition-colors"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Attach image"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.19 9.19a1.5 1.5 0 01-2.12-2.12l8.48-8.48"/></svg>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
            </button>
            
            {/* Image preview when uploaded */}
            {referenceImage && (
              <div className="flex items-center ml-3 mr-3">
                <div className="relative">
                  <img
                    src={referenceImage}
                    alt="Uploaded image"
                    className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeReferenceImage}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            {/* Input */}
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 text-base text-gray-900 placeholder-gray-500 focus:placeholder-gray-400 transition-colors"
              placeholder={referenceImage ? "Message with image..." : "Try: 'now i need one with a woman holding it' or ask me anything..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{ fontWeight: 400, letterSpacing: '0.01em' }}
            />
            {/* Send icon */}
            <button
              type="submit"
              className="p-2 text-white bg-black rounded-full hover:bg-gray-800 focus:outline-none transition-colors ml-2 shadow-sm"
              title="Send message"
              disabled={isLoading || (!inputValue.trim() && !referenceImage)}
              style={{ minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>

        {/* Toast */}
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={closeImageModal}
          >
            <div className="relative max-w-xl my-8">
              <img
                src={selectedImage}
                alt="Full size image"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(selectedImage, 'quelle-image');
                  }}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
                >
                  Download
                </button>
                <button
                  onClick={closeImageModal}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}