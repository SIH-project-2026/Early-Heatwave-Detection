import React, { useState, useRef, useEffect } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { runLangflowAgent } from '../services/langflowService';
import { fetchLiveWeatherForCoords } from '../services/liveWeatherService';
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
  Siren,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const AgentChat: React.FC = () => {
  const {
    activeRegion,
    wards,
    alerts,
    currentStep,
    selectedLocation,
    isAgentChatOpen,
    setIsAgentChatOpen,
  } = useHeatwave();
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: `Namaste! Main aapka Weather & Heatwave Safety Assistant hoon. 🌤️

Aap mujhse aam bolchal me mausam, kal ka taapmaan, garmi ya baarish ke baare me kuch bhi pooch sakte hain!

Jaise:
• "Kal mausam kaisa hoga?"
• "Kya heatwave ya zyada garmi ka khatra hai?"
• "Emergency me ambulance aur hospital kahan hai?"
• "Garmi se bachne ke aasan tips"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAgentChatOpen) scrollToBottom();
  }, [messages, isAgentChatOpen]);

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
      // Fetch live weather telemetry for the active region
      let liveWeather = null;
      try {
        liveWeather = await fetchLiveWeatherForCoords(
          activeRegion.coordinates[1],
          activeRegion.coordinates[0],
          activeRegion.name
        );
      } catch (err) {
        console.warn('Weather fetch in agent note:', err);
      }

      const ambientTemp = liveWeather?.temperatureC ?? selectedLocation?.ambientTemperature ?? 27;
      const apparentTemp = liveWeather?.apparentTempC ?? ambientTemp + 3;
      const conditionText = liveWeather?.conditionText ?? 'Mostly cloudy';
      const humidity = liveWeather?.humidity ?? 82;
      const rainProb = liveWeather?.precipitationProbability ?? 70;
      const dailyForecast = liveWeather?.dailyForecast ?? [];
      const tomorrow = dailyForecast[1] || dailyForecast[0] || null;
      const isActualHeatwave = ambientTemp >= 38;

      const contextData = {
        region: activeRegion.name,
        totalWards: wards.length,
        severeCount: isActualHeatwave ? wards.filter((w) => w.currentMetrics?.riskLevel === 'SEVERE').length : 0,
        isActualHeatwave,
        severeWardsList: wards.slice(0, 5).map((w) => ({
          code: w.code,
          name: w.name,
          zone: w.zone,
          temp: w.currentMetrics?.tempC || ambientTemp,
          population: w.population,
        })),
        ambientTemp,
        apparentTemp,
        conditionText,
        humidity,
        rainProb,
        tomorrow,
        dailyForecast,
        selectedLocation: selectedLocation?.name || activeRegion.name,
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
        text: '⚠️ Sambandhit jankari prapt karne me asuvidha hui. Kripya punah prayas karein.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      label: 'Kal Mausam Kaisa Hoga?',
      prompt: `Kal ka mausam kaisa hoga ${activeRegion.name} me?`,
    },
    {
      icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
      label: 'Kya Heatwave Ka Khatra Hai?',
      prompt: `Kya ${activeRegion.name} me heatwave ya tez dhoop aayegi?`,
    },
    {
      icon: <Siren className="w-3.5 h-3.5 text-rose-400" />,
      label: 'Emergency Ambulance & Hospital',
      prompt: `Emergency me ambulance aur hospital kahan milega ${activeRegion.name} me?`,
    },
    {
      icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />,
      label: 'Garmi Se Bachne Ke Tips',
      prompt: `Garmi aur dhoop se bachne ke liye kya savdhani bartein?`,
    },
  ];

  return (
    <>
      {/* Interactive Responsive Chat Modal / Drawer */}
      {isAgentChatOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 select-none font-sans">
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-[#181920] shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[90vh] card-highlight-rim">
            {/* Modal Header */}
            <div className="p-4 bg-[#181920] border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Heatwave Safety AI Assistant
                    </h3>
                    <span className="px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      LIVE AGENT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                    {activeRegion.name} • Thermal Safety & Telemetry
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAgentChatOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Close AI Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 bg-[#13141a] overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
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
                        : 'bg-rose-600'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] p-4 rounded-2xl space-y-1.5 ${
                      msg.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-tr-none shadow-lg'
                        : 'bg-[#181920] border border-white/[0.08] text-slate-200 rounded-tl-none shadow-md'
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
                <div className="flex items-center space-x-2.5 text-xs text-rose-300 bg-rose-500/15 p-3.5 rounded-2xl border border-rose-500/25">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                  <span className="font-mono text-xs font-bold">
                    AI Agent is analyzing live telemetry & heatwave data...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips Bar */}
            <div className="p-2.5 border-t border-white/[0.06] bg-[#181920] overflow-x-auto scrollbar-none flex gap-2 shrink-0">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-[#13141a] border border-white/[0.06] hover:border-sky-500/40 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all shrink-0 shadow-sm cursor-pointer"
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
              className="p-3.5 bg-[#181920] border-t border-white/[0.06] flex items-center space-x-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Ask me anything about weather or heat safety..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 bg-[#13141a] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500/60 transition-all font-sans"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition-all shrink-0 shadow-lg shadow-rose-950/60 cursor-pointer active:scale-95"
                title="Send Message to AI Agent"
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
