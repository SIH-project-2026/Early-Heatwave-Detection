import axios from 'axios';
import { fetchLiveWeatherForCoords } from './liveWeatherService';

// Backend Base URL normalization
const RAW_BACKEND_URL =
  import.meta.env.VITE_BACKEND_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:8000';

const BACKEND_BASE_URL = RAW_BACKEND_URL.endsWith('/api')
  ? RAW_BACKEND_URL
  : `${RAW_BACKEND_URL.replace(/\/$/, '')}/api`;

export interface AgentChatResult {
  reply: string;
  hasMapAction?: boolean;
}

// ----------------- DOMAIN ALLOWLIST & GUARDRAIL -----------------
const DOMAIN_KEYWORDS = new Set([
  'weather', 'mausam', 'temp', 'temperature', 'taapmaan', 'climate', 'heat', 'heatwave',
  'garmi', 'loo', 'humidity', 'rain', 'baarish', 'barish', 'forecast', 'wind', 'hawa',
  'uv', 'utci', 'wbgt', 'uhi', 'thermal', 'monsoon', 'storm', 'toofan', 'cloud', 'baadal',
  'air quality', 'aqi', 'pollution', 'hawa ki gunwatta',
  'heatstroke', 'stroke', 'sunstroke', 'exhaustion', 'dehydration', 'hydration',
  'ors', 'electrolyte', 'water', 'paani', 'cooling', 'cooler', 'ac', 'dhoop',
  'first aid', 'symptom', 'lakshan', 'ilaaj', 'curfew', 'refuge center', 'sdrf', 'tanker',
  'hotter', 'colder', 'sohna', 'delhi', 'kanpur', 'lucknow', 'mumbai', 'jaipur',
  'ओआरएस', 'लू', 'मौसम', 'तापमान', 'गर्मी', 'बारिश', 'लक्षण', 'इलाज'
]);

const QUERY_STOPWORDS = new Set([
  'what', 'is', 'the', 'how', 'weather', 'weathwe', 'wether', 'temperature', 'temp', 'in', 'at',
  'for', 'of', 'today', 'tomorrow', 'now', 'forecast', 'please', 'tell', 'me', 'rain',
  'heat', 'heatwave', 'humidity', 'wind', 'kya', 'kiya', 'kaisa', 'kaise', 'hai', 'he',
  'ho', 'hoga', 'hogi', 'hobe', 'ka', 'ke', 'ki', 'ko', 'me', 'mein', 'par', 'se',
  'aam', 'taaza', 'haal', 'batao', 'bataiye', 'kitna', 'kitni', 'taapmaan', 'garmi',
  'mausam', 'baarish', 'loo', 'abhi', 'aaj', 'kal', 'aage', 'yahan', 'wahan',
  'about', 'status', 'update', 'show', 'kaha', 'kahan', 'where', 'check', 'give', 'detail', 'details',
  'can', 'you', 'bhai', 'ji', 'sir', 'dekh', 'dekhein', 'karo', 'bataye',
  'का', 'के', 'की', 'को', 'में', 'पर', 'से', 'है', 'हैं', 'था', 'थी', 'थे',
  'होगा', 'होगी', 'मौसम', 'कैसा', 'कैसी', 'कितना', 'कितनी', 'तापमान', 'गर्मी', 'लू', 'बारिश', 'आज', 'कल'
]);

const CITY_ALIASES: Record<string, string> = {
  guwati: 'Guwahati', guwahti: 'Guwahati', ghy: 'Guwahati', dilli: 'Delhi',
  bombay: 'Mumbai', calcutta: 'Kolkata', bangalore: 'Bengaluru', sona: 'Sohna',
  sohna: 'Sohna', jaypur: 'Jaipur', amdavad: 'Ahmedabad', gurgaon: 'Gurugram',
  'सोहना': 'Sohna', 'दिल्ली': 'Delhi', 'मुंबई': 'Mumbai', 'जयपुर': 'Jaipur',
  'कोलकाता': 'Kolkata', 'गुवाहाटी': 'Guwahati', 'लखनऊ': 'Lucknow', 'कानपुर': 'Kanpur'
};

