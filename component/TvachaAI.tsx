import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Send, User, Stethoscope, Loader2, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AnalysisResult {
  condition: string;
  description: string;
  remedies: string[];
  confidence: string;
}

interface TvachaAIProps {
  onMessageSent: () => boolean;
  messageCount: number;
  isConnected: boolean;
  balance: number;
}

export const TvachaAI: React.FC<TvachaAIProps> = ({ onMessageSent, messageCount, isConnected, balance }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setMessages([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    // Analysis itself is free for now, or we can count it as a message
    // Let's count the analysis as the first message
    if (messageCount >= 2) {
      if (!isConnected) {
        alert("Please connect your MetaMask wallet to continue diagnostics after 2 free interactions.");
        return;
      }
      if (balance < 0.01) {
        alert("Insufficient balance in MetaMask. Please top up to continue.");
        return;
      }
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = image.split(',')[1];
      
      const prompt = `Analyze this image of a skin condition. 
      Identify the possible condition, provide a brief description, and suggest some common remedies or next steps.
      Return the response in JSON format with the following structure:
      {
        "condition": "Name of the condition",
        "description": "Brief explanation",
        "remedies": ["Remedy 1", "Remedy 2", ...],
        "confidence": "High/Medium/Low"
      }
      Disclaimer: Always state that this is an AI analysis and not a professional medical diagnosis.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const analysis = JSON.parse(response.text || '{}') as AnalysisResult;
      setResult(analysis);
      
      // Deduct balance for analysis
      onMessageSent();

      const initialMessages: Message[] = [];
      if (messageCount >= 2) {
        initialMessages.push({ role: 'model', text: "*$0.01 deducted from your wallet for analysis*" });
      }

      // Initialize chat with the analysis result
      setMessages([
        ...initialMessages,
        { 
          role: 'model', 
          text: `I have analyzed the image. It appears to be **${analysis.condition}**. 
          
**Description:** ${analysis.description}

**Suggested Remedies:**
${analysis.remedies.map(r => `* ${r}`).join('\n')}

*Disclaimer: This is an AI-generated analysis for informational purposes only. Please consult a dermatologist for a professional diagnosis.*

How can I help you further regarding this condition?` 
        }
      ]);
    } catch (err) {
      console.error("Analysis Error:", err);
      setError("Failed to analyze the image. Please ensure it's a clear photo of the skin issue.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChat = async () => {
    if (!input.trim() || isChatLoading || !result) return;

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

    const userMsg = input.trim();
    setInput('');
    
    const newMessages: Message[] = [...messages, { role: 'user', text: userMsg }];
    
    if (messageCount >= 2) {
      newMessages.push({ role: 'model', text: "*$0.01 deducted from your wallet*" });
    }
    
    setMessages(newMessages);
    setIsChatLoading(true);

    // Deduct balance
    onMessageSent();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are TvachaAI, a dermatological assistant. 
          The user has uploaded an image which was identified as ${result.condition}. 
          Provide helpful, empathetic information about this specific condition. 
          Always remind the user to see a professional for actual treatment.`
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const response = await chat.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to the chat service." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black mb-2">TvachaAI Skin Analysis</h2>
        <p className="text-gray-500 text-lg">Upload a clear photo of the skin concern for AI-powered identification and guidance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
              image ? 'border-indigo-500 bg-white' : 'border-gray-300 hover:border-indigo-400 bg-gray-50'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            
            {image ? (
              <img src={image} alt="Skin concern" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload size={32} />
                </div>
                <p className="text-gray-600 font-bold mb-1">Click to upload or drag and drop</p>
                <p className="text-gray-400 text-sm">PNG, JPG up to 10MB</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                <p className="text-indigo-600 font-bold animate-pulse text-lg">Analyzing Skin Patterns...</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={analyzeImage}
              disabled={!image || isAnalyzing || !!result}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <Stethoscope size={20} />}
              {result ? 'Analysis Complete' : 'Start AI Analysis'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
            >
              <RefreshCcw size={20} />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-amber-700">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold mb-1">Important Medical Disclaimer</p>
              <p>TvachaAI is an educational tool and does not provide medical diagnoses. Always seek the advice of a qualified health provider for any medical condition.</p>
            </div>
          </div>
        </div>

        {/* Chat/Result Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[600px] lg:h-auto">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Stethoscope size={20} />
              </div>
              <h3 className="font-bold text-gray-800">TvachaAI Consultation</h3>
            </div>
            {result && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={14} />
                Identified
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!result && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 px-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon size={32} />
                </div>
                <p className="text-lg font-medium">Upload and analyze an image to start the consultation</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Stethoscope size={16} />}
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
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-center text-gray-400">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Stethoscope size={16} />
                  </div>
                  <Loader2 size={20} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {result && (
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 px-6 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !input.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
