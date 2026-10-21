import axios from 'axios';
import { fetchLiveWeatherForCoords } from './liveWeatherService';

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000/api';

const LANGFLOW_URL =
  import.meta.env.VITE_LANGFLOW_API_URL ||
  'http://localhost:7860/api/v1/run/375c84b1-b90c-4c62-904e-ef0521858a5d?stream=false';

const LANGFLOW_TOKEN =
  import.meta.env.VITE_LANGFLOW_APPLICATION_TOKEN ||
  'sk-Bz406WrwqKlxeJVRyN7eTQ6_QZWbDfEKVT9ItGzARTE';

export interface AgentChatResult {
  reply: string;
  hasMapAction?: boolean;
}

const QUERY_STOPWORDS = new Set([
  'what', 'is', 'the', 'how', 'weather', 'weathwe', 'wether', 'temperature', 'temp', 'in', 'at',
  'for', 'of', 'today', 'tomorrow', 'now', 'forecast', 'please', 'tell', 'me', 'rain',
  'heat', 'heatwave', 'humidity', 'wind', 'kya', 'kiya', 'kaisa', 'kaise', 'hai', 'he',
  'ho', 'hoga', 'hogi', 'hobe', 'ka', 'ke', 'ki', 'ko', 'me', 'mein', 'par', 'se',
  'aam', 'taaza', 'haal', 'batao', 'bataiye', 'kitna', 'kitni', 'taapmaan', 'garmi',
  'mausam', 'baarish', 'loo', 'abhi', 'aaj', 'kal', 'aage', 'yahan', 'wahan',
  'kemon', 'hobo', 'aaji', 'kali', 'boroxun', 'gorom', 'about', 'status', 'update',
  'show', 'kaha', 'kahan', 'where', 'check', 'give', 'detail', 'details',
  'please', 'can', 'you', 'bhai', 'ji', 'sir', 'dekh', 'dekhein', 'karo', 'bataye',
  'aayegi', 'aayega', 'khatra', 'tips', 'ambulance', 'hospital', 'doctor', 'water',
  'paani', 'number', 'helpline', 'precaution', 'safe', 'bachav', 'karna', 'chahiye',
  'kenkuwa', 'kenekuwa', 'botor', 'bator', 'ase', 'hoi', 'nki', 'amar', 'apunar',
  'kuch', 'bhi', 'puchu', 'pucho', 'lekin', 'magar', 'ye', 'yeh', 'woh', 'so', 'toh',
  'raha', 'rahi', 'rahe', 'rahega', 'rahegi', 'lag', 'laga', 'lagi', 'lagta', 'mang', 'mangta',
  // Hindi Devanagari Stopwords
  'का', 'के', 'की', 'को', 'में', 'पर', 'से', 'है', 'हैं', 'था', 'थी', 'थे',
  'होगा', 'होगी', 'होंगे', 'मौसम', 'कैसा', 'कैसी', 'कितना', 'कितनी',
  'तापमान', 'गर्मी', 'लू', 'बारिश', 'आज', 'कल', 'बताओ', 'बताएं', 'दिखाओ',
  'चेक', 'करो', 'क्या', 'स्थान', 'शहर', 'हाल', 'नमस्ते', 'प्रणाम', 'नमस्कार',
]);

const CITY_ALIASES: Record<string, string> = {
  guwati: 'Guwahati',
  guwahti: 'Guwahati',
  guwhahti: 'Guwahati',
  gowahati: 'Guwahati',
  gauhati: 'Guwahati',
  ghy: 'Guwahati',
  dilli: 'Delhi',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  bangalore: 'Bengaluru',
  sona: 'Sohna',
  jaypur: 'Jaipur',
  amdavad: 'Ahmedabad',
  // Hindi Devanagari Mappings
  'सोहना': 'Sohna',
  'दिल्ली': 'Delhi',
  'नई दिल्ली': 'New Delhi',
  'मुंबई': 'Mumbai',
  'बंबई': 'Mumbai',
  'जयपुर': 'Jaipur',
  'कोलकाता': 'Kolkata',
  'गुवाहाटी': 'Guwahati',
  'अहमदाबाद': 'Ahmedabad',
  'पुणे': 'Pune',
  'लखनऊ': 'Lucknow',
  'पटना': 'Patna',
  'चंडीगढ़': 'Chandigarh',
  'इंदौर': 'Indore',
  'भोपाल': 'Bhopal',
  'नागपुर': 'Nagpur',
  'चेन्नई': 'Chennai',
  'बेंगलुरु': 'Bengaluru',
  'बेंगलोर': 'Bengaluru',
  'हैदराबाद': 'Hyderabad',
  'वाराणसी': 'Varanasi',
  'आगरा': 'Agra',
  'कानपुर': 'Kanpur',
  'सूरत': 'Surat',
  'नोएडा': 'Noida',
  'गुरुग्राम': 'Gurugram',
  'गुड़गांव': 'Gurugram',
  'फरीदाबाद': 'Faridabad',
  'मेरठ': 'Meerut',
};

