import React, { useState, useRef, useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
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
  MapPin,
  Flame,
  Siren,
  ShieldAlert,
  Globe,
  Navigation,
  ChevronDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'auto', name: 'Auto-Detect', nativeName: '🌐 Auto', flag: '🌐' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'hinglish', name: 'Hinglish', nativeName: 'Hinglish', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export const getWelcomeMessageForLang = (lang: string) => {
  switch (lang) {
    case 'hi':
      return `नमस्ते! मैं आपका रीयल-टाइम वेदर और हीटवेव सेफ्टी असिस्टेंट हूँ। 🌤️

आप मुझसे किसी भी शहर का लाइव मौसम, दो शहरों की तुलना (जैसे दिल्ली बनाम मुंबई), लू से बचाव, घरेलू ओआरएस (ORS) या बिना एसी घर ठंडा रखने के तरीके पूछ सकते हैं!

जैसे:
• "सोहना का मौसम कैसा है?"
• "दिल्ली और मुंबई में से कौन ज्यादा गर्म है?"
• "लू लगने के लक्षण और प्राथमिक उपचार"
• "घर पर ओआरएस घोल कैसे बनाएं?"
• "बिना एसी के कमरा ठंडा कैसे रखें?"

📍 किसी भी स्थान का मौसम देखने के लिए आप ऊपर या नीचे मैप पर पिन भी लगा सकते हैं!`;
    case 'bn':
      return `নমস্কার! আমি আপনার রিয়েল-টাইম আবহাওয়া ও তাপপ্রবাহ (হিটওয়েভ) সুরক্ষা সহকারী। 🌤️

আপনি আমাকে যে কোনও শহরের লাইভ আবহাওয়া, তাপমাত্রা তুলনা, হিটস্ট্রোক প্রতিরোধ বা ওআরএস তৈরির পদ্ধতি সম্পর্কে জিজ্ঞাসা করতে পারেন!

যেমন:
• "সোহনার আবহাওয়া কেমন?"
• "দিল্লি ও মুম্বাইয়ের মধ্যে কোনটি বেশি গরম?"
• "হিটস্ট্রোকের লক্ষণ ও প্রাথমিক চিকিৎসা"
• "ঘরে কীভাবে ওআরএস তৈরি করবেন?"

📍 যে কোনও স্থানের আবহাওয়া জানতে মানচিত্রে পিন ড্রপ করতে পারেন!`;
    case 'as':
      return `নমস্কাৰ! মই আপোনাৰ ৰিয়েল-টাইম বতৰ আৰু হিটৱেভ সুৰক্ষা এআই সহায়ক। 🌤️

আপুনি মোক যিকোনো ঠাইৰ বতৰ, গৰমৰ পৰা ৰক্ষা পোৱাৰ উপায় বা ঘৰুৱা অ’আৰএছ প্ৰস্তুতকৰণৰ বিষয়ে সুধিব পাৰে!

যেনে:
• "গুৱাহাটীৰ বতৰ কেনেকুৱা?"
• "হিটৱেভৰ লক্ষণ আৰু প্ৰতিৰোধ"
• "ঘৰতে অ’আৰএছ কেনেকৈ প্ৰস্তুত কৰিব?"

📍 মানচিত্ৰত পিন লগাইও বতৰ চাব পাৰিব!`;
    case 'mr':
      return `नमस्कार! मी तुमचा रिअल-टाइम हवामान आणि उष्माघात सुरक्षा सहाय्यक आहे. 🌤️

तुम्ही मला कोणत्याही शहराचे थेट हवामान, शहरांची तुलना, उष्माघाताची लक्षणे किंवा घर थंड ठेवण्याचे उपाय विचारू शकता!

उदा:
• "सोहनाचे हवामान कसे आहे?"
• "उष्माघाताची लक्षणे आणि प्रथमोपचार"
• "घरी ओआरएस द्रावण कसे बनवावे?"

📍 नकाशावर पिन लावूनही थेट हवामान पाहू शकता!`;
    case 'gu':
      return `નમસ્તે! હું તમારો રિયલ-ટાઇમ હવામાન અને હીટવેવ સુરક્ષા સહાયક છું. 🌤️

તમે મને કોઈપણ શહેરનું લાઈવ હવામાન, શહેરોની સરખામણી, લૂ લાગવાના લક્ષણો કે ઓઆરએસ બનાવવાની રીત પૂછી શકો છો!

જેમ કે:
• "સોહનાનું હવામાન કેવું છે?"
• "લૂ લાગવાના લક્ષણો અને ઉપચાર"
• "ઘરે ઓઆરએસ કેવી રીતે બનાવવું?"

📍 નકશા પર પિન લગાવીને પણ હવામાન જોઈ શકો છો!`;
    case 'ta':
      return `வணக்கம்! நான் உங்கள் நிகழ்நேர வானிலை மற்றும் வெப்ப அலை பாதுகாப்பு உதவியாளர். 🌤️

எந்தவொரு நகரத்தின் நேரடி வானிலை, நகரங்களின் ஒப்பீடு, சூரிய வாதம் தடுப்பு அல்லது வீட்டு முதலுதவி பற்றி என்னிடம் கேட்கலாம்!

உதாரணத்திற்கு:
• "வானிலை நிலவரம் எப்படி உள்ளது?"
• "சூரிய வாதத்தின் அறிகுறிகள் மற்றும் முதலுதவி"
• "வீட்டில் ORS கரைசல் தயாரிப்பது எப்படி?"

📍 வரைபடத்தில் இடத்தைத் தேர்ந்தெடுத்தும் அறியலாம்!`;
    case 'te':
      return `నమస్కారం! నేను మీ రియల్-టైమ్ వాతావరణ మరియు వడదెబ్బ రక్షణ సహాయకుడిని. 🌤️

మీరు నన్ను ఏదైనా ప్రదేశం యొక్క ప్రత్యక్ష వాతావరణం, నగరాల పోలిక, వడదెబ్బ నివారణ లేదా ఇంటి ఓఆర్ఎస్ తయారీ గురించి అడగవచ్చు!

ఉదాహరణకు:
• "సోహ్నా ప్రస్తుత వాతావరణం ఎలా ఉంది?"
• "వడదెబ్బ లక్షణాలు మరియు ప్రథమ చికిత్స"
• "ఇంట్లోనే ఓఆర్ఎస్ ద్రావణం ఎలా తయారు చేయాలి?"

📍 మ్యాప్‌లో పిన్ చేసి కూడా వాతావరణాన్ని తనిఖీ చేయవచ్చు!`;
    case 'pa':
      return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਰੀਅਲ-ਟਾਈਮ ਮੌਸਮ ਅਤੇ ਲੂ ਸੁਰੱਖਿਆ ਸਹਾਇਕ ਹਾਂ। 🌤️

ਤੁਸੀਂ ਮੇਰੇ ਤੋਂ ਕਿਸੇ ਵੀ ਸ਼ਹਿਰ ਦਾ ਲਾਈਵ ਮੌਸਮ, ਲੂ ਤੋਂ ਬਚਾਅ ਦੇ ਤਰੀਕੇ ਜਾਂ ਘਰੇਲੂ ਓਆਰਐਸ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ!

ਜਿਵੇਂ:
• "ਸੋਹਨਾ ਦਾ ਮੌਸਮ ਕਿਹੋ ਜਿਹਾ ਹੈ?"
• "ਲੂ ਦੇ ਲੱਛਣ ਅਤੇ ਮੁੱਢਲੀ ਸਹਾਇਤਾ"
• "ਘਰ ਵਿੱਚ ਓਆਰਐਸ ਘੋਲ ਕਿਵੇਂ ਬਣਾਈਏ?"

📍 ਨਕਸ਼ੇ 'ਤੇ ਪਿੰਨ ਲਗਾ ਕੇ ਵੀ ਮੌਸਮ ਵੇਖ ਸਕਦੇ ਹੋ!`;
    case 'en':
      return `Hello! I am your Real-Time Weather & Heatwave Safety AI Assistant. 🌤️

You can ask me about live weather for ANY location, weather comparisons (e.g. Delhi vs Mumbai), heatstroke prevention, ORS recipes, or home cooling without AC!

Examples:
• "What is the weather in Sohna or Paris?"
• "Which is hotter: Delhi or Mumbai?"
• "Heatstroke symptoms and first-aid steps"
• "How to make home-made ORS solution"
• "How to keep rooms cool without AC"

📍 You can also click the Map button to drop a pin anywhere on earth!`;
    default: // 'auto' or 'hinglish'
      return `Namaste! Main aapka Real-Time Weather & Heatwave Safety Assistant hoon. 🌤️

Aap mujhse kisi bhi jagah ka live mausam, Delhi vs Mumbai comparison, heatstroke bachav, ghar par ORS ya bina AC ghar thanda rakhne ke upay pooch sakte hain!

Jaise:
• "Sohna weather kaisa hai?"
• "Delhi vs Mumbai me kaun zyada garm hai?"
• "Heatstroke ke lakshan aur first aid"
• "Ghar par ORS ghol kaise banayein?"
• "Bina AC ke ghar ko thanda kaise rakhein?"

📍 Agar kisi anjaan jagah ka mausam chahiye, toh aap Map par pin bhi laga sakte hain!`;
  }
};

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  hasMapAction?: boolean;
}

