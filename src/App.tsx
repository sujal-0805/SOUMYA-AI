/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Home, 
  Stethoscope, 
  Brain, 
  Apple, 
  Menu, 
  Wallet,
  ChevronRight,
  Activity,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ManasAIChatbot } from './components/ManasAIChatbot';
import { AaharAIChatbot } from './components/AaharAIChatbot';
import { TvachaAI } from './components/TvachaAI';
import { GeneralChatbot } from './components/GeneralChatbot';

// --- Types ---
type Tab = 'home' | 'skin' | 'wellness' | 'diet';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  onClick: () => void;
}

// --- Components ---

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, icon, emoji, onClick }) => (
  <motion.div
    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
    onClick={onClick}
    className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm cursor-pointer transition-all flex flex-col h-full min-h-[280px]"
  >
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        {title} <span className="text-2xl">{emoji}</span>
      </h3>
      <div className="text-indigo-500">
        {icon}
      </div>
    </div>
    <p className="text-gray-500 text-lg leading-relaxed mb-auto">
      {description}
    </p>
    <div className="mt-6 flex items-center text-indigo-600 font-medium group">
      Explore Module <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState(10.00); // Initial mock balance in dollars
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  // Track message counts for each bot to implement the "2 free messages" rule
  const [usage, setUsage] = useState({
    skin: 0,
    wellness: 0,
    diet: 0,
    general: 0
  });

  const connectWallet = () => {
    setIsConnected(true);
    setAccount('0x71C...4f2A');
  };

  const deductBalance = (botId: keyof typeof usage) => {
    if (!isConnected) return false;
    
    const currentCount = usage[botId];
    if (currentCount >= 2) {
      if (balance >= 0.01) {
        setBalance(prev => Math.max(0, prev - 0.01));
        setUsage(prev => ({ ...prev, [botId]: prev[botId] + 1 }));
        return true;
      } else {
        return false;
      }
    } else {
      // Free message
      setUsage(prev => ({ ...prev, [botId]: prev[botId] + 1 }));
      return true;
    }
  };

  const navItems = [
    { id: 'home', icon: <Home size={24} />, label: 'Home', emoji: '🏠' },
    { id: 'skin', icon: <Stethoscope size={24} />, label: 'TvachaAI', emoji: '🩺' },
    { id: 'wellness', icon: <Brain size={24} />, label: 'ManasAI', emoji: '🧠' },
    { id: 'diet', icon: <Apple size={24} />, label: 'AaharAI', emoji: '🍎' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        animate={{ width: isSidebarExpanded ? 240 : 80 }}
        className="flex flex-col items-center py-8 bg-white border-r border-gray-100 shadow-sm z-20 overflow-hidden"
      >
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="p-3 mb-12 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-4 w-full px-7"
        >
          <Menu size={24} className="text-gray-600 flex-shrink-0" />
          {isSidebarExpanded && <span className="font-bold text-gray-800">Menu</span>}
        </button>
        
        <nav className="flex flex-col gap-4 w-full px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`p-3 rounded-2xl transition-all relative group flex items-center gap-4 w-full ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="relative flex-shrink-0">
                {item.icon}
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute -left-7 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-600 rounded-r-full"
                  />
                )}
              </div>
              {isSidebarExpanded && (
                <span className="font-semibold whitespace-nowrap">{item.label}</span>
              )}
              {/* Tooltip (only when collapsed) */}
              {!isSidebarExpanded && (
                <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="px-12 py-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl font-black tracking-tight text-gray-900">
                Soumya.AI
              </h1>
              <span className="text-4xl">🐇</span>
            </div>
            <p className="text-xl text-gray-500 font-medium">
              Next-Gen AI Medical Identity System
            </p>
          </div>

          <div className="flex flex-col items-end gap-4">
            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connectWallet}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-lg shadow-lg transition-all bg-gradient-to-r from-cyan-400 to-teal-400 text-white"
              >
                <span className="text-xl">🦊</span>
                Connect MetaMask
              </motion.button>
            ) : (
              <div className="bg-[#1E293B] text-cyan-400 px-6 py-2 rounded-xl font-mono text-sm flex items-center gap-3 shadow-inner">
                <span className="opacity-70">Balance:</span>
                <span className="font-bold">${balance.toFixed(2)}</span>
                <span className="text-gray-500">|</span>
                <span className="text-emerald-400">
                  {account}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="px-12 pb-12">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                  <ModuleCard
                    title="TvachaAI"
                    emoji="🩺"
                    description="Advanced CNN-based skin analysis for dermatological insights and early detection."
                    icon={<Stethoscope size={32} />}
                    onClick={() => setActiveTab('skin')}
                  />
                  <ModuleCard
                    title="ManasAI"
                    emoji="🧠"
                    description="Sentiment-aware wellness bot providing personalized mental health support and guidance."
                    icon={<Brain size={32} />}
                    onClick={() => setActiveTab('wellness')}
                  />
                  <ModuleCard
                    title="AaharAI"
                    emoji="🍎"
                    description="Vedic dietary strategies tailored to your unique biological identity and lifestyle."
                    icon={<Apple size={32} />}
                    onClick={() => setActiveTab('diet')}
                  />
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <Wallet className="text-indigo-600" /> Monetization Policy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-indigo-800/80">
                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                      <p className="font-bold text-indigo-600 mb-1">Free Tier</p>
                      <p className="text-sm">First 2 messages in each AI module are completely free of charge.</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                      <p className="font-bold text-indigo-600 mb-1">Premium Access</p>
                      <p className="text-sm">Subsequent messages are charged at $0.01 (approx. ₹1) per message, deducted automatically from your MetaMask wallet.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'skin' && (
              <motion.div
                key="skin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-12 h-full flex flex-col"
              >
                <TvachaAI 
                  onMessageSent={() => deductBalance('skin')} 
                  messageCount={usage.skin}
                  isConnected={isConnected}
                  balance={balance}
                />
              </motion.div>
            )}

            {activeTab === 'wellness' && (
              <motion.div
                key="wellness"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-12 h-full flex flex-col"
              >
                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-black mb-2">ManasAI Wellness Companion</h2>
                  <p className="text-gray-500 text-lg">Your sentiment-aware mental health companion.</p>
                </div>
                <div className="flex-1 min-h-[600px]">
                  <ManasAIChatbot 
                    onMessageSent={() => deductBalance('wellness')} 
                    messageCount={usage.wellness}
                    isConnected={isConnected}
                    balance={balance}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'diet' && (
              <motion.div
                key="diet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-12 h-full flex flex-col"
              >
                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-black mb-2">AaharAI Dietary Guide</h2>
                  <p className="text-gray-500 text-lg">Vedic dietary strategies and personalized nutrition plans.</p>
                </div>
                <div className="flex-1 min-h-[600px]">
                  <AaharAIChatbot 
                    onMessageSent={() => deductBalance('diet')} 
                    messageCount={usage.diet}
                    isConnected={isConnected}
                    balance={balance}
                  />
                </div>
              </motion.div>
            )}

            {activeTab !== 'home' && activeTab !== 'wellness' && activeTab !== 'diet' && activeTab !== 'skin' && (
              <motion.div
                key="module"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-12 bg-white rounded-3xl p-12 shadow-sm border border-gray-100 min-h-[500px] flex flex-col items-center justify-center text-center"
              >
                <div className="mb-6 p-6 bg-indigo-50 rounded-full text-indigo-600">
                  {navItems.find(i => i.id === activeTab)?.icon}
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  {navItems.find(i => i.id === activeTab)?.label} Module
                </h2>
                <p className="text-xl text-gray-500 max-w-2xl mb-8">
                  This module is currently being calibrated for your medical identity. 
                  Please ensure your MetaMask wallet is connected to access full diagnostics.
                </p>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                >
                  Back to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <GeneralChatbot 
        onMessageSent={() => deductBalance('general')} 
        messageCount={usage.general}
        isConnected={isConnected}
        balance={balance}
      />
    </div>
  );
}
