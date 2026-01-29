import React, { useState, useEffect } from 'react';
import { SettingsModal } from './components/SettingsModal';
import { ChatInterface } from './components/ChatInterface';
import { AppSettings, ChatMessage, SessionConfig, Identity, ConsumerType, Scenario } from './types';
import { DEFAULT_SCENARIOS, DEFAULT_CONSUMER_TYPES, DUMMY_CITIES, DUMMY_NAMES } from './constants';
import { initializeChat, sendMessageToAI } from './services/geminiService';

const STORAGE_KEY = 'ketik_app_settings_v1';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'chat'>('home');
  
  // Initialize settings from LocalStorage if available, otherwise use defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Ensure identitySettings exists if loading from old storage
        if (!parsed.identitySettings) {
            parsed.identitySettings = {
                displayName: '',
                signatureName: '',
                phoneNumber: '',
                city: ''
            };
        }
        return parsed;
      }
    } catch (error) {
      console.error("Failed to load settings from storage:", error);
    }
    return {
      scenarios: DEFAULT_SCENARIOS,
      consumerTypes: DEFAULT_CONSUMER_TYPES,
      identitySettings: {
          displayName: '',
          signatureName: '',
          phoneNumber: '',
          city: ''
      }
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SessionConfig | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Save settings to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync state with browser fullscreen changes (e.g. user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
        setIsFullscreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        setIsFullscreen(false);
    }
  };

  const startSession = async () => {
    const activeScenarios = settings.scenarios.filter(s => s.isActive);
    if (activeScenarios.length === 0) {
      alert("Harap aktifkan minimal satu skenario di pengaturan.");
      return;
    }

    // Logic: Use ALL active scenarios selected by the user.
    // We shuffle them so the order of presentation is random, but all checked scenarios will be covered.
    const selectedScenarios = [...activeScenarios].sort(() => 0.5 - Math.random());
    
    // Determine Consumer Type
    // Use the preference of the FIRST scenario in the shuffled list (Primary Issue)
    // or fallback to random if the first scenario implies random.
    const primaryScenario = selectedScenarios[0];
    let selectedConsumerType: ConsumerType;
    
    if (primaryScenario.consumerTypeId && primaryScenario.consumerTypeId !== 'random') {
      const foundType = settings.consumerTypes.find(t => t.id === primaryScenario.consumerTypeId);
      selectedConsumerType = foundType || settings.consumerTypes[Math.floor(Math.random() * settings.consumerTypes.length)];
    } else {
      selectedConsumerType = settings.consumerTypes[Math.floor(Math.random() * settings.consumerTypes.length)];
    }
    
    // Identity Generation Logic
    // Priority: 1. Global Custom Settings (if filled) -> 2. Scenario Fixed Identity (Primary) -> 3. Random
    
    const customId = settings.identitySettings;
    const shouldUseCustomName = customId?.displayName && customId.displayName.trim() !== '';
    const shouldUseCustomCity = customId?.city && customId.city.trim() !== '';
    const shouldUseCustomPhone = customId?.phoneNumber && customId.phoneNumber.trim() !== '';

    const identity: Identity = {
      name: shouldUseCustomName ? customId!.displayName : (primaryScenario.fixedIdentity?.name || DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)]),
      city: shouldUseCustomCity ? customId!.city : (primaryScenario.fixedIdentity?.city || DUMMY_CITIES[Math.floor(Math.random() * DUMMY_CITIES.length)]),
      phone: shouldUseCustomPhone ? customId!.phoneNumber : (primaryScenario.fixedIdentity?.phone || `08${Math.floor(100000000 + Math.random() * 900000000)}`),
      signatureName: customId?.signatureName || undefined
    };

    const config: SessionConfig = {
      scenarios: selectedScenarios,
      consumerType: selectedConsumerType,
      identity
    };

    setCurrentConfig(config);
    setIsLoading(true);

    try {
      await initializeChat(config);
      
      const initialMsg: ChatMessage = {
        id: 'sys-init',
        sender: 'system',
        text: `Anda Terhubung Dengan ${identity.name}, ${identity.phone} (${identity.city})`,
        timestamp: new Date()
      };
      
      setMessages([initialMsg]);
      setView('chat');
    } catch (e) {
      alert("Gagal memulai simulasi. Pastikan koneksi internet stabil dan API Key tersedia.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMessageStatus = (id: string, status: 'sent' | 'delivered' | 'read') => {
    setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, status } : msg
    ));
  };

  const handleSendMessage = async (text: string) => {
    const msgId = Date.now().toString();
    const userMsg: ChatMessage = {
      id: msgId,
      sender: 'agent',
      text: text,
      timestamp: new Date(),
      status: 'sent'
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Simulate Delivered after 1 second
    setTimeout(() => {
        updateMessageStatus(msgId, 'delivered');
    }, 1000);

    // Simulate Read after 2 seconds (just before or while AI is processing)
    setTimeout(() => {
        updateMessageStatus(msgId, 'read');
    }, 2000);

    try {
      const fullResponse = await sendMessageToAI(text);
      
      // Split response by [BREAK]
      const responseParts = fullResponse.split(/\[BREAK\]/i).map(part => part.trim()).filter(part => part.length > 0);
      
      // Add messages sequentially with delays
      for (let i = 0; i < responseParts.length; i++) {
        // Show typing indicator between messages
        setIsLoading(true);
        
        // Check if message is a system notification (error/info)
        const isSystemMsg = responseParts[i].startsWith("[SISTEM]");
        const cleanText = isSystemMsg ? responseParts[i].replace("[SISTEM] ", "").replace("[SISTEM]", "") : responseParts[i];

        // Human-like delay: simulate thinking/typing time (skip for system messages)
        if (!isSystemMsg) {
            const typingTime = Math.min(Math.max(responseParts[i].length * 30, 1000), 3000);
            await new Promise(resolve => setTimeout(resolve, typingTime));
        }
        
        const aiMsg: ChatMessage = {
          id: (Date.now() + i).toString(),
          sender: isSystemMsg ? 'system' : 'consumer',
          text: cleanText,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false); // Hide typing indicator after each bubble
        
        // Small pause between sending messages
        if (i < responseParts.length - 1 && !isSystemMsg) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      // Fallback error message if something crashes outside sendMessageToAI
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'system',
          text: "Terjadi kesalahan aplikasi internal.",
          timestamp: new Date()
      }]);
    }
  };

  const endSession = () => {
    setView('home');
    setMessages([]);
    setCurrentConfig(null);
    // Don't exit fullscreen on session end automatically
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans relative">
      {/* Home View */}
      {view === 'home' && (
        <>
          {/* Top Right Fullscreen Button for Home */}
          <div className="absolute top-4 right-4 z-50">
            <button 
                onClick={toggleFullscreenMode}
                className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:text-whatsapp-teal transition-all hover:scale-110 active:scale-95"
                title={isFullscreen ? "Keluar Mode Layar Penuh" : "Mode Layar Penuh (Browser)"}
            >
                {isFullscreen ? (
                    // Minimize Icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h6m0 0v6m0-6L4 20m16-6h-6m0 0v6m0-6l6 6M4 10h6m0 0V4m0 6L4 4m16 6h-6m0 0V4m0 6l6-6" />
                    </svg>
                ) : (
                    // Maximize Icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4" />
                    </svg>
                )}
            </button>
          </div>

          <div className="text-center p-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl max-w-md w-full mx-4 relative animate-fade-in border-t-4 border-whatsapp-teal z-10">
            <div className="mb-8">
               <div className="w-20 h-20 bg-whatsapp-teal rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg ring-4 ring-whatsapp-teal/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
               </div>
               <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Ketik (Kelas Etika & Trik Komunikasi)</h1>
               <p className="text-gray-600 dark:text-gray-400">Latihan Roleplay Agen Contact Center</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={startSession}
                disabled={isLoading}
                className="w-full py-4 bg-whatsapp-teal text-white font-bold rounded-xl shadow-md hover:bg-green-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Menyiapkan Sesi...
                  </>
                ) : "Mulai Latihan"}
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              >
                ⚙️ Pengaturan & Skenario
              </button>
            </div>
            
            <div className="mt-12 flex flex-col gap-1 items-center">
               <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                 Powered by Google Gemini AI
               </div>
               <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                 Made by Fajar & Ratna | Trainer Kontak OJK 157
               </div>
            </div>
          </div>
        </>
      )}

      {view === 'chat' && currentConfig && (
        <div className={`w-full h-full transition-all animate-slide-up ${
          isFullscreen 
            ? '' 
            : 'md:max-w-2xl md:h-[95vh] md:rounded-2xl md:overflow-hidden md:shadow-2xl md:my-4'
        }`}>
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            config={currentConfig}
            onEndSession={endSession}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreenMode}
          />
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
};

export default App;