const FormattedChatMessage: React.FC<{ text: string }> = ({ text }) => {
  // Parse inline text: replaces **bold** with <strong> and *italic* with <em>
  const renderInlineContent = (line: string) => {
    // Regex matching ***bold-italic***, **bold**, or *italic*
    const regex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g;
    const parts = line.split(regex);

    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
        return (
          <strong key={i} className="font-bold text-white italic tracking-wide">
            {part.slice(3, -3).replace(/\*/g, '')}
          </strong>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-white tracking-wide">
            {part.slice(2, -2).replace(/\*/g, '')}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <span key={i} className="text-sky-300 font-medium">
            {part.slice(1, -1).replace(/\*/g, '')}
          </span>
        );
      }
      // If any stray unmatched asterisks remain, strip them so raw * never shows
      const cleanPart = part.replace(/\*/g, '');
      return <React.Fragment key={i}>{cleanPart}</React.Fragment>;
    });
  };

  const lines = text.split('\n');

  return (
    <div className="space-y-2 leading-relaxed font-sans text-sm sm:text-base select-text">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Convert leading `* ` or `- ` to clean bullet point `• `
        if (trimmed.startsWith('* ')) {
          trimmed = '• ' + trimmed.slice(2);
        } else if (trimmed.startsWith('- ')) {
          trimmed = '• ' + trimmed.slice(2);
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('👉');
        const isHeader =
          trimmed.startsWith('🌤️') ||
          trimmed.startsWith('📍') ||
          trimmed.startsWith('👋') ||
          trimmed.startsWith('☀️') ||
          trimmed.startsWith('🚨') ||
          trimmed.startsWith('🚑') ||
          trimmed.startsWith('💧') ||
          trimmed.startsWith('🛡️') ||
          trimmed.startsWith('💡');

        return (
          <div
            key={idx}
            className={`${
              isHeader
                ? 'font-bold text-white text-base sm:text-lg pb-1 pt-0.5'
                : isBullet
                ? 'pl-2 text-slate-100'
                : 'text-slate-100'
            }`}
          >
            {renderInlineContent(trimmed)}
          </div>
        );
      })}
    </div>
  );
};

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
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState<[number, number]>(activeRegion.coordinates);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('agent_chat_language');
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
      const appLang = localStorage.getItem('app_language');
      if (appLang && SUPPORTED_LANGUAGES.some((l) => l.code === appLang)) {
        return appLang;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'auto';
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
    setIsLangMenuOpen(false);
    try {
      localStorage.setItem('agent_chat_language', code);
    } catch {
      // Ignore localStorage errors
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const googleApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.GOOGLE_MAPS_API_KEY ||
    '';

  const googleRoadmapStyle: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
      'google-roadmap': {
        type: 'raster',
        tiles: [
          `https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
        ],
        tileSize: 256,
        attribution: '&copy; Google Maps',
      },
    },
    layers: [
      {
        id: 'google-roadmap-layer',
        type: 'raster',
        source: 'google-roadmap',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    let initialLang = 'auto';
    try {
      const saved = localStorage.getItem('agent_chat_language');
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        initialLang = saved;
      } else {
        const appLang = localStorage.getItem('app_language');
        if (appLang && SUPPORTED_LANGUAGES.some((l) => l.code === appLang)) {
          initialLang = appLang;
        }
      }

      const savedMsgs = localStorage.getItem('agent_chat_messages');
      if (savedMsgs) {
        const parsed = JSON.parse(savedMsgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return [
      {
        id: `welcome-${initialLang}`,
        sender: 'agent',
        text: getWelcomeMessageForLang(initialLang),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // Persist messages across page reloads
  useEffect(() => {
    try {
      localStorage.setItem('agent_chat_messages', JSON.stringify(messages));
    } catch {
      // Ignore
    }
  }, [messages]);

  const handleResetChat = () => {
    const freshMessage: ChatMessage[] = [
      {
        id: `welcome-${selectedLanguage}-${Date.now()}`,
        sender: 'agent',
        text: getWelcomeMessageForLang(selectedLanguage),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(freshMessage);
    try {
      localStorage.setItem('agent_chat_messages', JSON.stringify(freshMessage));
    } catch {
      // Ignore
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAgentChatOpen) scrollToBottom();
  }, [messages, isAgentChatOpen]);

  // Sync pinned coords when active region changes
  useEffect(() => {
    setPinnedCoords(activeRegion.coordinates);
  }, [activeRegion]);

  // Resize map when fullscreen is toggled
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.resize();
      }, 250);
    }
  }, [isFullscreen]);

  // Update initial welcome message when language changes if user hasn't sent a message yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id.startsWith('welcome-')) {
        return [
          {
            id: `welcome-${selectedLanguage}-${Date.now()}`,
            sender: 'agent',
            text: getWelcomeMessageForLang(selectedLanguage),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [selectedLanguage]);

  // Initialize Map in picker modal
  useEffect(() => {
    if (!isMapPickerOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.resize();
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: googleRoadmapStyle,
      center: pinnedCoords,
      zoom: 11,
    });

    mapInstanceRef.current = map;

    // Create red pin marker
    const pinEl = document.createElement('div');
    pinEl.className = 'w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shadow-2xl animate-bounce';
    pinEl.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>`;

    const marker = new maplibregl.Marker({ element: pinEl, anchor: 'bottom' })
      .setLngLat(pinnedCoords)
      .addTo(map);

    markerRef.current = marker;

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setPinnedCoords(coords);
      if (markerRef.current) {
        markerRef.current.setLngLat(coords);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [isMapPickerOpen]);

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
      // Provide active region context
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

      const ambientTemp = liveWeather?.temperatureC ?? selectedLocation?.ambientTemperature ?? 30;
      const apparentTemp = liveWeather?.apparentTempC ?? ambientTemp + 3;
      const conditionText = liveWeather?.conditionText ?? 'Partly cloudy';
      const humidity = liveWeather?.humidity ?? 68;
      const rainProb = liveWeather?.precipitationProbability ?? 25;
      const dailyForecast = liveWeather?.dailyForecast ?? [];
      const tomorrow = dailyForecast[1] || dailyForecast[0] || null;
      const isActualHeatwave = ambientTemp >= 38;

      const contextData = {
        region: activeRegion.name,
        totalWards: wards.length,
        severeCount: isActualHeatwave ? wards.filter((w) => w.currentMetrics?.riskLevel === 'SEVERE').length : 0,
        isActualHeatwave,
        ambientTemp,
        apparentTemp,
        conditionText,
        humidity,
        rainProb,
        tomorrow,
        dailyForecast,
        selectedLocation: selectedLocation?.name || activeRegion.name,
      };

      // Call AI Agent Service with selected language
      const result = await runLangflowAgent(text.trim(), contextData, selectedLanguage);
      const replyText = typeof result === 'string' ? result : result.reply;
      const hasMap = typeof result === 'object' ? Boolean(result.hasMapAction) : false;

      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasMapAction: hasMap,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'agent',
        text: '⚠️ Mausam ki jankari prapt karne me asuvidha hui. Kripya punah prayas karein.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPinnedLocation = () => {
    setIsMapPickerOpen(false);
    const coordsStr = `📍 Selected Location: ${pinnedCoords[1].toFixed(4)}°N, ${pinnedCoords[0].toFixed(4)}°E`;
    handleSendMessage(coordsStr);
  };

  const getQuickPromptsForLang = (lang: string) => {
    switch (lang) {
      case 'hi':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'सोहना मौसम', prompt: 'सोहना का मौसम कैसा है?' },
          { icon: <Globe className="w-3.5 h-3.5 text-sky-400" />, label: 'दिल्ली vs मुंबई', prompt: 'दिल्ली और मुंबई के तापमान की तुलना करें' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 नक्शे पर चुनें', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'लू के लक्षण व बचाव', prompt: 'लू लगने के लक्षण और प्राथमिक उपचार क्या हैं?' },
          { icon: <Flame className="w-3.5 h-3.5 text-rose-400" />, label: 'घर पर ORS', prompt: 'घर पर ओआरएस (ORS) घोल कैसे बनाएं?' },
          { icon: <Siren className="w-3.5 h-3.5 text-rose-400" />, label: 'बिना AC कमरा ठंडा', prompt: 'बिना एसी के घर को ठंडा कैसे रखें?' },
        ];
      case 'bn':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'সোহনা আবহাওয়া', prompt: 'সোহনার বর্তমান আবহাওয়া কেমন?' },
          { icon: <Globe className="w-3.5 h-3.5 text-sky-400" />, label: 'দিল্লি বনাম মুম্বাই', prompt: 'দিল্লি এবং মুম্বাইয়ের তাপমাত্রার তুলনা করুন' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 মানচিত্রে বাছুন', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'হিটস্ট্রোকের লক্ষণ', prompt: 'হিটস্ট্রোকের লক্ষণ এবং প্রাথমিক চিকিৎসা কী?' },
          { icon: <Flame className="w-3.5 h-3.5 text-rose-400" />, label: 'ঘরে তৈরি ORS', prompt: 'ঘরে কীভাবে ওআরএস (ORS) তৈরি করবেন?' },
        ];
      case 'as':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'গুৱাহাটীৰ বতৰ', prompt: 'গুৱাহাটীৰ বৰ্তমান বতৰ কেনেকুৱা?' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 মানচিত্ৰত বাছক', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'হিটৱেভ প্ৰতিৰোধ', prompt: 'হিটৱেভৰ পৰা বাচিবলৈ কি কৰিব লাগে?' },
          { icon: <Flame className="w-3.5 h-3.5 text-rose-400" />, label: 'ঘৰুৱা ORS', prompt: 'ঘৰতে অ’আৰএছ (ORS) কেনেকৈ প্ৰস্তুত কৰিব?' },
        ];
      case 'mr':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'सोहना हवामान', prompt: 'सोहनाचे हवामान कसे आहे?' },
          { icon: <Globe className="w-3.5 h-3.5 text-sky-400" />, label: 'दिल्ली vs मुंबई', prompt: 'दिल्ली आणि मुंबईच्या तापमानाची तुलना करा' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 नकाशावर निवडा', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'उष्माघात लक्षणे', prompt: 'उष्माघाताची लक्षणे आणि प्रथमोपचार काय आहेत?' },
        ];
      case 'gu':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'સોહના હવામાન', prompt: 'સોહનાનું હવામાન કેવું છે?' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 નકશા પર પસંદ કરો', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'લૂ થી બચવાના ઉપાય', prompt: 'લૂ લાગવાના લક્ષણો અને ઉપાય શું છે?' },
        ];
      case 'ta':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'வானிலை நிலவரம்', prompt: 'சோஹ்னாவின் தற்போதைய வானிலை எப்படி உள்ளது?' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 வரைபடத்தில் தேர்வு', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'சூரிய வாதம் தடுப்பு', prompt: 'சூரிய வாதத்தின் அறிகுறிகள் மற்றும் முதலுதவி என்ன?' },
        ];
      case 'te':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'వాతావరణం', prompt: 'సోహ్నా ప్రస్తుత వాతావరణం ఎలా ఉంది?' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 మ్యాప్‌లో ఎంచుకోండి', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'వడదెబ్బ జాగ్రత్తలు', prompt: 'వడదెబ్బ లక్షణాలు మరియు ప్రథమ చికిత్స ఏమిటి?' },
        ];
      case 'pa':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'ਮੌਸਮ ਦਾ ਹਾਲ', prompt: 'ਸੋਹਨਾ ਦਾ ਮੌਸਮ ਕਿਹੋ ਜਿਹਾ ਹੈ?' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 ਨਕਸ਼ੇ ਤੇ ਚੁਣੋ', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'ਲੂ ਤੋਂ ਬਚਾਅ', prompt: 'ਲੂ ਲੱਗਣ ਦੇ ਲੱਛਣ ਅਤੇ ਮੁੱਢਲੀ ਸਹਾਇਤਾ ਕੀ ਹੈ?' },
        ];
      case 'en':
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'Sohna Weather', prompt: 'What is the current weather in Sohna?' },
          { icon: <Globe className="w-3.5 h-3.5 text-sky-400" />, label: 'Delhi vs Mumbai', prompt: 'Which is hotter: Delhi or Mumbai?' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 Pick on Map', action: () => setIsMapPickerOpen(true) },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'Heatstroke First-Aid', prompt: 'What are heatstroke symptoms and emergency first-aid steps?' },
          { icon: <Flame className="w-3.5 h-3.5 text-rose-400" />, label: 'Home ORS Recipe', prompt: 'How to prepare home-made WHO standard ORS solution?' },
          { icon: <Siren className="w-3.5 h-3.5 text-rose-400" />, label: 'Cool Without AC', prompt: 'How to keep rooms and home cool without air conditioning?' },
        ];
      default: // 'auto' or 'hinglish'
        return [
          { icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, label: 'Sohna Weather', prompt: 'Sohna weather kaisa hai?' },
          { icon: <Globe className="w-3.5 h-3.5 text-sky-400" />, label: 'Delhi vs Mumbai', prompt: 'Delhi vs Mumbai me se kaun zyada garm hai?' },
          { icon: <MapPin className="w-3.5 h-3.5 text-rose-400" />, label: '📍 Pick on Map', action: () => setIsMapPickerOpen(true) },
          { icon: <Flame className="w-3.5 h-3.5 text-rose-400" />, label: 'Kya Heatwave Ka Khatra Hai?', prompt: `Kya ${activeRegion.name} me heatwave ya tez dhoop aayegi?` },
          { icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />, label: 'Heatstroke Symptoms', prompt: 'Heatstroke ke lakshan aur first aid kya hai?' },
          { icon: <Siren className="w-3.5 h-3.5 text-rose-400" />, label: 'Ghar Par ORS', prompt: 'Ghar par ORS ghol kaise banayein?' },
        ];
    }
  };

  const quickPrompts = getQuickPromptsForLang(selectedLanguage);

  const getInputPlaceholder = (lang: string) => {
    switch (lang) {
      case 'hi':
        return 'किसी भी शहर का मौसम या सवाल पूछें (उदा. सोहना मौसम, लू से बचाव)...';
      case 'bn':
        return 'যে কোনও শহরের আবহাওয়া বা প্রশ্ন জিজ্ঞাসা করুন (যেমন সোহনা আবহাওয়া)...';
      case 'as':
        return 'যিকোনো ঠাইৰ বতৰ বা হিটৱেভ সম্পৰ্কে প্ৰশ্ন কৰক...';
      case 'mr':
        return 'कोणत्याही शहराचे हवामान किंवा उष्माघाताविषयी विचारा...';
      case 'gu':
        return 'કોઈપણ શહેરનું હવામાન કે લૂ વિશે પ્રશ્ન પૂછો...';
      case 'ta':
        return 'வானிலை அல்லது வெப்ப அலை பற்றி கேளுங்கள் (எ.கா. சோஹ்னா வானிலை)...';
      case 'te':
        return 'వాతావరణం లేదా వడదెబ్బ గురించి అడగండి...';
      case 'pa':
        return 'ਕਿਸੇ ਵੀ ਸ਼ਹਿਰ ਦਾ ਮੌਸਮ ਜਾਂ ਲੂ ਬਾਰੇ ਪੁੱਛੋ...';
      case 'en':
        return "Ask weather for any location or any question (e.g. 'Sohna weather', 'Delhi vs Mumbai')...";
      default:
        return "Ask weather for any place or any topic (e.g. 'Sohna weather', 'Delhi vs Mumbai')...";
    }
  };

  return (
    <>
      {/* Interactive Responsive Chat Modal / Drawer */}
      {isAgentChatOpen && (
        <div
          className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-150 select-none font-sans ${
            isFullscreen ? 'p-0 sm:p-2.5 md:p-4' : 'p-3 sm:p-4'
          }`}
        >
          <div
            className={`w-full bg-[#08090c] shadow-2xl overflow-hidden flex flex-col card-highlight-rim relative transition-all duration-200 ${
              isFullscreen
                ? 'h-full max-w-none rounded-none sm:rounded-3xl border-0 sm:border sm:border-white/[0.1]'
                : 'max-w-2xl rounded-3xl border border-white/[0.08] h-[640px] max-h-[92vh]'
            }`}
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-[#08090c] border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Real-Time Weather AI Assistant
                    </h3>
                    <span className="px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      LIVE AGENT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                    Global Satellite Telemetry & Thermal Safety
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                {/* Language Switcher Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                    title="Choose Language (भाषा चुनें)"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[11px] max-w-[85px] truncate">
                      {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.nativeName || '🌐 Auto'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isLangMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-[#1c1d27] border border-white/[0.12] shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-xl animate-in fade-in duration-150">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-slate-400 border-b border-white/[0.06] flex items-center justify-between">
                        <span>Select Language</span>
                        <span className="text-sky-400 font-normal">11 languages</span>
                      </div>
                      <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 py-1">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              handleSelectLanguage(lang.code);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-white/[0.08] transition-colors cursor-pointer ${
                              selectedLanguage === lang.code
                                ? 'text-sky-400 font-bold bg-sky-500/10'
                                : 'text-slate-300'
                            }`}
                          >
                            <span className="flex items-center space-x-2">
                              <span>{lang.flag}</span>
                              <span>{lang.nativeName}</span>
                            </span>
                            {selectedLanguage === lang.code && (
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Pick Location on Map"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Map</span>
                </button>

                {/* Reset / New Chat Button */}
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="New Conversation / Clear Chat (नया चैट)"
                  aria-label="New Conversation"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                  aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-slate-300" />
                  )}
                </button>

                <button
                  onClick={() => setIsAgentChatOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Close AI Assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-3.5 sm:p-6 bg-black overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              <div className={`space-y-4 w-full ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 sm:gap-3.5 text-sm sm:text-base ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white shrink-0 shadow-md ${
                      msg.sender === 'user' ? 'bg-sky-600' : 'bg-rose-600'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>

                  <div
                    className={`max-w-[90%] sm:max-w-[85%] p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-2.5 text-sm sm:text-base shadow-md border ${
                      msg.sender === 'user'
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-100 rounded-tr-none'
                        : 'bg-white/[0.05] border-white/[0.08] text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <div className="whitespace-pre-wrap leading-relaxed font-sans text-sm sm:text-base select-text">
                        {msg.text.replace(/\*/g, '')}
                      </div>
                    ) : (
                      <FormattedChatMessage text={msg.text} />
                    )}

                    {/* Interactive Map Location Picker Action Button */}
                    {msg.hasMapAction && (
                      <div className="pt-2 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setIsMapPickerOpen(true)}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer hover:scale-[1.01] active:scale-98"
                        >
                          <MapPin className="w-4.5 h-4.5 text-white animate-bounce shrink-0" />
                          <span>📍 Select Location on Map (Map Par Chunein)</span>
                        </button>
                      </div>
                    )}

                    <span className="text-[11px] sm:text-xs text-slate-400 block text-right font-mono pt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center space-x-3 text-sm sm:text-base text-rose-300 bg-rose-500/15 p-4 rounded-2xl border border-rose-500/25">
                  <RefreshCw className="w-5 h-5 animate-spin text-rose-400 shrink-0" />
                  <span className="font-mono text-sm sm:text-[15px] font-bold">
                    Fetching live satellite observations & geocoding location...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Action Chips Bar */}
            <div className="p-2.5 sm:p-3 border-t border-white/[0.06] bg-[#08090c] overflow-x-auto scrollbar-none shrink-0">
              <div className={`flex gap-2.5 ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => (qp.action ? qp.action() : handleSendMessage(qp.prompt))}
                    disabled={loading}
                    className="px-3.5 py-2 rounded-xl bg-black border border-white/[0.08] hover:border-sky-500/40 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold flex items-center space-x-2 whitespace-nowrap transition-all shrink-0 shadow-sm cursor-pointer hover:bg-white/[0.04]"
                  >
                    {qp.icon}
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3.5 sm:p-4 bg-[#08090c] border-t border-white/[0.06] shrink-0"
            >
              <div className={`flex items-center space-x-3 w-full ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
                <input
                  type="text"
                  placeholder={getInputPlaceholder(selectedLanguage)}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-black border border-white/[0.08] rounded-2xl px-4.5 py-3.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:border-sky-500/60 transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition-all shrink-0 shadow-lg shadow-rose-950/60 cursor-pointer active:scale-95"
                  title="Send Message to AI Agent"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Interactive Map Picker Modal Overlay */}
            {isMapPickerOpen && (
              <div className="absolute inset-0 z-[1050] bg-[#181920]/98 backdrop-blur-xl flex flex-col p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Picker Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
                  <div className="flex items-center space-x-2.5">
                    <Globe className="w-5 h-5 text-sky-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                        Pick Weather Location on Map
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Click anywhere on the map to drop a pin
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Map Container */}
                <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/[0.1] relative shadow-inner min-h-[280px]">
                  <div ref={mapContainerRef} className="w-full h-full" />

                  {/* Coordinates floating indicator badge */}
                  <div className="absolute top-3 left-3 bg-[#181920]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.1] text-xs font-mono text-white shadow-lg pointer-events-none flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>
                      {pinnedCoords[1].toFixed(4)}°N, {pinnedCoords[0].toFixed(4)}°E
                    </span>
                  </div>
                </div>

                {/* Confirm Action Footer */}
                <div className="flex items-center justify-between pt-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPinnedLocation}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-950/60 transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Confirm & Get Live Weather</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AgentChat;
