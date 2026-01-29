import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, SessionConfig, Identity, MessageStatus } from '../types';
import { TEMPLATE_GREETING } from '../constants';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  config: SessionConfig;
  onEndSession: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const TickIcon: React.FC<{ status?: MessageStatus }> = ({ status }) => {
  if (!status) return null;

  const color = status === 'read' ? '#53bdeb' : '#8696a0'; // WhatsApp Blue vs Grey

  if (status === 'sent') {
    // Single Tick
    return (
      <svg viewBox="0 0 16 15" width="16" height="15" className="" preserveAspectRatio="xMidYMid meet">
        <path fill={color} d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88 2.086 7.716a.363.363 0 0 0-.497.032l-.464.392a.377.377 0 0 0 .02.515L4.32 11.27c.136.14.373.15.52.02l6.012-7.46a.37.37 0 0 0 .06-.514z"></path>
      </svg>
    );
  }

  // Double Tick (Delivered or Read)
  return (
    <svg viewBox="0 0 16 15" width="16" height="15" className="" preserveAspectRatio="xMidYMid meet">
       <path fill={color} d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.283c.153.169.36.217.553.072l6.618-8.166a.37.37 0 0 0 .06-.514z"></path>
       <path fill={color} d="M11.024 3.316l-.479-.372a.365.365 0 0 0-.509.063L4.68 9.88 2.2 7.716a.363.363 0 0 0-.497.032l-.464.392a.377.377 0 0 0 .02.515l3.175 2.614c.136.14.373.15.52.02l6.012-7.46a.37.37 0 0 0 .06-.514z"></path>
    </svg>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  config,
  onEndSession,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // For lightbox

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyTemplate = () => {
    // Applying raw template so user can fill the placeholders manually as per simulation requirements
    setInputText(TEMPLATE_GREETING);
    textareaRef.current?.focus();
  };

  const downloadHistory = () => {
    const headers = "Pengirim,Pesan,Waktu\n";
    const csvContent = messages.map(m => {
      const senderName = m.sender === 'agent' ? 'Agent' : (m.sender === 'system' ? 'System' : config.identity.name);
      // Remove image tags from CSV text for cleaner output
      const cleanText = m.text.replace(/\[SEND_IMAGE: \d+\]/g, '[IMAGE SENT]').replace(/"/g, '""');
      const safeText = `"${cleanText}"`;
      return `${senderName},${safeText},${m.timestamp.toLocaleString('id-ID')}`;
    }).join("\n");

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `chat_history_${config.identity.name}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to parse text and render images within it
  const renderMessageContent = (text: string) => {
    // Collect all images from all scenarios in order
    const allImages = config.scenarios.flatMap(s => s.images || []);

    // Regex to match [SEND_IMAGE: number]
    const parts = text.split(/(\[SEND_IMAGE: \d+\])/g);
    
    return parts.map((part, index) => {
        const match = part.match(/\[SEND_IMAGE: (\d+)\]/);
        if (match) {
            const imgIndex = parseInt(match[1]);
            const imgSrc = allImages[imgIndex];
            
            if (imgSrc) {
                return (
                    <div key={index} className="my-2">
                        <img 
                            src={imgSrc} 
                            alt={`Attachment ${imgIndex}`} 
                            className="rounded-lg max-h-60 w-auto object-cover border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImage(imgSrc)}
                        />
                    </div>
                );
            }
            return null;
        }
        return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-gray-900 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] pointer-events-none"></div>

      {/* Header */}
      <div className="bg-whatsapp-teal dark:bg-gray-800 p-3 flex items-center justify-between shadow-md z-10 text-white">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
               <img src={`https://picsum.photos/seed/${config.identity.name}/200`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
                <h1 className="font-bold text-lg leading-tight">{config.identity.name}</h1>
                <p className="text-xs text-whatsapp-chat_out opacity-90">Digital Simulation • {config.identity.phone}</p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            {onToggleFullscreen && (
                <button 
                  onClick={onToggleFullscreen}
                  className="p-2 hover:bg-white/10 rounded text-sm"
                  title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? (
                        // Minimize Icon (Arrows In)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h6m0 0v6m0-6L4 20m16-6h-6m0 0v6m0-6l6 6M4 10h6m0 0V4m0 6L4 4m16 6h-6m0 0V4m0 6l6-6" />
                        </svg>
                    ) : (
                         // Maximize Icon (Corners Out)
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4" />
                        </svg>
                    )}
                </button>
            )}
            {messages.length > 1 && (
                <button 
                  onClick={downloadHistory}
                  className="p-2 hover:bg-white/10 rounded text-sm flex items-center gap-1"
                  title="Download History"
                >
                    <span>📥</span>
                    <span className="hidden sm:inline">Download History Chat</span>
                    <span className="sm:hidden">History</span>
                </button>
            )}
            <button 
                onClick={onEndSession}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm font-bold"
            >
                Akhiri
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10">
        {messages.map((msg) => {
           if (msg.sender === 'system') {
               return (
                   <div key={msg.id} className="flex justify-center my-4">
                       <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-xs px-3 py-1 rounded shadow text-center max-w-xs">
                           {msg.text}
                       </div>
                   </div>
               )
           }
           
           const isAgent = msg.sender === 'agent';
           return (
            <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                <div 
                    className={`max-w-[75%] md:max-w-[60%] rounded-lg px-3 py-2 shadow text-sm relative 
                    ${isAgent ? 'bg-whatsapp-chat_out dark:bg-green-900 rounded-tr-none' : 'bg-white dark:bg-gray-800 rounded-tl-none'}
                    text-gray-900 dark:text-gray-100`}
                >
                    <div className="whitespace-pre-wrap break-words">
                        {renderMessageContent(msg.text)}
                    </div>
                    <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isAgent ? 'text-green-800 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        <span>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {isAgent && <TickIcon status={msg.status} />}
                    </div>
                </div>
            </div>
           )
        })}
        {isLoading && (
             <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-lg rounded-tl-none px-4 py-3 shadow">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-100 dark:bg-gray-800 p-2 z-10">
        {/* Tips & Template Button */}
        <div className="mb-2 px-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span className="font-bold">Tips: Agen</span>
                <span>Sapa konsumen dengan ramah dan profesional.</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ayo sapa Konsumen Sekarang</div>
             <button 
                onClick={applyTemplate}
                className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1 rounded-full text-whatsapp-teal hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm mb-2"
            >
                ✨ Gunakan Template Sapaan
            </button>
        </div>

        <div className="flex items-end gap-2 max-w-full">
            <div className="flex-1 bg-white dark:bg-gray-700 p-2 rounded-2xl shadow-sm flex items-center">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ketik pesan"
                    className="w-full bg-transparent border-none outline-none resize-none max-h-32 min-h-[24px] py-1 px-2 text-gray-900 dark:text-gray-100 placeholder-gray-500"
                    rows={1}
                />
            </div>
            <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="p-3 bg-whatsapp-teal text-white rounded-full shadow-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
                <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current">
                    <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                </svg>
            </button>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
              <img 
                src={selectedImage} 
                alt="Full preview" 
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
              <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
          </div>
      )}
    </div>
  );
}