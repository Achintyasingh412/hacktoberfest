import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Resident, Booking, ResourceInfo, LiveHostelContext, MarketplaceItem } from '../types';
import { getCompanionChatMessages, appendCompanionChatMessage } from '../services/storageService';
import { askAICompanion } from '../services/gemmaService';
import { SpeakButton } from './SpeakButton';
import { Send, Terminal, Sparkles, User, Bot, HelpCircle, Utensils, Moon, Thermometer, ShieldAlert, CheckCircle, Database, Cpu, ShoppingBag } from 'lucide-react';

interface AICompanionProps {
  currentUser: Resident;
  activeBookings: Booking[];
  resources: ResourceInfo[];
  sessionDate: string;
  marketplaceItems?: MarketplaceItem[];
}

export const AICompanion: React.FC<AICompanionProps> = ({
  currentUser,
  activeBookings,
  resources,
  sessionDate,
  marketplaceItems,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getCompanionChatMessages());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickStarters = [
    { label: '🍜 What snacks are on auction?', query: 'What snacks or items are currently up for auction in the Hostel Marketplace and what are the leading bids?' },
    { label: '🏸 Badminton Court A at 7 PM?', query: 'Is Badminton Court A free at 7:00 PM tonight?' },
    { label: '🏀 Who booked Basketball?', query: 'Who has booked the Basketball & Hoop tonight, and which slots are free?' },
    { label: '⚡ Check Peak Conflicts', query: 'Are there any court conflicts or peak bottlenecks on the schedule tonight?' },
    { label: '💵 Cash on pickup rules?', query: 'How does cash on pickup work for winning an auction in the hostel?' },
    { label: '🔊 Speaker Rules & Slots', query: 'Can I book the Bluetooth Speaker tonight and what are the volume rules?' },
    { label: '🏓 Table Tennis Availability', query: 'Which Table Tennis racket slots are currently open?' },
    { label: 'AC Debate: 18°C vs 24°C', query: 'Settle our room debate: should the AC thermostat be 18°C or 24°C?' },
    { label: 'Maggi Kettle Chores', query: 'Who is responsible for scrubbing the midnight Maggi electric kettle?' },
  ];

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputVal).trim();
    if (!text || isLoading) return;

    setInputVal('');

    // Append user message
    const userMsg = appendCompanionChatMessage({
      sender: 'user',
      text: text,
      source: 'gemma-open-weight',
    });

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build history
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const liveContext: LiveHostelContext = {
        currentUser,
        activeBookings,
        resources,
        sessionDate,
        marketplaceItems,
      };

      const res = await askAICompanion(text, history, liveContext);

      const botMsg = appendCompanionChatMessage({
        sender: 'gemma',
        text: res.text,
        source: res.source,
      });

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg = appendCompanionChatMessage({
        sender: 'gemma',
        text: 'Warden Gemma is currently inspecting the East Wing. Check your Google Gemma model runtime configuration.',
        source: 'gemma-builtin',
      });
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#874F41] border border-[#90AEAD] rounded-sm text-[#FBE9D0] shadow-xl flex flex-col h-[740px] max-h-[85vh] overflow-hidden">
      {/* Companion Header */}
      <div className="p-4 lg:p-5 border-b border-[#90AEAD]/40 bg-[#874F41] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#244855] border border-[#90AEAD]/50 flex items-center justify-center text-[#E64833]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-[#90AEAD] uppercase tracking-wider flex items-center gap-2">
              <span>LOCAL GEMMA AI AGENT · LAYER 2</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Database className="w-3 h-3" />
                Live Matrix Synced
              </span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#FBE9D0]">
              Warden & Roommate AI Companion
            </h2>
          </div>
        </div>

        <div className="text-right text-[11px] font-mono">
          <div className="text-[#90AEAD]">
            Live Context: <span className="text-[#FBE9D0] font-semibold">{activeBookings.filter(b => b.status === 'active').length} Active Bookings</span>
          </div>
          <div className="text-[10px] text-[#FBE9D0]/60">
            Active Student: {currentUser.name} ({currentUser.credits}/4 Credits)
          </div>
        </div>
      </div>

      {/* Demo Mode Notice Bar */}
      <div className="bg-[#244855]/95 border-b border-[#90AEAD]/30 px-4 py-2 text-xs font-mono text-[#FBE9D0] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#E64833] shrink-0" />
          <span>Running in demo mode (pre-scripted responses). Run locally for live AI.</span>
        </div>
        <span className="text-[10px] text-amber-300 bg-[#874F41] px-2 py-0.5 rounded border border-[#90AEAD]/40 font-bold shrink-0">Demo Active</span>
      </div>

      {/* Quick Prompt Starters */}
      <div className="px-4 py-2.5 bg-[#244855]/70 border-b border-[#90AEAD]/30 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] font-mono text-[#90AEAD] uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#E64833]" />
          Matrix & Room Arbitrations:
        </span>
        {quickStarters.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q.query)}
            disabled={isLoading}
            className="px-2.5 py-1 text-xs bg-[#874F41] hover:bg-[#E64833] border border-[#90AEAD]/30 rounded-sm text-[#FBE9D0] transition-colors whitespace-nowrap shrink-0"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-[#244855]/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-sm shrink-0 flex items-center justify-center text-xs font-mono font-bold ${
                  isUser
                    ? 'bg-[#E64833] text-[#FBE9D0]'
                    : 'bg-[#244855] border border-[#90AEAD] text-[#90AEAD]'
                }`}
              >
                {isUser ? (currentUser.regDigits || currentUser.uid.replace('REG-', '')) : 'AI'}
              </div>

              <div
                className={`max-w-[82%] rounded-sm p-3.5 shadow-sm text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#E64833] text-[#FBE9D0]'
                    : 'bg-[#874F41] border border-[#90AEAD]/50 text-[#FBE9D0]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mb-1">
                  <span>{isUser ? currentUser.name : 'Hostel Nexus Gemma'}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="whitespace-pre-line font-sans text-xs sm:text-sm">
                  {msg.text}
                </div>

                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-[#90AEAD]/20 flex items-center justify-between gap-2">
                    <div className="text-[9px] font-mono text-[#90AEAD]">
                      <span>{msg.source === 'gemma-open-weight' ? 'Google Gemma (Local Weights / Server)' : 'Google Gemma 2 9B (Built-In Engine)'}</span>
                    </div>
                    <SpeakButton id={`msg-${msg.id}`} text={msg.text} size="xs" label="Speak" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-sm bg-[#244855] border border-[#90AEAD] text-[#90AEAD] flex items-center justify-center text-xs font-mono">
              AI
            </div>
            <div className="bg-[#874F41] border border-[#90AEAD]/50 p-3.5 rounded-sm text-xs text-[#90AEAD] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E64833] animate-ping" />
              <span>Gemma AI is scanning the live booking matrix & hostel rulebook...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-[#90AEAD]/40 bg-[#874F41] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask about slot availability, court conflicts, late-night snacks, or hostel rules..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-xs text-[#FBE9D0] placeholder-[#FBE9D0]/50 focus:outline-none focus:border-[#E64833]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="px-4 py-2.5 bg-[#E64833] hover:bg-[#d03d2a] disabled:opacity-50 text-[#FBE9D0] text-xs font-medium rounded-sm transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Consult</span>
          </button>
        </form>
        <div className="text-[10px] text-[#90AEAD] font-mono mt-1.5 flex items-center justify-between">
          <span>Private & Local · Real-time access to live bookings & strict resource catalog</span>
          <span>Google Gemma Open-Weight Model Architecture</span>
        </div>
      </div>
    </div>
  );
};

