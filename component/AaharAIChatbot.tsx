import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Utensils, Loader2, RefreshCcw, Apple } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AaharAIChatbotProps {
  onMessageSent: () => boolean;
  messageCount: number;
  isConnected: boolean;
  balance: number;
}

const SYSTEM_INSTRUCTION = `You are AaharAI, a specialized dietary assistant focusing on Vedic dietary strategies and personalized nutrition.
Your goal is to provide information about healthy eating, meal planning, and the principles of Ayurveda/Vedic nutrition (Sattvic, Rajasic, Tamasic diets).
Always maintain a helpful, encouraging, and health-conscious tone.
Key principles to follow:
1. Focus on whole, natural foods.
2. Explain the benefits of different ingredients from both a nutritional and Vedic perspective.
3. Provide sample meal ideas based on user preferences or goals.
4. Always include a disclaimer: "I am an AI dietary assistant, not a certified nutritionist or doctor. Please consult with a healthcare professional before making significant changes to your diet, especially if you have underlying health conditions."
Focus on balance, seasonal eating, and mindful consumption.`;

export const AaharAIChatbot: React.FC<AaharAIChatbotProps> = ({ onMessageSent, messageCount, isConnected, balance }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Namaste! I'm AaharAI, your Vedic dietary guide. I can help you plan balanced meals and understand the wisdom of conscious eating. What are your dietary goals today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check monetization
    if (messageCount >= 2) {
      if (!isConnected) {
        alert("Please connect your MetaMask wallet to continue chatting after 2 free messages.");
        return;
      }
      if (balance < 0.01) {
        alert("Insufficient balance in MetaMask. Please top up to continue.");
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    
    if (messageCount >= 2) {
      newMessages.push({ role: 'model', text: "*$0.01 deducted from your wallet*" });
    }
    
    setMessages(newMessages);
    setIsLoading(true);

    // Deduct balance and update count
    onMessageSent();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage({ message: userMessage });
      const responseText = result.text || "I'm sorry, I couldn't process that. Could you try again?";
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error connecting to my nutritional database. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([{ role: 'model', text: "Namaste! I'm AaharAI, your Vedic dietary guide. I can help you plan balanced meals and understand the wisdom of conscious eating. What are your dietary goals today?" }]);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Apple size={20} />
          </div>
          <div>
            <h3 className="font-bold">AaharAI Dietary Guide</h3>
            <p className="text-xs text-emerald-100">Vedic Nutrition AI</p>
          </div>
        </div>
        <button 
          onClick={resetChat}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Reset Conversation"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-[400px]">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Utensils size={16} />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Utensils size={16} />
              </div>
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm italic">AaharAI is preparing a response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/50">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about diet plans, Vedic nutrition, or healthy recipes..."
            className="flex-1 px-6 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-200"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="mt-4 text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
          Informational purposes only • Consult a professional
        </p>
      </div>
    </div>
  );
};
