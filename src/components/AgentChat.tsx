import React, { useState, useRef, useEffect } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { runLangflowAgent } from '../services/langflowService';
import {
  Sparkles,
  Bot,
  X,
  RefreshCw,
  Send,
  User,
  Droplet,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const AgentChat: React.FC = () => {
  const { activeRegion, wards, alerts, currentStep, selectedLocation } = useHeatwave();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

 const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-initial-1',
      sender: 'agent',
      text: 'Hello! I am the **Heatwave Disaster Command AI Agent**. I am connected to your live telemetry. Ask me anything about heatwave forecasts, vulnerable wards, or emergency resource dispatches.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const severeWardsList = wards
        .filter((w) => w.currentMetrics?.riskLevel === 'SEVERE' || w.currentMetrics?.riskLevel === 'HIGH')
        .map((w) => ({
          code: w.code,
          name: w.name,
          zone: w.zone,
          utci: w.currentMetrics?.utci,
          wbgt: w.currentMetrics?.wbgt,
          hvi: w.vulnerability?.hvi,
          population: w.population,
        }));

      const contextData = {
        region: activeRegion?.name || 'NCR Region',
        totalWards: wards.length,
        severeCount: severeWardsList.length,
        severeWardsList,
        heatwaveTimeline: [
          { hour: 0, time: 'Today 2:00 PM', status: 'Extreme Heatwave Peak', utci: selectedLocation?.uctiIndex || 49.4 },
          { hour: 24, time: 'Tomorrow 1:30 PM', status: 'Severe Heatwave Spike', utci: 50.8 },
          { hour: 48, time: 'Day 3 12:00 PM', status: 'High Thermal Stress', utci: 47.6 },
          { hour: 96, time: 'Day 5 1:00 PM', status: 'Extended Diurnal Heat Surge', utci: 49.8 },
        ],
        selectedLocation: selectedLocation?.name || 'City Center',
        currentUtci: selectedLocation?.uctiIndex || wards[0]?.currentMetrics?.utci || 49.4,
        ambientTemp: selectedLocation?.ambientTemperature || wards[0]?.currentMetrics?.tempC || 42.5,
        wbgt: selectedLocation?.wbgtIndex || wards[0]?.currentMetrics?.wbgt || 33.7,
      };

      // Call LangFlow Agent service
      const reply = await runLangflowAgent(text.trim(), contextData);

      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'agent',
        text: '⚠️ Unable to connect to LangFlow AI server. Please check if the backend service is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    {
      icon: <Flame className="w-3 h-3 text-rose-400" />,
      label: 'Heatwave Area Forecast',
      prompt: `When and which areas will experience severe heatwaves in ${activeRegion?.name || 'this region'}?`,
    },
    {
      icon: <Droplet className="w-3 h-3 text-sky-400" />,
      label: 'Water Tanker Placements',
      prompt: `Which wards in ${activeRegion?.name || 'this region'} require emergency water tankers immediately?`,
    },
    {
      icon: <ShieldAlert className="w-3 h-3 text-amber-400" />,
      label: 'UTCI Thermal Stress Summary',
      prompt: `Summarize the current UTCI thermal stress for ${activeRegion?.name || 'this region'}.`,
    },
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-[999] select-none font-sans">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 text-white font-extrabold text-xs shadow-2xl hover:shadow-rose-500/50 hover:scale-105 transition-all ring-2 ring-white/30 animate-bounce hover:animate-none"
          title="Open LangFlow AI Assistant"
          aria-label="Open LangFlow AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
          </div>
          <span className="tracking-wide uppercase font-sans font-black text-xs">ASK AI</span>
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
        </button>
      </div>

      {/* Interactive Responsive Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950/98 shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      AI Disaster Command Agent
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE AGENT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                    {activeRegion?.name || 'NCR Region'} • Connected to LangFlow AI
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close AI Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 text-xs ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-sky-600'
                        : 'bg-gradient-to-br from-rose-500 to-amber-600'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl space-y-1.5 ${
                      msg.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-tr-none shadow-lg'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs">
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 block text-right font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                  <span className="font-mono text-xs font-bold">
                    LangFlow AI Agent is analyzing telemetry and generating response...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips Bar */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-950 overflow-x-auto scrollbar-none flex gap-2 shrink-0">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={loading}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all shrink-0 shadow-sm"
                >
                  {qp.icon}
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Ask LangFlow AI Agent anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition-all shrink-0 shadow-md"
                title="Send Message to LangFlow AI"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};