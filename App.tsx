
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Command, Database, Cloud } from 'lucide-react';
import { 
  initAuth, 
  subscribeToExpenses, 
  addExpense, 
  removeExpense 
} from './services/firebaseService';
import { 
  buildMemoryContext, 
  runParsingAgent, 
  runVisionAgent, 
  runSummaryAgent, 
  runAdvisorAgent,
  fileToBase64
} from './services/geminiService';
import { Expense, Message, AgentStatus } from './types';
import { CURRENCY_SYMBOL, IS_FIREBASE_CONFIGURED } from './constants';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'intro', 
      type: 'bot', 
      text: "Astra Ledger online. Type expenses, upload a receipt, or ask 'How much did I spend on food?'" 
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [advisorTip, setAdvisorTip] = useState<string | null>(null);

  // --- 1. Auth & Data Subscription ---
  useEffect(() => {
    // Initialize Auth (or Mock Auth if local)
    const unsubscribeAuth = initAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // If no user (or demo mode), we use 'local_user'
    const uid = user?.uid || 'local_user';
    const unsubscribeExpenses = subscribeToExpenses(uid, (data) => {
      setExpenses(data);
    });
    return () => unsubscribeExpenses();
  }, [user]);

  // --- 2. Advisor Trigger ---
  useEffect(() => {
    if (activeTab === 'dashboard' && expenses.length > 0 && !advisorTip) {
      runAdvisorAgent(expenses).then(setAdvisorTip);
    }
  }, [activeTab, expenses, advisorTip]);

  // --- 3. Handlers ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isProcessing) return;

    const userText = input;
    const userImage = selectedImage;
    const userImagePreview = imagePreview; // Store for message display

    // Clear Input
    setInput('');
    clearImage();

    // Optimistic UI
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      type: 'user', 
      text: userText, 
      image: userImagePreview || undefined
    }]);

    setIsProcessing(true);

    try {
      let extractedExpenses: Expense[] = [];

      // A. Vision Agent
      if (userImage) {
        setAgentStatus('vision');
        const base64 = await fileToBase64(userImage);
        const visionResults = await runVisionAgent(base64, userImage.type);
        extractedExpenses = [...visionResults];
      }

      // B. Text Parsing / Summary
      if (userText.trim()) {
        const isQuestion = /^(how|what|show|list|sum|calculate|analyze|total|spent)/i.test(userText);
        
        if (isQuestion) {
           setAgentStatus('summary');
           const answer = await runSummaryAgent(userText, expenses);
           setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: answer }]);
           setIsProcessing(false);
           setAgentStatus('idle');
           return; 
        } else {
           setAgentStatus('parsing');
           const memoryContext = buildMemoryContext(expenses);
           const textResults = await runParsingAgent(userText, memoryContext);
           extractedExpenses = [...extractedExpenses, ...textResults];
        }
      }

      // C. Commit to Ledger
      if (extractedExpenses.length > 0) {
        setAgentStatus('ledger');
        
        const uid = user?.uid || 'local_user';
        const promises = extractedExpenses.map(exp => 
           addExpense(uid, exp, userText || "Receipt Scan")
        );
        
        await Promise.all(promises);

        const total = extractedExpenses.reduce((sum, item) => sum + item.amount, 0);
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          type: 'bot', 
          text: `Ledger updated. Total: ${CURRENCY_SYMBOL} ${total.toLocaleString()}`,
          data: extractedExpenses
        }]);
      } else if (!userText && userImage) {
         setMessages(prev => [...prev, { id: Date.now()+1, type: 'bot', text: "I couldn't identify any clear transactions in that image." }]);
      } else if (userText && !userImage) {
         setMessages(prev => [...prev, { id: Date.now()+1, type: 'bot', text: "I couldn't detect a valid expense transaction." }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: "System encountered an error processing your request." }]);
    } finally {
      setIsProcessing(false);
      setAgentStatus('idle');
    }
  };

  const handleDeleteExpense = (id: string) => {
    const uid = user?.uid || 'local_user';
    removeExpense(uid, id);
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-[#1D1D1F] overflow-hidden">
      
      {/* Header */}
      <header className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 sm:px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="bg-black p-1.5 rounded-lg">
            <Command className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-black">ASTRA LEDGER</h1>
          </div>
        </div>
        
        <div className="flex gap-1 bg-[#F5F5F7] p-1 rounded-full">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'chat' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Ledger
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'dashboard' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Insights
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col w-full mx-auto max-w-4xl shadow-2xl shadow-gray-200/50 sm:my-4 sm:rounded-3xl sm:border border-gray-100 bg-white">
        
        {activeTab === 'chat' ? (
          <ChatInterface 
            messages={messages}
            input={input}
            setInput={setInput}
            isProcessing={isProcessing}
            agentStatus={agentStatus}
            selectedImage={selectedImage}
            imagePreview={imagePreview}
            onImageSelect={handleImageSelect}
            onClearImage={clearImage}
            onSend={handleSend}
          />
        ) : (
          <Dashboard 
            expenses={expenses}
            advisorTip={advisorTip}
            onDelete={handleDeleteExpense}
          />
        )}

      </main>

      {/* Footer Status */}
      <div className="flex-none py-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-[10px] text-gray-400 font-medium">
          {IS_FIREBASE_CONFIGURED ? (
            <>
              <Cloud className="w-3 h-3" />
              <span>Cloud Sync Active</span>
            </>
          ) : (
            <>
              <Database className="w-3 h-3" />
              <span>Local Storage Mode</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
