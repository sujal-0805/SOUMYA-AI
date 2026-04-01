import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ManasAIChatbotProps {
  onMessageSent: () => boolean;
  messageCount: number;
  isConnected: boolean;
  balance: number;
}

const SYSTEM_INSTRUCTION = `You are ManasAI, a sentiment-aware wellness bot and mental health companion. 
Your goal is to provide supportive, empathetic, and informative guidance regarding mental health, wellness, and various treatments.
Always maintain a calm, non-judgmental, and compassionate tone.
If a user expresses thoughts of self-harm or severe crisis, provide immediate resources like crisis hotlines (e.g., 988 in the US) and encourage them to seek professional help immediately.
You are an AI, not a doctor. Always include a disclaimer that your advice is for informational purposes and not a substitute for professional medical diagnosis or treatment.
Focus on evidence-based wellness strategies, mindfulness, and explaining common mental health concepts.`;

export const ManasAIChatbot: React.FC<ManasAIChatbotProps> = ({ onMessageSent, messageCount, isConnected, balance }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello, I'm ManasAI. I'm here to listen and support your mental wellness journey. How are you feeling today?" }
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
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error connecting to my neural pathways. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([{ role: 'model', text: "Hello, I'm ManasAI. I'm here to listen and support your mental wellness journey. How are you feeling today?" }]);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold">ManasAI Wellness Companion</h3>
            <p className="text-xs text-indigo-100">Sentiment-Aware AI</p>
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
                msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
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
                <Bot size={16} />
              </div>
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm italic">ManasAI is reflecting...</span>
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
            placeholder="Share what's on your mind..."
            className="flex-1 px-6 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="mt-4 text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
          Informational purposes only • Not a medical substitute
        </p>
      </div>
    </div>
  );
};
