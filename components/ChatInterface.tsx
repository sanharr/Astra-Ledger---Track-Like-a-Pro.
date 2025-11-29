import React, { useRef, useEffect } from 'react';
import { 
  Send, Camera, X, Loader2, Receipt, Activity, BarChart3 
} from 'lucide-react';
import { Message, AgentStatus } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isProcessing: boolean;
  agentStatus: AgentStatus;
  selectedImage: File | null;
  imagePreview: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onSend: (e: React.FormEvent) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  setInput,
  isProcessing,
  agentStatus,
  selectedImage,
  imagePreview,
  onImageSelect,
  onClearImage,
  onSend
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, agentStatus]);

  const renderStatusIndicator = () => {
    if (!isProcessing) return null;
    
    const statusMap: Record<string, { label: string, icon: React.ElementType }> = {
      vision: { label: "Scanning Receipt...", icon: Camera },
      parsing: { label: "Parsing Text...", icon: Activity },
      ledger: { label: "Updating Ledger...", icon: Receipt },
      summary: { label: "Analyzing...", icon: BarChart3 },
      idle: { label: "Processing...", icon: Loader2 }
    };
    
    const current = statusMap[agentStatus] || statusMap.idle;
    const Icon = current.icon;

    return (
      <div className="flex w-full justify-start mb-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-full px-4 py-2">
          <Icon className="w-3.5 h-3.5 animate-pulse text-gray-500" />
          <span className="text-xs font-medium text-gray-500">{current.label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] px-5 py-3.5 text-[15px] shadow-sm ${
              msg.type === 'user' 
                ? 'bg-black text-white rounded-2xl rounded-br-sm' 
                : 'bg-[#F5F5F7] text-[#1D1D1F] rounded-2xl rounded-bl-sm border border-transparent'
            }`}>
              {/* User Image Display */}
              {msg.image && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                  <img src={msg.image} alt="User upload" className="max-w-full h-auto max-h-48 object-cover" />
                </div>
              )}

              <div className="leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</div>
              
              {/* Parsed Data Card */}
              {msg.data && msg.data.length > 0 && (
                <div className="mt-4 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  {msg.data.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 text-xs border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        <span className="font-semibold text-gray-700 capitalize">{item.item}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{item.category}</span>
                      </div>
                      <span className="font-bold text-black">{CURRENCY_SYMBOL} {item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {renderStatusIndicator()}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 sm:p-6 bg-white border-t border-gray-100 pb-safe">
        
        {/* Image Preview Overlay */}
        {imagePreview && (
          <div className="absolute bottom-full left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent flex justify-center pb-8">
            <div className="relative group animate-in slide-in-from-bottom-4 duration-300">
              <img src={imagePreview} alt="Preview" className="h-24 rounded-xl shadow-lg border border-gray-200" />
              <button 
                onClick={onClearImage} 
                className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1.5 shadow-md hover:bg-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={onSend} className="relative flex items-center gap-2 max-w-3xl mx-auto">
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*"
            onChange={onImageSelect}
            className="hidden" 
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex-none p-3 rounded-2xl transition-all duration-200 ${
              selectedImage 
                ? 'bg-gray-100 text-black ring-2 ring-black/5' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title="Upload Receipt"
            disabled={isProcessing}
          >
            <Camera className="w-6 h-6" />
          </button>

          <div className="relative flex-1 group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Add a note (optional)..." : "Log expenses or upload receipt..."}
              className="w-full pl-5 pr-14 py-4 bg-[#F5F5F7] border-0 rounded-2xl text-[#1D1D1F] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all text-[15px] font-medium"
              disabled={isProcessing}
            />
            <div className="absolute right-2 top-2 bottom-2">
               <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isProcessing}
                className={`h-full aspect-square flex items-center justify-center rounded-xl transition-all duration-200 ${
                  (input.trim() || selectedImage) && !isProcessing
                    ? 'bg-black text-white hover:bg-gray-800 shadow-sm active:scale-95' 
                    : 'bg-transparent text-gray-300 cursor-not-allowed'
                }`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}</style>
    </div>
  );
};

export default ChatInterface;