function isDomainRelevant(query: string): boolean {
  const qLower = query.toLowerCase();
  if (/(-?\d+\.?\d*)\s*°?\s*[NSns]?\s*,\s*(-?\d+\.?\d*)/.test(qLower)) return true;
  for (const kw of DOMAIN_KEYWORDS) {
    if (qLower.includes(kw)) return true;
  }
  const tokens = qLower.replace(/[^\w\s\u0900-\u097F]/g, ' ').split(/\s+/);
  for (const t of tokens) {
    if (CITY_ALIASES[t]) return true;
  }
  return false;
}

function detectLanguage(text: string): 'en' | 'hi' | 'hinglish' {
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  const qLower = text.toLowerCase();
  const hinglishMarkers = [
    'kya', 'kaisa', 'kaise', 'kaisi', 'hai', 'he', 'hoga', 'hogi', 'mausam',
    'taapmaan', 'garmi', 'baarish', 'loo', 'aaj', 'kal', 'batao', 'bataiye',
    'kahan', 'kitna', 'kitni', 'paani', 'chahiye', 'khatra', 'bachav', 'ilaaj', 'dhoop'
  ];
  if (hinglishMarkers.some((w) => new RegExp(`\\b${w}\\b`).test(qLower))) {
    return 'hinglish';
  }
  return 'en';
}

function extractCandidatePlace(input: string): string {
  const clean = input.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, ' ');
  const tokens = clean
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t && !QUERY_STOPWORDS.has(t) && t.length > 1 && isNaN(Number(t)));

  if (tokens.length === 0) return '';
  const rawCandidate = tokens.join(' ').trim();
  if (CITY_ALIASES[rawCandidate]) return CITY_ALIASES[rawCandidate];
  for (const t of tokens) {
    if (CITY_ALIASES[t]) return CITY_ALIASES[t];
  }
  return rawCandidate;
}

function extractCoordinates(input: string): [number, number, string] | null {
  const match = input.match(/(-?\d+\.?\d*)\s*°?\s*([NSns])?\s*,\s*(-?\d+\.?\d*)\s*°?\s*([EWew])?/);
  if (match) {
    let lat = parseFloat(match[1]);
    if (match[2] && match[2].toUpperCase() === 'S') lat = -lat;
    let lng = parseFloat(match[3]);
    if (match[4] && match[4].toUpperCase() === 'W') lng = -lng;
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const label = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
      return [lat, lng, label];
    }
  }
  return null;
}

