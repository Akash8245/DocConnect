import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

// Define types for the chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Helper function to clean the AI response and fix formatting issues
const cleanAIResponse = (text: string): string => {
  // Remove excessive indentation
  let cleaned = text.replace(/^\s{4,}/gm, '  ');
  
  // Convert markdown lists to HTML to ensure proper rendering
  // But keep the asterisks for bold/italic markdown
  cleaned = cleaned.replace(/^\* /gm, '• ');
  
  // Replace HTML <br> tags with markdown line breaks
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  
  return cleaned;
};

const AIHealthAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI health assistant. Please describe your symptoms, and I\'ll try to provide some insights about potential conditions and advice. Remember that this is not a replacement for professional medical advice.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to get response from Gemini API
  const getAIResponse = async (userInput: string) => {
    try {
      setIsLoading(true);
      
      // Public API endpoint that doesn't require authentication
      const response = await axios.post('/api/ai/health-assistant-public', {
        prompt: userInput,
      });
      
      // Clean the response to fix formatting issues
      return cleanAIResponse(response.data.response);
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'I\'m sorry, I encountered an error while processing your request. Please try again later.';
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Get AI response
    const aiResponse = await getAIResponse(input.trim());
    
    // Add AI response to chat
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your AI health assistant. Please describe your symptoms, and I\'ll try to provide some insights about potential conditions and advice. Remember that this is not a replacement for professional medical advice.',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Title and Description */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-700">AI Health Assistant</h1>
        <p className="mt-2 text-gray-600">
          Get instant insights about your symptoms and health concerns
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 sm:p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Health Consultation</h2>
            <p className="text-primary-100 text-sm mt-1">
              Describe your symptoms for analysis and advice
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClearChat}
              className="p-2 text-primary-100 hover:text-white rounded-full hover:bg-primary-500 transition-colors"
              title="Clear conversation"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Chat area */}
        <div className="h-[calc(100vh-22rem)] overflow-y-auto p-4 sm:p-6 bg-gray-50">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-100 text-primary-900 shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-800 shadow-md'
                  }`}
                >
                  {/* Assistant message has an icon */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center mb-2 pb-2 border-b border-gray-100">
                      <div className="bg-primary-100 p-1.5 rounded-full">
                        <SparklesIcon className="h-4 w-4 text-primary-600" />
                      </div>
                      <span className="ml-2 font-medium text-primary-700">Health Assistant</span>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-full prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-strong:text-primary-800 prose-a:text-primary-600 prose-li:my-0 prose-ul:my-1 prose-ol:my-1 prose-p:my-1.5">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}
                        components={{
                          // Add custom styling to list items
                          li: ({node, ...props}) => <li className="my-0.5" {...props} />,
                          // Make headings more prominent
                          h1: ({node, ...props}) => <h1 className="text-primary-700 font-bold mt-3 mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-primary-600 font-semibold mt-3 mb-1.5" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-primary-500 font-medium mt-2 mb-1" {...props} />,
                          // Style strong elements to stand out
                          strong: ({node, ...props}) => <strong className="text-primary-700 font-semibold" {...props} />,
                          // Make sure paragraphs have proper spacing
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          // Format lists with better spacing
                          ul: ({node, ...props}) => <ul className="mb-3 pl-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="mb-3 pl-1" {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex justify-end items-center">
                        <p className="mr-2">{message.content}</p>
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">You</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-primary-700 text-right' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-1.5 rounded-full">
                      <SparklesIcon className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-primary-700">Health Assistant</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 pl-2">
                    <ArrowPathIcon className="h-4 w-4 text-primary-500 animate-spin" />
                    <span className="text-gray-500 text-sm">Analyzing your symptoms...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms or health concerns..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center"
              disabled={!input.trim() || isLoading}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-xs text-yellow-800 text-center">
              <strong>Medical Disclaimer:</strong> This AI assistant provides general health information and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIHealthAssistant; 