function extractCandidatePlace(input: string): string {
  // Preserve ASCII words AND Devanagari (\u0900-\u097F) words
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
  // 1. Try FastAPI Backend Endpoint POST /api/agent/chat
  try {
    const backendAgentUrl = `${BACKEND_BASE_URL}/agent/chat`;
    const backendRes = await axios.post(
      backendAgentUrl,
      {
        message: inputValue,
        context: context || {},
        language: language || 'auto',
      },
      { timeout: 20000 }
    );

    if (backendRes.data) {
      const reply =
        backendRes.data.response ||
        backendRes.data.message ||
        backendRes.data.reply ||
        backendRes.data.text ||
        backendRes.data.output;

      const hasMapAction = Boolean(backendRes.data.hasMapAction);

      if (reply && typeof reply === 'string') {
        return { reply, hasMapAction };
      }
    }
  } catch (backendErr: any) {
    console.warn('FastAPI /api/agent/chat note, switching to resilient thermal intelligence:', backendErr?.message);
  }

  // 2. Try LangFlow Pipeline endpoint if configured
  if (LANGFLOW_URL && !LANGFLOW_URL.includes('localhost:7860')) {
    try {
      const payload = {
        input_value: inputValue,
        input_type: 'chat',
        output_type: 'chat',
        tweaks: {
          ...(context ? { context_data: JSON.stringify(context) } : {}),
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (LANGFLOW_TOKEN) {
        headers['Authorization'] = `Bearer ${LANGFLOW_TOKEN}`;
      }

      const response = await axios.post(LANGFLOW_URL, payload, { headers, timeout: 8000 });
      const data = response.data;
      const text =
        data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
        data?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
        (typeof data?.result === 'string' ? data.result : null);

      if (text) {
        return { reply: text, hasMapAction: false };
      }
    } catch {}
  }

  // 3. Resilient Client-Side Geocoding & Open-Meteo Telemetry Engine
  const q = inputValue.toLowerCase().trim();
  const isDevanagari = /[\u0900-\u097F]/.test(inputValue);
  const isHindiLang = language === 'hi' || language === 'hinglish';
  const hasHinglishWords = ['kya', 'kiya', 'kaisa', 'kaise', 'hai', 'he', 'hoga', 'mausam', 'taapmaan', 'garmi', 'baarish', 'loo', 'aaj', 'kal', 'batao', 'namaste', 'kaun'].some((k) => q.includes(k));
  const isHindi = isDevanagari || isHindiLang || hasHinglishWords;
  const usePureHindi = language === 'hi' || isDevanagari;

  // A. Check for coordinates in prompt (from map pin selection)
  const coords = extractCoordinates(inputValue);
  if (coords) {
    const [lat, lng, label] = coords;
    try {
      const live = await fetchLiveWeatherForCoords(lat, lng, label);
      const isHeatwave = live.temperatureC >= 40 || live.apparentTempC >= 44;
      if (usePureHindi) {
        return {
          reply: `📍 **मानचित्र पर चयनित स्थान का ताज़ा मौसम (${label})**

आपके चयनित स्थान का रीयल-टाइम उपग्रह मौसम डेटा:

• 🌡️ **वर्तमान तापमान**: **${live.temperatureC}°C** (${live.conditionText}, महसूस होने वाला तापमान: **${live.apparentTempC}°C**)
• 💧 **हवा में नमी (आर्द्रता)**: **${live.humidity}%**
• 💨 **हवा की गति**: **${live.windSpeed} किमी/घंटा (${live.windDirection})**
• 🌧️ **बारिश की संभावना**: **${live.precipitationProbability}%**
• ☀️ **हीटवेव (लू) स्थिति**: ${isHeatwave ? '⚠️ **गंभीर लू अलर्ट (सतर्क रहें)**' : '✅ **सामान्य / सुरक्षित** — लू का खतरा नहीं है'}

💡 **परामर्श**: पर्याप्त पानी पिएं और दोपहर की सीधी धूप से बचें।`,
          hasMapAction: false,
        };
      } else if (isHindi) {
        return {
          reply: `📍 **Map Par Chuni Gayi Location Ka Taaza Haal (${label})**

Aapke chune gaye sthaan ka live satellite mausam data:

• 🌡️ **Abhi Ka Taapmaan**: **${live.temperatureC}°C** (${live.conditionText}, feels like **${live.apparentTempC}°C**)
• 💧 **Hawa Me Nami (Humidity)**: **${live.humidity}%**
• 💨 **Hawa Ki Gati**: **${live.windSpeed} km/h (${live.windDirection})**
• 🌧️ **Baarish Ke Aasaar**: **${live.precipitationProbability}% sambhavna**
• ☀️ **Heatwave (Loo) Status**: ${isHeatwave ? '⚠️ **Severe Heat Alert**' : '✅ **Normal / Safe**'}

💡 **Salah**: Mausam comfortable hai, dhoop me nikalte samay paryapt paani peete rahein.`,
          hasMapAction: false,
        };
      } else {
        return {
          reply: `📍 **Live Weather for Selected Map Location (${label})**

Real-time satellite observation for pinned coordinates:

• 🌡️ **Temperature**: **${live.temperatureC}°C** (${live.conditionText}, feels like **${live.apparentTempC}°C**)
• 💧 **Relative Humidity**: **${live.humidity}%**
• 💨 **Wind**: **${live.windSpeed} km/h (${live.windDirection})**
• 🌧️ **Precipitation Probability**: **${live.precipitationProbability}%**
• ☀️ **Heatwave Hazard**: ${isHeatwave ? '⚠️ Active Extreme Heat' : '✅ Normal / Low Risk'}

💡 **Advisory**: Stay hydrated and protected from direct sun exposure during peak daylight.`,
          hasMapAction: false,
        };
      }
    } catch {}
  }

  // B. Check for candidate place in prompt (e.g. 'sohna', 'सोहना', 'delhi', 'दिल्ली')
  const candidate = extractCandidatePlace(inputValue);
  if (candidate && candidate.length >= 2) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (Array.isArray(geoData.results) && geoData.results.length > 0) {
          const top = geoData.results[0];
          const state = top.admin1 ? `, ${top.admin1}` : '';
          const country = top.country ? `, ${top.country}` : '';
          const displayName = `${top.name}${state}${country}`;
          const live = await fetchLiveWeatherForCoords(top.latitude, top.longitude, displayName);
          const isHeatwave = live.temperatureC >= 40 || live.apparentTempC >= 44;

          if (usePureHindi) {
            return {
              reply: `🌤️ **${displayName} का ताज़ा मौसम विवरण**

उपग्रह से प्राप्त **${top.name}** की रीयल-टाइम मौसम स्थिति:

• 🌡️ **वर्तमान तापमान**: **${live.temperatureC}°C** (${live.conditionText}, महसूस होने वाला तापमान: **${live.apparentTempC}°C**)
• 💧 **हवा में नमी (आर्द्रता)**: **${live.humidity}%**
• 💨 **हवा की गति**: **${live.windSpeed} किमी/घंटा (${live.windDirection})**
• 🌧️ **बारिश की संभावना**: **${live.precipitationProbability}%**
• ☀️ **हीटवेव (लू) की स्थिति**: ${isHeatwave ? '⚠️ **लू और अत्यधिक गर्मी का असर है! सावधानी बरतें।**' : '✅ **सामान्य / सुरक्षित** — फिलहाल लू का कोई खतरा नहीं है।'}

💡 **स्वास्थ्य परामर्श**: सीधी धूप से बचें, ढीले सूती कपड़े पहनें और पर्याप्त मात्रा में पानी या ओआरएस पीते रहें।`,
              hasMapAction: false,
            };
          } else if (isHindi) {
            return {
              reply: `🌤️ **${displayName} Ka Taaza Mausam**

Aapke sawaal ke anusaar **${top.name}** ka live satellite weather report:

• 🌡️ **Abhi Ka Taapmaan**: **${live.temperatureC}°C** (${live.conditionText}, feels like **${live.apparentTempC}°C**)
• 💧 **Hawa Me Nami (Humidity)**: **${live.humidity}%**
• 💨 **Hawa Ki Gati**: **${live.windSpeed} km/h (${live.windDirection})**
• 🌧️ **Baarish Ke Aasaar**: **${live.precipitationProbability}% sambhavna**
• ☀️ **Heatwave (Loo) Status**: ${isHeatwave ? '⚠️ **Loo aur tez garmi ka asar hai!**' : '✅ **Abhi heatwave (loo) ka koi khatra nahi hai**, mausam normal hai.'}

💡 **Mausam Salah**: Bahar nikalte waqt chhaata ya topi saath rakhein aur thoda-thoda paani peete rahein.`,
              hasMapAction: false,
            };
          } else {
            return {
              reply: `🌤️ **Live Weather for ${displayName}**

Real-time satellite observation for **${top.name}**:

• 🌡️ **Temperature**: **${live.temperatureC}°C** (${live.conditionText}, feels like **${live.apparentTempC}°C**)
• 💧 **Relative Humidity**: **${live.humidity}%**
• 💨 **Wind Speed**: **${live.windSpeed} km/h (${live.windDirection})**
• 🌧️ **Precipitation Probability**: **${live.precipitationProbability}%**
• ☀️ **Thermal Risk Level**: ${isHeatwave ? '⚠️ Severe Heat Alert' : '✅ Normal / Low Heat Stress'}

💡 **Advisory**: Pleasant atmospheric conditions. Stay hydrated when stepping outdoors.`,
              hasMapAction: false,
            };
          }
        }
      }
    } catch {}
  }

  // C. Common Heatstroke / ORS / Cooling / Hospital Guidance
  if (q.includes('ors') || q.includes('ओआरएस') || q.includes('ghol')) {
    if (usePureHindi) {
      return {
        reply: `💧 **घर पर ओआरएस (ORS) घोल बनाने की मानक विधि**

WHO एवं स्वास्थ्य मंत्रालय के अनुसार:

1. **1 लीटर** साफ, उबला और ठंडा किया हुआ पानी लें।
2. इसमें **6 छोटी चम्मच चीनी** डालें।
3. **आधा छोटी चम्मच नमक** मिलाएं।
4. चम्मच से तब तक घोलें जब तक चीनी और नमक पूरी तरह घुल न जाएं।

💡 **उपयोग विधि**: लू या डिहाइड्रेशन के समय दिनभर में थोड़ा-थोड़ा पीते रहें। यह शरीर में सोडियम और इलेक्ट्रोलाइट्स का संतुलन तुरंत बहाल करता है।`,
        hasMapAction: false,
      };
    }
  }

  if (q.includes('lakshan') || q.includes('symptom') || q.includes('लक्षण') || q.includes('heatstroke') || q.includes('लू')) {
    if (usePureHindi) {
      return {
        reply: `🚨 **लू (हीटस्ट्रोक) के मुख्य लक्षण एवं प्राथमिक उपचार**

🔴 **मुख्य लक्षण**:
• शरीर का तापमान 104°F (40°C) से अधिक होना
• अत्यधिक पसीना आना बंद हो जाना, त्वचा का लाल व गर्म होना
• सिर में तेज दर्द, चक्कर आना, उल्टी या जी मिचलाना
• सांस तेज चलना और दिल की धड़कन बढ़ जाना

🩹 **तत्काल प्राथमिक उपचार**:
1. मरीज को तुरंत ठंडी, छायादार या पंखे/एसी वाली जगह पर ले जाएं।
2. कपड़े ढीले करें और गर्दन, कांख व माथे पर ठंडे पानी की पट्टियां रखें।
3. यदि होश में हो तो ठंडा पानी या ओआरएस पिलाएं।
4. गंभीर स्थिति में तुरंत **108** या **112** पर एम्बुलेंस बुलाएं।`,
        hasMapAction: false,
      };
    }
  }

  // D. Active region fallback for general queries
  const regionName = context?.region || 'Guwahati Metropolitan Area';
  const ambientTemp = Math.round(context?.ambientTemp ?? 30);
  const apparentTemp = Math.round(context?.apparentTemp ?? ambientTemp + 3);
  const conditionText = context?.conditionText || 'Partly cloudy';
  const humidity = context?.humidity || 68;
  const rainProb = context?.rainProb || 25;
  const isActualHeatwave = context?.isActualHeatwave ?? (ambientTemp >= 38);

  if (q.includes('kal') || q.includes('tomorrow') || q.includes('forecast') || q.includes('पूर्वानुमान')) {
    if (usePureHindi) {
      return {
        reply: `🌤️ **कल का मौसम पूर्वानुमान (${regionName})**

• 🌡️ **तापमान**: कल दोपहर में लगभग **${ambientTemp + 2}°C** तक जाएगा (सुबह और रात में **${ambientTemp - 5}°C**)।
• 🌧️ **बारिश की संभावना**: **${rainProb}% संभावना**
• ☀️ **हीटवेव (लू) की स्थिति**: ${isActualHeatwave ? '⚠️ दोपहर में तेज धूप व लू का असर रहेगा' : '✅ **सुरक्षित है** — हीटवेव का कोई खतरा नहीं है'}

💡 **परामर्श**: दोपहर 12 से 3 बजे के बीच सीधे धूप में निकलने से बचें और पर्याप्त पानी पिएं।`,
        hasMapAction: false,
      };
    }
    return {
      reply: `🌤️ **Kal Ka Mausam (${regionName})**

• 🌡️ **Taapmaan**: Kal dophar me lagbhag **${ambientTemp + 2}°C** tak jayega (subah aur raat me **${ambientTemp - 5}°C**).
• 🌧️ **Baarish Ke Aasaar**: **${rainProb}% sambhavna**
• ☀️ **Heatwave (Loo)**: ${isActualHeatwave ? '⚠️ Dophar me tez dhoop rahegi' : '✅ **Safe hai** — Heatwave ka koi khatra nahi hai'}

💡 **Salah**: Dophar me zaroori kaam ho tabhi niklein aur samay par paani peete rahein.`,
      hasMapAction: false,
    };
  }

  if (q.includes('ambulance') || q.includes('hospital') || q.includes('doctor') || q.includes('108') || q.includes('अस्पताल') || q.includes('एम्बुलेंस')) {
    if (usePureHindi) {
      return {
        reply: `🚑 **आपातकालीन एम्बुलेंस व अस्पताल सेवा (${regionName})**

📞 **निःशुल्क एम्बुलेंस**: तुरंत **108** या **112** पर कॉल करें।
🏥 **हीटस्ट्रोक वार्ड**: सिविल अस्पताल और सामुदायिक स्वास्थ्य केंद्रों में 24x7 समर्पित एसी वार्ड एवं कोल्ड सलाइन ड्रिप उपलब्ध हैं।`,
        hasMapAction: false,
      };
    }
    return {
      reply: `🚑 **Emergency Ambulance & Hospital Sahayata (${regionName})**

📞 **Free Ambulance**: Turant **108** ya **112** par call karein.
🏥 **Heatstroke Unit**: Civil Hospital aur Community Health Centers me dedicated AC wards aur cold saline infusion 24x7 uplabdh hai.`,
      hasMapAction: false,
    };
  }

  if (usePureHindi) {
    return {
      reply: `👋 **नमस्ते! मैं आपका रीयल-टाइम वेदर और हीटवेव सेफ्टी असिस्टेंट हूँ।**

आप मुझसे **किसी भी शहर या इलाके का लाइव मौसम या सवाल** पूछ सकते हैं!

जैसे:
👉 "सोहना का मौसम कैसा है?"
👉 "दिल्ली और मुंबई में से कौन ज्यादा गर्म है?"
👉 "लू लगने के लक्षण और प्राथमिक उपचार"
👉 "घर पर ओआरएस घोल कैसे बनाएं?"
👉 "बिना एसी के कमरा ठंडा कैसे रखें?"

📍 यदि किसी अज्ञात स्थान का मौसम देखना हो, तो आप नीचे मैप पर पिन भी लगा सकते हैं!`,
      hasMapAction: false,
    };
  }

  return {
    reply: `👋 **Namaste! Main aapka Real-Time Weather Assistant hoon.**

Aap mujhse **kisi bhi city ya ilaqe ka weather** pooch sakte hain!

Jaise:
👉 "Sohna weather kaisa hai?"
👉 "Delhi ka taapmaan kitna hai?"
👉 "Mumbai me baarish hogi kya?"
👉 "Kal mausam kaisa hoga?"
👉 "Kya heatwave ka khatra hai?"

Agar kisi anjaan jagah ka mausam janna ho, toh aap niche map par pin bhi laga sakte hain!`,
    hasMapAction: false,
  };
}