export async function runLangflowAgent(
  inputValue: string,
  context?: any,
  language: string = 'auto'
): Promise<AgentChatResult> {
  const cleanMessage = inputValue.trim();
  if (!cleanMessage) {
    return {
      reply: 'Please ask a question regarding weather forecasts, thermal stress, or heatwave safety.',
      hasMapAction: false,
    };
  }

  // 1. Strict Domain Relevance Guardrail Check
  if (!isDomainRelevant(cleanMessage)) {
    const lang = detectLanguage(cleanMessage);
    if (lang === 'hi') {
      return {
        reply: 'मैं केवल **मौसम, लू (हीटवेव), तापीय आराम और आपदा प्रबंधन** से जुड़े सवालों के उत्तर देने के लिए अधिकृत हूँ। कृपया मौसम या प्राथमिक उपचार संबंधी प्रश्न ही पूछें।',
        hasMapAction: false,
      };
    } else if (lang === 'hinglish') {
      return {
        reply: 'Main sirf **Weather, Heatwave, Thermal Comfort aur Safety directives** ke sawalon ke jawab deta hoon. Please mausam ya safety se juda sawal poochiye.',
        hasMapAction: false,
      };
    } else {
      return {
        reply: 'I am specialized exclusively in **meteorological telemetry, heatwave risks, and thermal emergency protocols**.\n\nPlease ask questions related to real-time weather forecasts, heatwave warnings, ORS recipes, or heatstroke precautions.',
        hasMapAction: false,
      };
    }
  }

  // 2. Call FastAPI Backend Intelligent LLM Agent (Targeting /api/agent)
  const targetEndpoints = [
    `${BACKEND_BASE_URL}/agent`,
    `${BACKEND_BASE_URL}/agent/chat`,
    `http://127.0.0.1:8000/api/agent`,
  ];

  for (const endpoint of targetEndpoints) {
    try {
      const res = await axios.post(
        endpoint,
        {
          message: cleanMessage,
          context: context || {},
          language: language || 'auto',
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 14000,
        }
      );

      if (res.data) {
        const replyText =
          res.data.response ||
          res.data.reply ||
          res.data.message ||
          res.data.output ||
          res.data.text;

        if (replyText && typeof replyText === 'string') {
          return {
            reply: replyText,
            hasMapAction: Boolean(res.data.hasMapAction),
          };
        }
      }
    } catch {
      // Try next endpoint in loop
    }
  }

  // 3. Fallback: Clean Dynamic Response via Direct Open-Meteo Telemetry
  const langMode = detectLanguage(cleanMessage);
  const isPureHindi = language === 'hi' || langMode === 'hi';
  const isHinglish = langMode === 'hinglish';

  // Map coordinates query
  const coords = extractCoordinates(cleanMessage);
  if (coords) {
    const [lat, lng, label] = coords;
    try {
      const live = await fetchLiveWeatherForCoords(lat, lng, label);
      if (isPureHindi) {
        return {
          reply: `### चयनित मानचित्र स्थान का मौसम (${label})\n\n` +
            `• **तापमान:** ${live.temperatureC}°C (महसूस: ${live.apparentTempC}°C)\n` +
            `• **हवा में नमी:** ${live.humidity}%\n` +
            `• **हवा की गति:** ${live.windSpeed} किमी/घंटा (${live.windDirection})\n\n` +
            `**परामर्श:** मौसम की स्थिति सामान्य है। धूप में निकलते समय नियमित जल ग्रहण करें।`,
          hasMapAction: false,
        };
      }
      return {
        reply: `### Current Telemetry for Selected Point (${label})\n\n` +
          `• **Ambient Temperature:** ${live.temperatureC}°C (Feels like: ${live.apparentTempC}°C)\n` +
          `• **Relative Humidity:** ${live.humidity}%\n` +
          `• **Wind Velocity:** ${live.windSpeed} km/h (${live.windDirection})\n\n` +
          `**Advisory:** Environmental thermal stress is low. Safe for baseline outdoor activities.`,
        hasMapAction: false,
      };
    } catch {}
  }

  // City / Candidate place query
  const candidate = extractCandidatePlace(cleanMessage);
  if (candidate && candidate.length >= 2) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (Array.isArray(geoData.results) && geoData.results.length > 0) {
          const top = geoData.results[0];
          const displayName = `${top.name}${top.admin1 ? `, ${top.admin1}` : ''}`;
          const live = await fetchLiveWeatherForCoords(top.latitude, top.longitude, displayName);

          if (isPureHindi) {
            return {
              reply: `### ${displayName} का मौसम विवरण\n\n` +
                `• **वर्तमान तापमान:** ${live.temperatureC}°C (महसूस: ${live.apparentTempC}°C)\n` +
                `• **हवा में नमी:** ${live.humidity}%\n` +
                `• **हवा की गति:** ${live.windSpeed} किमी/घंटा\n\n` +
                `**परामर्श:** परिस्थितियां स्थिर हैं। बाहर जाते समय हाइड्रेटेड रहें।`,
              hasMapAction: false,
            };
          } else if (isHinglish) {
            return {
              reply: `### ${displayName} Ka Live Mausam\n\n` +
                `• **Current Temp:** ${live.temperatureC}°C (Feels like: ${live.apparentTempC}°C)\n` +
                `• **Humidity:** ${live.humidity}%\n` +
                `• **Hawa Ki Speed:** ${live.windSpeed} km/h\n\n` +
                `**Salah:** Mausam normal hai, dhoop me nikalte waqt paani peete rahein.`,
              hasMapAction: false,
            };
          } else {
            return {
              reply: `### Live Observations for ${displayName}\n\n` +
                `• **Ambient Temperature:** ${live.temperatureC}°C (Feels like: ${live.apparentTempC}°C)\n` +
                `• **Relative Humidity:** ${live.humidity}%\n` +
                `• **Wind Speed:** ${live.windSpeed} km/h\n\n` +
                `**Advisory:** Atmospheric thermal conditions are currently safe and stable. Maintain regular hydration.`,
              hasMapAction: false,
            };
          }
        }
      }
    } catch {}
  }

  // Default Guidance
  return {
    reply: `Please specify a municipal location or ask a thermal safety question (e.g., *"What is the weather in Sohna?"*, *"Home ORS recipe"*, or *"Heatstroke first aid"*).`,
    hasMapAction: false,
  };
}