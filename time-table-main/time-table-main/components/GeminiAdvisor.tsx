import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Mic, Image as ImageIcon, Video, 
  MapPin, Globe, Zap, BrainCircuit, Play, Pause, Loader2,
  Wand2, MonitorPlay, Layers
} from 'lucide-react';
import { WeeklyStats, Task, ChatMessage, GeneratedMedia, AspectRatio, ImageSize } from '../types';
import * as GeminiService from '../services/geminiService';

interface GeminiAdvisorProps {
  stats: WeeklyStats;
  tasks: Task[];
}

type Tab = 'assistant' | 'studio' | 'live';

export const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ stats, tasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('assistant');
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Studio State
  const [studioPrompt, setStudioPrompt] = useState('');
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);

  // Live State
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  
  // Audio Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers: Chat ---

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage)) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Determine Grounding
      let grounding: 'none' | 'search' | 'maps' = 'none';
      if (useSearch) grounding = 'search';
      if (useMaps) grounding = 'maps';

      // Send to Service
      // If we have an image + text, we might be doing image analysis (Video understanding works similarly with generateContent)
      const result = await GeminiService.sendChatMessage(
        userMsg.text, 
        messages, 
        isThinkingMode,
        grounding,
        userMsg.image?.split(',')[1] // Strip base64 prefix
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        isThinking: isThinkingMode,
        audioData: result.audio
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error processing your request."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMicClick = async () => {
    // Quick demo transcription flow
    // In production, use MediaRecorder API
    alert("In a real implementation, this would record audio. For now, typing is enabled.");
  };

  const playAudio = (base64Audio: string) => {
    const audio = new Audio("data:audio/mp3;base64," + base64Audio); // Adjust mime if needed
    audio.play();
  };

  // --- Handlers: Studio ---

  const handleGenerateMedia = async () => {
    if (!studioPrompt.trim()) return;
    setIsGenerating(true);

    try {
        let url = '';
        if (mediaType === 'image') {
            // Check if we are editing an existing uploaded image (Nano Banana)
            if (selectedImage) {
                url = await GeminiService.editImage(selectedImage.split(',')[1], studioPrompt);
            } else {
                url = await GeminiService.generateImage(studioPrompt, aspectRatio, imageSize);
            }
        } else {
            // Veo Video Generation
            // Ensure aspectRatio is strictly 16:9 or 9:16 for video
            const videoRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
            url = await GeminiService.generateVideo(studioPrompt, videoRatio);
        }

        setGeneratedMedia(prev => [{
            type: mediaType,
            url: url,
            prompt: studioPrompt
        }, ...prev]);
        setStudioPrompt('');
        setSelectedImage(null);

    } catch (error) {
        alert("Generation failed. See console for details.");
    } finally {
        setIsGenerating(false);
    }
  };

  // --- Handlers: Live ---
  const toggleLive = async () => {
      if (isLiveConnected) {
          setIsLiveConnected(false);
          // In real implementation: session.close()
      } else {
          try {
              setIsLiveConnected(true);
              // Trigger connection (fire and forget for UI state demo)
              await GeminiService.connectLiveSession(
                  (audio) => { /* play audio stream */ },
                  () => setIsLiveConnected(false)
              );
          } catch (e) {
              console.error(e);
              setIsLiveConnected(false);
          }
      }
  };


  // --- Render ---

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      >
        <Sparkles size={20} />
        <span className="font-semibold">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
               <Sparkles size={24} />
               <h3 className="font-bold text-xl">Gemini Advanced</h3>
             </div>
             
             {/* Navigation Tabs */}
             <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button 
                  onClick={() => setActiveTab('assistant')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'assistant' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Assistant
                </button>
                <button 
                  onClick={() => setActiveTab('studio')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'studio' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Studio
                </button>
                <button 
                  onClick={() => setActiveTab('live')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-white dark:bg-gray-700 shadow-sm text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                  Live
                </button>
             </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900/50">
          
          {/* --- ASSISTANT TAB --- */}
          {activeTab === 'assistant' && (
            <div className="absolute inset-0 flex flex-col">
               {/* Messages */}
               <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                      <BrainCircuit size={48} className="text-indigo-400 mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">How can I help?</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-2">
                        I can analyze your tasks, summarize videos, search the web, find places on maps, and more.
                      </p>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-4 ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
                      }`}>
                         {msg.image && (
                           <img src={msg.image} alt="Upload" className="mb-3 rounded-lg max-h-48 object-cover border border-white/20" />
                         )}
                         
                         {msg.isThinking && (
                           <div className="text-xs font-mono text-indigo-500 mb-1 flex items-center gap-1">
                             <BrainCircuit size={12} /> Thinking Process
                           </div>
                         )}

                         <div className="whitespace-pre-wrap">{msg.text}</div>

                         {msg.audioData && (
                           <button 
                            onClick={() => playAudio(msg.audioData!)}
                            className="mt-3 flex items-center gap-2 text-xs font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                           >
                             <Play size={12} /> Play Audio
                           </button>
                         )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3">
                        <Loader2 size={18} className="animate-spin text-indigo-600" />
                        <span className="text-sm text-gray-500">
                          {isThinkingMode ? "Thinking deeply..." : "Processing..."}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
               </div>

               {/* Input Area */}
               <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                  {/* Tools / Config */}
                  <div className="flex items-center gap-3 mb-3 overflow-x-auto pb-2">
                    <button 
                      onClick={() => setIsThinkingMode(!isThinkingMode)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isThinkingMode 
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 text-purple-700 dark:text-purple-300' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <BrainCircuit size={14} /> Deep Think
                    </button>
                    
                    <button 
                      onClick={() => setUseSearch(!useSearch)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        useSearch 
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 text-blue-700 dark:text-blue-300' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <Globe size={14} /> Search
                    </button>

                    <button 
                      onClick={() => setUseMaps(!useMaps)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        useMaps 
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-300' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <MapPin size={14} /> Maps
                    </button>
                    
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedImage
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 text-indigo-700 dark:text-indigo-300'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <ImageIcon size={14} /> {selectedImage ? 'Image Attached' : 'Add Media'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleImageUpload} />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message or asking for analysis..."
                      className="w-full pl-4 pr-24 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-gray-800 dark:text-white transition-all"
                    />
                    <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
                      <button onClick={handleMicClick} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <Mic size={20} />
                      </button>
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputValue && !selectedImage}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* --- STUDIO TAB --- */}
          {activeTab === 'studio' && (
             <div className="absolute inset-0 flex flex-col lg:flex-row">
               {/* Controls */}
               <div className="w-full lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Wand2 size={20} className="text-indigo-500" /> Generator Config
                  </h4>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Mode</label>
                      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button 
                          onClick={() => setMediaType('image')}
                          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mediaType === 'image' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-white' : 'text-gray-500'}`}
                        >
                          Image
                        </button>
                        <button 
                          onClick={() => setMediaType('video')}
                          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mediaType === 'video' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-white' : 'text-gray-500'}`}
                        >
                          Video (Veo)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Prompt</label>
                      <textarea 
                        value={studioPrompt}
                        onChange={(e) => setStudioPrompt(e.target.value)}
                        placeholder={mediaType === 'image' ? "Describe the image..." : "Describe the video scene..."}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Aspect Ratio</label>
                         <select 
                           value={aspectRatio}
                           onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                           className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                         >
                           <option value="1:1">1:1 (Square)</option>
                           <option value="16:9">16:9 (Landscape)</option>
                           <option value="9:16">9:16 (Portrait)</option>
                           <option value="4:3">4:3</option>
                           <option value="3:4">3:4</option>
                         </select>
                      </div>
                      
                      {mediaType === 'image' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Quality</label>
                          <select 
                             value={imageSize}
                             onChange={(e) => setImageSize(e.target.value as ImageSize)}
                             className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                           >
                             <option value="1K">1K Standard</option>
                             <option value="2K">2K High</option>
                             <option value="4K">4K Ultra</option>
                           </select>
                        </div>
                      )}
                    </div>

                    {/* Image Editing Hook (Nano Banana) */}
                    {mediaType === 'image' && (
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Reference / Edit Image (Optional)</label>
                             <div 
                               onClick={() => fileInputRef.current?.click()}
                               className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                             >
                                {selectedImage ? (
                                    <div className="relative">
                                        <img src={selectedImage} alt="Ref" className="h-20 w-full object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-medium">Click to change</div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm">
                                        <Layers size={24} className="mx-auto mb-1" />
                                        <span>Click to upload</span>
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                    <button 
                      onClick={handleGenerateMedia}
                      disabled={isGenerating || !studioPrompt}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                      Generate {mediaType === 'image' ? 'Art' : 'Veo Video'}
                    </button>
                  </div>
               </div>

               {/* Gallery / Preview */}
               <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-6">Generated Gallery</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {generatedMedia.map((item, idx) => (
                       <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 group">
                         <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative">
                            {item.type === 'video' ? (
                                <video src={item.url} controls className="w-full h-full object-cover" />
                            ) : (
                                <img src={item.url} alt="Gen" className="w-full h-full object-cover" />
                            )}
                         </div>
                         <div className="p-3">
                           <div className="flex justify-between items-start">
                             <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 mr-2">"{item.prompt}"</p>
                             <span className="text-[10px] uppercase font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                               {item.type}
                             </span>
                           </div>
                         </div>
                       </div>
                     ))}
                     
                     {generatedMedia.length === 0 && (
                         <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40">
                             <ImageIcon size={48} className="mb-4" />
                             <p>No media generated yet.</p>
                         </div>
                     )}
                  </div>
               </div>
             </div>
          )}

          {/* --- LIVE TAB --- */}
          {activeTab === 'live' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white p-8 text-center">
                 <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${isLiveConnected ? 'bg-indigo-500/20 shadow-[0_0_100px_rgba(99,102,241,0.3)]' : 'bg-gray-800'}`}>
                    <div className={`absolute inset-0 rounded-full border border-indigo-500/30 scale-125 ${isLiveConnected ? 'animate-ping' : 'hidden'}`}></div>
                    <div className={`absolute inset-0 rounded-full border border-indigo-500/30 scale-150 ${isLiveConnected ? 'animate-ping animation-delay-500' : 'hidden'}`}></div>
                    
                    <button 
                      onClick={toggleLive}
                      className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 ${isLiveConnected ? 'bg-red-500 shadow-xl' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                    >
                       {isLiveConnected ? <MonitorPlay size={40} /> : <Mic size={40} />}
                    </button>
                 </div>

                 <h2 className="text-3xl font-bold mt-12 mb-2">Gemini Live</h2>
                 <p className="text-gray-400 max-w-md mx-auto mb-12">
                   {isLiveConnected 
                     ? "Listening... Speak naturally to have a real-time conversation." 
                     : "Start a real-time voice conversation with Gemini 2.5."}
                 </p>

                 <div className="flex gap-4">
                     <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-sm font-medium border border-white/10">
                         Mode: Native Audio
                     </div>
                     <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-sm font-medium border border-white/10">
                         Voice: Zephyr
                     </div>
                 </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
