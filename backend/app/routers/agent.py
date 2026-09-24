import os
import re
import json
import httpx
from typing import Optional, Any, Dict, Tuple, List
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

load_dotenv()

router = APIRouter(prefix="/api/agent", tags=["AI Agent"])

LANGFLOW_API_URL = os.getenv("LANGFLOW_API_URL")
LANGFLOW_TOKEN = os.getenv("LANGFLOW_APPLICATION_TOKEN")

# Optional LLM Provider Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")

class UserQuery(BaseModel):
    message: str
    context: Optional[Any] = None
    language: Optional[str] = "auto"

# Comprehensive stopwords across languages
QUERY_STOPWORDS = {
    'what', 'is', 'the', 'how', 'weather', 'weathwe', 'wether', 'temperature', 'temp', 'in', 'at',
    'for', 'of', 'today', 'tomorrow', 'now', 'forecast', 'please', 'tell', 'me', 'rain',
    'heat', 'heatwave', 'humidity', 'wind', 'kya', 'kiya', 'kaisa', 'kaise', 'kaisi', 'hai', 'he',
    'ho', 'hoga', 'hogi', 'hobe', 'ka', 'ke', 'ki', 'ko', 'me', 'mein', 'par', 'se',
    'aam', 'taaza', 'haal', 'batao', 'bataiye', 'kitna', 'kitni', 'kitne', 'taapmaan', 'garmi',
    'mausam', 'baarish', 'loo', 'abhi', 'aaj', 'kal', 'aage', 'yahan', 'wahan',
    'kemon', 'hobo', 'aaji', 'kali', 'boroxun', 'gorom', 'about', 'status', 'update',
    'show', 'kaha', 'kahan', 'where', 'check', 'give', 'detail', 'details',
    'please', 'can', 'you', 'bhai', 'ji', 'sir', 'dekh', 'dekhein', 'karo', 'bataye',
    'aayegi', 'aayega', 'khatra', 'tips', 'water', 'paani',
    'difference', 'between', 'vs', 'versus', 'compare', 'and', 'aur', 'ya',
    # Assamese question words and particles
    'kenkuwa', 'kenekuwa', 'botor', 'bator', 'boroshun', 'ase', 'hoi', 'nki', 'amar', 'apunar',
    'kio', 'ketiya', 'khobor', 'koba', 'kobo', 'lagise', 'lagibo', 'bhal', 'xetu', 'etu',
    # Hindi/Hinglish question words and particles
    'kuch', 'bhi', 'puchu', 'pucho', 'puchna', 'lekin', 'magar', 'parantu', 'ye', 'yeh', 'woh', 'wo',
    'so', 'toh', 'ab', 'pe', 'ne', 'lag', 'laga', 'lagi', 'lage', 'lagta', 'lagti', 'lagte',
    'raha', 'rahi', 'rahe', 'rahega', 'rahegi', 'rahenge', 'tha', 'thi', 'the',
    'bolo', 'boliye', 'apna', 'apne', 'apni', 'mera', 'meri', 'mere', 'hum', 'humein',
    'aap', 'aapka', 'aapke', 'aapki', 'tum', 'tumhara', 'mang', 'mangta', 'mangte', 'mangti',
    # Bengali
    'kothay', 'koto', 'achhe', 'aajke', 'kaal', 'bhalo', 'ebong', 'ba', 'ekhon', 'brishti'
}

# Words that indicate domain concepts and must NEVER be treated as cities to geocode
INTENT_NON_CITY_WORDS = {
    'heatstroke', 'stroke', 'heat', 'exhaustion', 'symptom', 'symptoms', 'lakshan', 'ilaaj', 'first', 'aid',
    'cramp', 'cramps', 'treatment', 'ors', 'ghol', 'electrolyte', 'drink', 'drinks', 'hydration',
    'sattu', 'panna', 'cooling', 'cooler', 'parda', 'curtain', 'matka', 'ac', 'utci', 'wbgt', 'uhi',
    'ambulance', 'hospital', 'doctor', 'helpline', 'who', 'joke', 'help', 'tips', 'bachav', 'khatra',
    'child', 'children', 'kid', 'baby', 'infant', 'elderly', 'senior', 'buzurg', 'worker', 'labor', 'mazdoor',
    'pet', 'dog', 'cat', 'animal', 'janwar', 'kutta', 'photosynthesis', 'ai', 'definition', 'criteria'
}

CITY_ALIASES = {
    'guwati': 'Guwahati',
    'guwahti': 'Guwahati',
    'guwhahti': 'Guwahati',
    'gowahati': 'Guwahati',
    'gauhati': 'Guwahati',
    'ghy': 'Guwahati',
    'dilli': 'Delhi',
    'nayi dilli': 'New Delhi',
    'newdelhi': 'New Delhi',
    'bombay': 'Mumbai',
    'mumbay': 'Mumbai',
    'calcutta': 'Kolkata',
    'kolkata': 'Kolkata',
    'bangalore': 'Bengaluru',
    'bengaluru': 'Bengaluru',
    'blr': 'Bengaluru',
    'madras': 'Chennai',
    'chennai': 'Chennai',
    'amdavad': 'Ahmedabad',
    'ahemdabad': 'Ahmedabad',
    'gurgaon': 'Gurugram',
    'gurugram': 'Gurugram',
    'sona': 'Sohna',
    'sohna': 'Sohna',
    'jaypur': 'Jaipur',
    'jaipur': 'Jaipur',
    'lakhnau': 'Lucknow',
    'lucknow': 'Lucknow',
    'banaras': 'Varanasi',
    'kashi': 'Varanasi',
    'varanasi': 'Varanasi',
    'poona': 'Pune',
    'pune': 'Pune',
    'hydrabad': 'Hyderabad',
    'hyderabad': 'Hyderabad',
    'dispur': 'Dispur',
    'silchar': 'Silchar',
    'dibrugarh': 'Dibrugarh',
    'jorhat': 'Jorhat',
    'tezpur': 'Tezpur',
    'nagaon': 'Nagaon',
    'shillong': 'Shillong',
    'imphal': 'Imphal',
    'aizawl': 'Aizawl',
    'kohima': 'Kohima',
    'itanagar': 'Itanagar',
    'gangtok': 'Gangtok',
    'patna': 'Patna',
    'ranchi': 'Ranchi',
    'bhopal': 'Bhopal',
    'indore': 'Indore',
    'chandigarh': 'Chandigarh',
    'shimla': 'Shimla',
    'dehradun': 'Dehradun',
    'srinagar': 'Srinagar',
}

WMO_WEATHER_MAP = {
    0: ("Clear Sky", "Saaf Aasmaan"),
    1: ("Mainly Clear", "Mukhya Roop Se Saaf"),
    2: ("Partly Cloudy", "Halke Baadal"),
    3: ("Overcast", "Aasmaan Me Ghane Baadal"),
    45: ("Foggy", "Kohra"),
    48: ("Depositing Rime Fog", "Ghana Kohra"),
    51: ("Light Drizzle", "Halki Boondabaandi"),
    53: ("Moderate Drizzle", "Boondabaandi"),
    55: ("Dense Drizzle", "Tez Boondabaandi"),
    61: ("Slight Rain", "Halki Baarish"),
    63: ("Moderate Rain", "Baarish"),
    65: ("Heavy Rain", "Bhaari Baarish"),
    71: ("Slight Snow", "Halki Barfbaari"),
    80: ("Rain Showers", "Baarish Ki Bauchar"),
    81: ("Moderate Showers", "Bauchar"),
    82: ("Violent Showers", "Tez Bauchar"),
    95: ("Thunderstorm", "Garaj Ke Saath Baarish"),
    96: ("Thunderstorm with Slight Hail", "Aandhi-Toofan Aur Ole"),
    99: ("Thunderstorm with Heavy Hail", "Bhaari Toofan Aur Ole"),
}

LANGUAGE_NAMES = {
    'en': 'English',
    'hi': 'Hindi (हिन्दी)',
    'hinglish': 'Hinglish (Conversational Hindi in Roman script)',
    'bn': 'Bengali (বাংলা)',
    'as': 'Assamese (অসমীয়া)',
    'mr': 'Marathi (मराठी)',
    'gu': 'Gujarati (ગુજરાતી)',
    'ta': 'Tamil (தமிழ்)',
    'te': 'Telugu (తెలుగు)',
    'pa': 'Punjabi (ਪੰਜਾਬੀ)',
}

def detect_language(text: str) -> str:
    """Detects primary language of text based on Unicode script and lexical markers."""
    if not text:
        return 'en'
    
    # 1. Unicode script detection
    if re.search(r'[\u0900-\u097F]', text):  # Devanagari (Hindi / Marathi)
        if any(w in text for w in ['आहे', 'नाही', 'कसे', 'काय', 'हवामान', 'तापमान', 'उष्माघात', 'करावे']):
            return 'mr'
        return 'hi'
    if re.search(r'[\u0980-\u09FF]', text):  # Bengali / Assamese
        if 'ৰ' in text or 'ৱ' in text or any(w in text for w in ['আজি', 'কালি', 'বতৰ', 'পানী', 'গৰম', 'কেনেকুৱা', 'লাগে']):
            return 'as'
        return 'bn'
    if re.search(r'[\u0A00-\u0A7F]', text):  # Gurmukhi (Punjabi)
        return 'pa'
    if re.search(r'[\u0A80-\u0AFF]', text):  # Gujarati
        return 'gu'
    if re.search(r'[\u0B80-\u0BFF]', text):  # Tamil
        return 'ta'
    if re.search(r'[\u0C00-\u0C7F]', text):  # Telugu
        return 'te'
    
    # 2. Romanized Assamese markers
    q = text.lower()
    if any(w in q for w in ['kenkuwa', 'kenekuwa', 'botor', 'boroxun', 'aaji', 'kali', 'lagise', 'lagibo']):
        return 'as'

    # 3. Hinglish markers (Roman script Hindi)
    hinglish_markers = [
        'kya', 'kiya', 'kaisa', 'kaise', 'hai', 'he', 'hoga', 'hogi', 'mausam',
        'taapmaan', 'garmi', 'baarish', 'loo', 'aaj', 'kal', 'batao', 'bataiye',
        'kahan', 'kitna', 'kitni', 'paani', 'chahiye', 'khatra', 'bachav', 'ilaaj',
        'chakkar', 'dhoop', 'bachayein', 'peena', 'karo', 'khayein', 'ghol',
        'kuch', 'bhi', 'puchu', 'lekin', 'mang'
    ]
    if any(re.search(r'\b' + re.escape(w) + r'\b', q) for w in hinglish_markers):
        return 'hinglish'
        
    return 'en'

def clean_markdown_formatting(text: str) -> str:
    """Removes broken or dangling asterisks and cleans markdown for flawless display."""
    if not text:
        return ""
    # Fix separated bold asterisks: "** word **" -> "**word**"
    cleaned = re.sub(r'\*\*\s+', '**', text)
    cleaned = re.sub(r'\s+\*\*', '**', cleaned)
    # Fix solitary or orphaned asterisks that look like bullet points: "* word" -> "• word"
    cleaned = re.sub(r'^\s*\*\s+', '• ', cleaned, flags=re.MULTILINE)
    # Fix double bullet signs
    cleaned = re.sub(r'^[•\-\*]\s*[•\-\*]\s+', '• ', cleaned, flags=re.MULTILINE)
    return cleaned.strip()

async def translate_text(text: str, target_lang: str) -> str:
    """
    Translates text into the requested target language preserving paragraph boundaries.
    If target_lang is 'en' or 'hinglish', text is returned directly.
    """
    if not text or not text.strip() or target_lang in ['en', 'hinglish', 'auto']:
        return clean_markdown_formatting(text)

    gt_lang_map = {
        'hi': 'hi',
        'bn': 'bn',
        'as': 'as',
        'mr': 'mr',
        'gu': 'gu',
        'ta': 'ta',
        'te': 'te',
        'pa': 'pa',
    }
    tl = gt_lang_map.get(target_lang, target_lang)

    try:
        paragraphs = text.split('\n\n')
        translated_paras = []
        async with httpx.AsyncClient(timeout=7.0) as client:
            for p in paragraphs:
                p_clean = p.strip()
                if not p_clean:
                    continue
                url = "https://translate.googleapis.com/translate_a/single"
                params = {
                    "client": "gtx",
                    "sl": "auto",
                    "tl": tl,
                    "dt": "t",
                    "q": p_clean
                }
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    if data and isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                        tr_piece = "".join(item[0] for item in data[0] if item and item[0])
                        translated_paras.append(tr_piece if tr_piece else p_clean)
                    else:
                        translated_paras.append(p_clean)
                else:
                    translated_paras.append(p_clean)

        if translated_paras:
            return clean_markdown_formatting("\n\n".join(translated_paras))
    except Exception as e:
        print(f"[Translation Warning]: {e}")

    return clean_markdown_formatting(text)

def extract_coordinates(text: str) -> Optional[Tuple[float, float, str]]:
    """Detects coordinates in formats like: '28.2464°N, 77.0697°E' or 'lat: 28.24, lng: 77.06' or '28.24, 77.06'"""
    match = re.search(r'(-?\d+\.?\d*)\s*°?\s*([NSns])?\s*,\s*(-?\d+\.?\d*)\s*°?\s*([EWew])?', text)
    if match:
        try:
            lat = float(match.group(1))
            lat_dir = match.group(2)
            if lat_dir and lat_dir.upper() == 'S':
                lat = -lat
            lng = float(match.group(3))
            lng_dir = match.group(4)
            if lng_dir and lng_dir.upper() == 'W':
                lng = -lng
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                label = f"{abs(lat):.3f}°{'N' if lat>=0 else 'S'}, {abs(lng):.3f}°{'E' if lng>=0 else 'W'}"
                return (lat, lng, label)
        except Exception:
            pass
    return None

def extract_comparison_places(text: str) -> List[str]:
    """Detects comparison queries between two places (e.g. 'Delhi vs Mumbai', 'Jaipur or Lucknow', 'Sohna aur Delhi')."""
    patterns = [
        r'compare\s+([\w\s]+?)\s+(?:and|with|to)\s+([\w\s]+)',
        r'([\w\s]+?)\s+(?:vs\.?|versus)\s+([\w\s]+)',
        r'(?:which\s+is\s+hotter|hotter|colder|warmer)\s*[:,]?\s*([\w\s]+?)\s+(?:or|and)\s+([\w\s]+)',
        r'([\w\s]+?)\s+(?:aur|ya)\s+([\w\s]+?)\s+(?:me\s+se|ka\s+taapmaan|ka\s+mausam)',
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            p1 = re.sub(r'[^\w\s]', '', m.group(1)).strip()
            p2 = re.sub(r'[^\w\s]', '', m.group(2)).strip()
            p1_tokens = [t for t in p1.split() if t.lower() not in QUERY_STOPWORDS and t.lower() not in INTENT_NON_CITY_WORDS]
            p2_tokens = [t for t in p2.split() if t.lower() not in QUERY_STOPWORDS and t.lower() not in INTENT_NON_CITY_WORDS]
            if p1_tokens and p2_tokens:
                return [" ".join(p1_tokens), " ".join(p2_tokens)]
    return []

def extract_place_candidate(text: str) -> str:
    """Extracts a legitimate city candidate from text, excluding question and domain terms."""
    lower = text.lower().strip()

    # If the query contains any health, first aid, hydration, or concept terms, do not extract as city
    if any(re.search(r'\b' + re.escape(w) + r'\b', lower) for w in INTENT_NON_CITY_WORDS):
        return ""

    # Conversational questions should not be treated as places
    if re.search(r'^(what is|who is|explain|define|tell me about|how does|why does|difference between|kya hota hai|kya hai|kuch bhi|lekin|location mang|who are you|how are you|tell me a joke)\b', lower):
        if not any(w in lower for w in ['weather', 'mausam', 'taapmaan', 'temp', 'temperature', 'forecast', 'rain', 'baarish', 'botor', 'in ', 'of ']):
            return ""

    cleaned = re.sub(r'[^\w\s]', ' ', lower)
    tokens = [t.strip() for t in cleaned.split() if t.strip() and t.strip() not in QUERY_STOPWORDS and t.strip() not in INTENT_NON_CITY_WORDS]
    if not tokens:
        return ""
    
    # Check for direct alias match
    raw = " ".join(tokens)
    if raw in CITY_ALIASES:
        return CITY_ALIASES[raw]
    for t in tokens:
        if t in CITY_ALIASES:
            return CITY_ALIASES[t]

    valid_tokens = [t for t in tokens if len(t) > 1 and not t.isdigit()]
    return " ".join(valid_tokens).strip()

async def geocode_place(name: str) -> Optional[Dict[str, Any]]:
    if not name or len(name) < 2:
        return None
    
    clean_name = name.lower().strip()
    if clean_name in CITY_ALIASES:
        clean_name = CITY_ALIASES[clean_name]

    # Guard against querying non-cities
    if clean_name in INTENT_NON_CITY_WORDS:
        return None

    async def try_query(q_str: str):
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={q_str}&count=1&language=en&format=json"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    if results:
                        top = results[0]
                        state = f", {top['admin1']}" if top.get("admin1") else ""
                        country = f", {top['country']}" if top.get("country") else ""
                        return {
                            "name": top["name"],
                            "displayName": f"{top['name']}{state}{country}",
                            "lat": top["latitude"],
                            "lng": top["longitude"],
                            "country": top.get("country"),
                            "admin1": top.get("admin1"),
                        }
        except Exception:
            pass
        return None

    res = await try_query(clean_name)
    if res:
        return res

    # If multi-token query failed, test individual tokens if they look like cities
    tokens = clean_name.split()
    if len(tokens) > 1:
        for t in tokens:
            if t in INTENT_NON_CITY_WORDS:
                continue
            alias_t = CITY_ALIASES.get(t, t)
            res_t = await try_query(alias_t)
            if res_t:
                return res_t

    return None

async def fetch_weather_for_point(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """Fetches real satellite meteorological observations from Open-Meteo."""
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lng}&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&"
        f"hourly=temperature_2m,precipitation_probability,uv_index,visibility&"
        f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&"
        f"timezone=auto"
    )
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                return res.json()
    except Exception as e:
        print(f"[Weather API Warning]: {e}")
    return None

def get_wind_direction_label(deg: float) -> str:
    dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    idx = int((deg % 360) / 22.5 + 0.5) % 16
    return dirs[idx]

async def fetch_wiki_knowledge(query: str) -> Optional[Tuple[str, str]]:
    """Searches Wikipedia API for the best matching article and retrieves its summary extract."""
    cleaned = re.sub(r'^(what is|who is|explain|define|tell me about|how does|why does|kya hai|kya hota hai|kisko bolte hai)\s+', '', query, flags=re.IGNORECASE).strip()
    if not cleaned:
        cleaned = query

    headers = {"User-Agent": "HeatwaveEarlyWarningAssistant/2.0 (contact: admin@heatwave.gov)"}
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            # Search Wikipedia for top matching title
            search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={cleaned}&format=json"
            s_res = await client.get(search_url, headers=headers)
            if s_res.status_code == 200:
                s_data = s_res.json()
                hits = s_data.get("query", {}).get("search", [])
                if hits:
                    best_title = hits[0].get("title")
                    sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{best_title.replace(' ', '_')}"
                    sum_res = await client.get(sum_url, headers=headers)
                    if sum_res.status_code == 200:
                        sum_data = sum_res.json()
                        extract = sum_data.get("extract")
                        if extract and len(extract) > 40:
                            return (best_title, extract)
    except Exception as e:
        print(f"[Wiki Knowledge Warning]: {e}")

    # Fallback: DuckDuckGo instant answer
    try:
        ddg_url = f"https://api.duckduckgo.com/?q={cleaned}&format=json"
        async with httpx.AsyncClient(timeout=3.5) as client:
            r = await client.get(ddg_url)
            if r.status_code in [200, 202]:
                data = r.json()
                abstract = data.get("AbstractText")
                if abstract and len(abstract) > 30:
                    heading = data.get("Heading", cleaned.title())
                    return (heading, abstract)
    except Exception:
        pass

    return None

# =====================================================================
# LLM Integration (Groq, Gemini, OpenAI, Ollama)
# =====================================================================

async def call_llm_service(
    user_prompt: str,
    system_context: str,
    language: str = "auto"
) -> Optional[str]:
    """
    Calls configured LLM services:
    1. Groq (llama-3.3-70b-versatile or llama-3.1-8b-instant) - ultra fast & free
    2. Google Gemini (gemini-1.5-flash)
    3. OpenAI (gpt-4o-mini)
    4. Ollama local instance
    """
    lang_name = LANGUAGE_NAMES.get(language, "the user's language")

    system_prompt = (
        f"You are the official Conversational AI Climate, Weather & Heatwave Safety Assistant "
        f"for India's Early Warning Platform. You respond with the conversational intelligence, "
        f"clarity, structure, and depth of ChatGPT.\n\n"
        f"USER'S PREFERRED LANGUAGE: {lang_name}.\n"
        f"INSTRUCTIONS:\n"
        f"1. Answer the user's question directly, thoughtfully, and helpfully in {lang_name}.\n"
        f"2. Use clean markdown: bold headings, organized bullet points, and appropriate emojis.\n"
        f"3. Do NOT invent fake weather numbers. Use the provided real telemetry when available.\n"
        f"4. For general questions (health, science, daily advice, chit-chat), answer thoroughly and politely.\n"
        f"5. Never demand the user's location when they ask a general question.\n\n"
        f"CONTEXT & REAL-TIME DATA:\n{system_context}"
    )

    # 1. Try Groq
    groq_key = os.getenv("GROQ_API_KEY") or GROQ_API_KEY
    if groq_key and len(groq_key) > 10:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.6,
                        "max_tokens": 1200
                    }
                )
                if res.status_code == 200:
                    out = res.json()["choices"][0]["message"]["content"]
                    if out and len(out) > 20:
                        return clean_markdown_formatting(out)
        except Exception as e:
            print(f"[Groq LLM Warning]: {e}")

    # 2. Try Gemini
    gemini_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    if gemini_key and len(gemini_key) > 10:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "system_instruction": {"parts": [{"text": system_prompt}]},
                        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                        "generationConfig": {"temperature": 0.6, "maxOutputTokens": 1200}
                    }
                )
                if res.status_code == 200:
                    cand = res.json().get("candidates", [])
                    if cand and "content" in cand[0]:
                        parts = cand[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return clean_markdown_formatting(parts[0]["text"])
        except Exception as e:
            print(f"[Gemini LLM Warning]: {e}")

    # 3. Try OpenAI
    openai_key = os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY
    if openai_key and len(openai_key) > 10:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.6,
                        "max_tokens": 1200
                    }
                )
                if res.status_code == 200:
                    out = res.json()["choices"][0]["message"]["content"]
                    if out and len(out) > 20:
                        return clean_markdown_formatting(out)
        except Exception as e:
            print(f"[OpenAI LLM Warning]: {e}")

    # 4. Try Local Ollama
    ollama_url = os.getenv("OLLAMA_BASE_URL") or OLLAMA_BASE_URL
    if ollama_url:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{ollama_url.rstrip('/')}/api/chat",
                    json={
                        "model": "llama3",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "stream": False
                    }
                )
                if res.status_code == 200:
                    out = res.json().get("message", {}).get("content")
                    if out and len(out) > 20:
                        return clean_markdown_formatting(out)
        except Exception as e:
            print(f"[Ollama Warning]: {e}")

    return None

# =====================================================================
# Real-Time Telemetry Weather Report Synthesizer
# =====================================================================

def build_chatgpt_weather_report(
    display_name: str,
    city_name: str,
    w_data: dict,
    is_hinglish: bool
) -> str:
    """Formats real satellite weather observations with ChatGPT elegance and thoroughness."""
    cur = w_data.get("current", {})
    daily = w_data.get("daily", {})

    temp = cur.get("temperature_2m", 30.0)
    app_temp = cur.get("apparent_temperature", round(temp + 2.5, 1))
    hum = cur.get("relative_humidity_2m", 60)
    wind = cur.get("wind_speed_10m", 8.0)
    wind_dir = get_wind_direction_label(cur.get("wind_direction_10m", 60))
    code = cur.get("weather_code", 2)
    cond_en, cond_hi = WMO_WEATHER_MAP.get(code, ("Partly Cloudy", "Halke Baadal"))

    rain_prob = daily.get("precipitation_probability_max", [20])[0] if daily.get("precipitation_probability_max") else 20
    max_t = daily.get("temperature_2m_max", [round(temp + 2.0, 1)])[0]
    min_t = daily.get("temperature_2m_min", [round(temp - 4.0, 1)])[0]
    is_heatwave = temp >= 40.0 or app_temp >= 44.0

    # Human thermal stress assessment
    if app_temp >= 45.0:
        stress_en = "🚨 Dangerous Heat Stress (Extreme Risk)"
        stress_hi = "🚨 Gambhir Garmi Ka Khatra (Extreme Heat Stress)"
    elif app_temp >= 39.0:
        stress_en = "⚠️ High Thermal Stress (Caution Advised)"
        stress_hi = "⚠️ Zyada Garmi (Savdhani Bartane Ki Zaroorat)"
    elif app_temp >= 32.0:
        stress_en = "🟡 Moderate Heat (Normal Summer Range)"
        stress_hi = "🟡 Sadharan Garmi (Normal Summer Range)"
    else:
        stress_en = "✅ Comfortable / Low Thermal Stress"
        stress_hi = "✅ Sukhad Mausam (Comfortable & Safe)"

    if is_hinglish:
        return (
            f"🌤️ **{display_name} Ka Real-Time Satellite Mausam**\n\n"
            f"**{city_name}** ke taaza satellite telemetry aur atmospheric observations:\n\n"
            f"• 🌡️ **Taapmaan**: **{temp}°C** ({cond_hi})\n"
            f"• 🥵 **Feels Like (Mahsoos Hone Wala)**: **{app_temp}°C**\n"
            f"• 💧 **Hawa Me Nami (Humidity)**: **{hum}%**\n"
            f"• 💨 **Hawa Ki Gati**: **{wind} km/h** ({wind_dir} disha se)\n"
            f"• 🌧️ **Baarish Ke Aasaar**: **{rain_prob}% sambhavna**\n"
            f"• 📈 **Aaj Ka Range**: Day High **{max_t}°C** | Night Low **{min_t}°C**\n"
            f"• ☀️ **Thermal Heat Stress Level**: **{stress_hi}**\n\n"
            f"💡 **Actionable Advisory**:\n"
            f"{'⚠️ Dophar 12 se 4 baje ke beech dhoop me nikalne se bachein. ORS, nariyal paani ya nimbu paani piyein.' if is_heatwave else '✅ Mausam anukool hai. Bahar nikalte waqt paryapt paani peete rahein aur dhoop se bachav ke liye topi ya chhaata istemaal karein.'}"
        )
    else:
        return (
            f"🌤️ **Real-Time Satellite Weather for {display_name}**\n\n"
            f"Verified live meteorological observations for **{city_name}**:\n\n"
            f"• 🌡️ **Ambient Temperature**: **{temp}°C** ({cond_en})\n"
            f"• 🥵 **Apparent Heat ('Feels Like')**: **{app_temp}°C**\n"
            f"• 💧 **Relative Humidity**: **{hum}%**\n"
            f"• 💨 **Wind**: **{wind} km/h** ({wind_dir})\n"
            f"• 🌧️ **Precipitation Probability**: **{rain_prob}%**\n"
            f"• 📈 **Diurnal Range**: High **{max_t}°C** | Low **{min_t}°C**\n"
            f"• ☀️ **Thermal Stress Assessment**: **{stress_en}**\n\n"
            f"💡 **Practical Advisory**:\n"
            f"{'⚠️ Limit strenuous outdoor physical activities between 12:00 PM and 4:00 PM. Hydrate regularly with oral rehydration salts (ORS) or electrolyte solutions.' if is_heatwave else '✅ Ambient conditions are currently stable. Maintain standard hydration when traveling outdoors.'}"
        )

# =====================================================================
# Main AI Generator Function
# =====================================================================

async def generate_chatgpt_style_response(
    message: str,
    context: Optional[dict] = None,
    preferred_lang: str = "auto"
) -> Tuple[str, bool]:
    """
    Deep, responsive AI conversational agent matching ChatGPT/Gemini behavior.
    Features:
    - Real satellite telemetry RAG integration
    - LLM dispatch (Groq, Gemini, OpenAI) with automatic fallback
    - Global city weather, comparisons, pinned coordinates
    - Comprehensive health, cooling, science, emergency guidance
    - Open-ended encyclopedic intelligence (Wikipedia/DuckDuckGo)
    - 11-language translation
    - Never unnecessarily demands location
    """
    q = message.lower().strip()
    ctx = context if isinstance(context, dict) else {}
    region = ctx.get("region", "Guwahati Metropolitan Area")

    # Determine effective language
    detected = detect_language(message)
    effective_lang = preferred_lang if preferred_lang != "auto" else detected
    is_hinglish = effective_lang == 'hinglish'

    # -------------------------------------------------------------
    # 0. User feedback/frustration about demanding location
    # -------------------------------------------------------------
    if any(k in q for k in ['location mang', 'location kyu', 'kuch bhi puchu', 'kuch bhi pucho', 'baar baar location', 'location demand', 'asking for location', 'why location', 'location kyu mang', 'location mang raha']):
        if is_hinglish:
            base_text = (
                f"🙏 **Maafi chahta hoon! Ab main har sawaal ka sidha uttar dunga, bina location maange.**\n\n"
                f"Aap mujhse bejhijhak koi bhi sawaal pooch sakte hain:\n\n"
                f"• 🌤️ **Mausam**: Bina shahar bataye bhi pooch sakte hain — main aapke dashboard ilaqe ({region}) ka live data bata dunga.\n"
                f"• 🚨 **Health & Heatwave**: Heatstroke ke lakshan, ORS recipe, bachav ke upay.\n"
                f"• 🏠 **Home Cooling**: Bina AC ke kamra thanda rakhne ke tarike.\n"
                f"• 💡 **Koi Bhi Anya Jankari**: Vigyan, geography, AI ya daily life ke sawaal sidhe yahan likhein!"
            )
        else:
            base_text = (
                f"🙏 **My sincere apologies! I will answer all your questions directly without demanding your location.**\n\n"
                f"Feel free to ask anything:\n\n"
                f"• 🌤️ **Weather**: Even without specifying a city, I will provide live satellite telemetry for your active region ({region}).\n"
                f"• 🚨 **Health & Thermal Safety**: Heatstroke symptoms, first-aid protocols, home-made ORS recipe.\n"
                f"• 🏠 **Passive Cooling**: Proven methods to keep rooms cool without AC.\n"
                f"• 💡 **General Knowledge**: Science, climate, physiology, or daily life inquiries!"
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 1. Explicit request to use map pin picker
    # -------------------------------------------------------------
    if any(k in q for k in ['map par chuno', 'pick on map', 'select on map', 'pin on map', 'drop pin', 'map location']):
        base_text = (
            f"📍 **Interactive Map Location Picker**\n\n"
            f"Aap niche diye gaye button par click karke map par kahin bhi pin laga sakte hain, aur main turant wahan ka live satellite weather telemetry bata dunga!"
            if is_hinglish else
            f"📍 **Interactive Map Location Picker**\n\n"
            f"Click the button below to drop a pin anywhere on the map to receive instant, verified satellite weather telemetry!"
        )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, True)

    # -------------------------------------------------------------
    # 2. Coordinates passed from pin picker
    # -------------------------------------------------------------
    coords = extract_coordinates(message)
    if coords:
        lat, lng, label = coords
        w_data = await fetch_weather_for_point(lat, lng)
        if w_data and "current" in w_data:
            report = build_chatgpt_weather_report(f"Selected Map Location ({label})", label, w_data, is_hinglish)
            final_text = await translate_text(report, effective_lang)
            return (final_text, False)

    # -------------------------------------------------------------
    # 3. Health, Heatstroke vs Heat Exhaustion & Emergency First Aid
    # -------------------------------------------------------------
    if any(k in q for k in ['heatstroke', 'heat stroke', 'exhaustion', 'symptom', 'lakshan', 'chakkar', 'ilaaj', 'first aid', 'cramp', 'faint', 'behoshi', 'treatment']):
        if is_hinglish:
            base_text = (
                f"🚨 **Heat Exhaustion vs Heat Stroke: Lakshan Aur Turant Kadam**\n\n"
                f"Garmi ki bimaariyon me sahi samay par pehchan jeevan bachati hai:\n\n"
                f"• 🟡 **Heat Exhaustion (Halki Garmi Ka Asar)**:\n"
                f"  - **Lakshan**: Bahut zyada paseena aana, kamzori, thandi aur geeli twacha, chakkar aana, ulti jaisa lagna, maanspeshiyon me dard (cramps).\n"
                f"  - **Turant Ilaaj**: Mareez ko thandi chhaav ya AC kamre me le jaayein, geela thanda kapda sar par rakhein, ORS ya nimbu-paani sip-sip karke pilayein.\n\n"
                f"• 🔴 **Heat Stroke (Gambhir Khatra - Medical Emergency)**:\n"
                f"  - **Lakshan**: Shareer ka taapmaan 40°C (104°F) se upar pahunchna, paseena aana band hona, garam aur laal twacha, ghabrahat, behoshi.\n"
                f"  - **Turant Kadam**: Turant **108 Ambulance** ko call karein! Mareez ki gardan, kaankh (armpits) aur janghon par baraf ya thanda paani lagakar taapmaan girayein.\n\n"
                f"📞 **Emergency Helplines**: **108** (Ambulance), **112** (Rashtriya Emergency Number)."
            )
        else:
            base_text = (
                f"🚨 **Heat Exhaustion vs Heat Stroke: Symptoms & Immediate Protocols**\n\n"
                f"Prompt clinical distinction is vital for effective medical intervention:\n\n"
                f"• 🟡 **Heat Exhaustion (Early Warning Phase)**:\n"
                f"  - **Symptoms**: Profuse sweating, pale/clammy skin, weakness, dizziness, headache, nausea, painful muscle cramps.\n"
                f"  - **Immediate First Aid**: Move patient to a cool shaded or air-conditioned area, elevate legs slightly, apply cool damp cloths, provide oral rehydration solution (ORS).\n\n"
                f"• 🔴 **Heat Stroke (Life-Threatening Medical Emergency)**:\n"
                f"  - **Symptoms**: Core body temperature exceeding 40°C (104°F), cessation of sweating, hot dry flushed skin, confusion, delirium, loss of consciousness.\n"
                f"  - **Critical Actions**: Call **108** or **112** immediately! Perform rapid evaporative cooling; place ice packs on the neck, axillae, and groin while awaiting transport.\n\n"
                f"📞 **Emergency Helplines**: **108** (Medical Ambulance), **112** (Emergency Response)."
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 4. ORS Recipe & Summer Hydration / Drinks
    # -------------------------------------------------------------
    if any(k in q for k in ['ors', 'ghol', 'electrolyte', 'drink', 'drinks', 'hydration', 'sattu', 'chhaas', 'shikanji', 'aam panna', 'coconut', 'peena', 'ice water']):
        if is_hinglish:
            base_text = (
                f"💧 **Ghar Par ORS Banane Ka Tarika Aur Best Summer Drinks**\n\n"
                f"🥤 **WHO Manak Home-Made ORS Recipe**:\n"
                f"• 1 liter ubla hua aur thanda kiya gaya peene ka paani lein.\n"
                f"• Usme **6 choti chammach cheeni** (sugar) aur **1/2 choti chammach namak** (salt) milayein.\n"
                f"• Poori tarah ghulne tak hilayein aur dinbhar thoda-thoda karke piyein.\n\n"
                f"🌿 **Paramparik Desi Peypeyartha (Top Cooling Drinks)**:\n"
                f"• **Chhaas (Buttermilk)**: Bhuna jeera aur kaala namak dalkar piyein; digestion sudharta hai aur electrolyte balance banaye rakhta hai.\n"
                f"• **Sattu Sharbat**: Bihar aur UP ka mashhoor natural protein drink jo loo se bachaav karta hai.\n"
                f"• **Aam Panna**: Kacche aam ka sharbat vitamin C aur natural enzymes se bharpūr hota hai.\n"
                f"• **Nariyal Paani**: Natural potassium aur minerals ka behtareen srot.\n\n"
                f"⚠️ **Zaroori Savdhani**: Bahar dhoop se aate hi baraf ka chilled paani mat piyein, 5 minute baad normal paani lein."
            )
        else:
            base_text = (
                f"💧 **WHO Standard Home ORS Formulation & Top Summer Hydration Drinks**\n\n"
                f"🥤 **Home-Made Oral Rehydration Salt (ORS) Formula**:\n"
                f"• 1 Litre of clean, boiled and cooled drinking water.\n"
                f"• **6 level teaspoons of sugar** + **1/2 level teaspoon of salt**.\n"
                f"• Stir until fully dissolved; sip continuously throughout high-heat exposure.\n\n"
                f"🌿 **Optimal Natural Electrolyte Drinks**:\n"
                f"• **Buttermilk (Chhaas)**: High probiotic content restores vital digestive flora and sodium levels.\n"
                f"• **Sattu Drink**: High-fiber roasted gram flour beverage providing prolonged heat endurance.\n"
                f"• **Raw Mango Panna**: Traditional antidote preventing heatstroke via high organic acid & vitamin C concentrations.\n"
                f"• **Tender Coconut Water**: Rich in bio-available potassium, magnesium, and hydration electrolytes.\n\n"
                f"⚠️ **Precaution**: Never ingest ice-cold water immediately upon entering from severe heat, as it can cause sudden esophageal spasms."
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 5. Vulnerable Populations: Children, Elderly, Workers, Pets
    # -------------------------------------------------------------
    if any(k in q for k in ['child', 'children', 'kid', 'baby', 'infant', 'bachha', 'bachhe', 'elderly', 'senior', 'buzurg', 'worker', 'labor', 'mazdoor', 'pet', 'dog', 'cat', 'animal', 'janwar', 'kutta', 'gaay']):
        if is_hinglish:
            base_text = (
                f"🛡️ **Vulnerable Groups: Bachhon, Buzurgon, Mazdooron Aur Janwaron Ki Suraksha**\n\n"
                f"• 👶 **Bachhe Aur Shishu**:\n"
                f"  - Kabhi bhi bachhon ko band car ke andar akele na chhodein (car ka cabin 5 minute me 60°C ho sakta hai).\n"
                f"  - Halki dhoop me sooti (cotton) kapde pehnayein aur samay-samay par paani pilate rahein.\n\n"
                f"• 👴 **Buzurg Aur BP/Diabetes Ke Mareez**:\n"
                f"  - Buzurgon me pyas lagne ka sanket der se milta hai, isliye har ghante paani pilana anivarya karein.\n"
                f"  - Dophar 12 se 4 baje ke beech dhoop me nikalne se rokein.\n\n"
                f"• 👷 **Outdoor & Nirman Mazdoor**:\n"
                f"  - NDMA niyam: Bhari kaam subah 6-11 baje aur shaam 4:30 baje ke baad karein.\n"
                f"  - Kaam ki jagah par chhaanv aur ORS/paani uplabdh hona anivarya hai.\n\n"
                f"• 🐕 **Pets & Pashu**:\n"
                f"  - Kutton ko garm dambar/sadak par na ghumaayein (7-second asphalt test karein).\n"
                f"  - Har samay taaza thanda paani aur chhaanv uplabdh rakhein."
            )
        else:
            base_text = (
                f"🛡️ **Safety Protocols for High-Risk Groups & Animals**\n\n"
                f"• 👶 **Infants & Young Children**:\n"
                f"  - Never leave children inside a parked vehicle; interior greenhouse heating exceeds 60°C within minutes.\n"
                f"  - Dress in loose, light-colored cottons and avoid midday playgrounds.\n\n"
                f"• 👴 **Senior Citizens & Chronic Patients**:\n"
                f"  - Seniors exhibit diminished physiological thirst reflexes; enforce scheduled fluid intake.\n"
                f"  - Monitor blood pressure and cardiovascular medication under medical guidance during heat spikes.\n\n"
                f"• 👷 **Construction & Outdoor Laborers**:\n"
                f"  - Comply with NDMA shifted working hours (6:00 AM - 11:00 AM and post 4:30 PM).\n"
                f"  - Provide mandatory worksite shaded recovery stations and electrolyte reserves.\n\n"
                f"• 🐕 **Pets & Livestock**:\n"
                f"  - Check pavement heat with the back of your hand before walking dogs (7-second rule).\n"
                f"  - Maintain continuous fresh water bowls and ventilation for dairy cattle and poultry."
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 6. Home Cooling Without AC / Passive Cooling Strategies
    # -------------------------------------------------------------
    if any(k in q for k in ['cool without ac', 'room cool', 'ghar thanda', 'bina ac', 'cooling', 'ventilation', 'parda', 'curtain', 'cooler', 'thanda kaise']):
        if is_hinglish:
            base_text = (
                f"🏠 **Bina AC Ke Ghar Aur Kamre Ko Thanda Rakhne Ke Upay**\n\n"
                f"• 🌬️ **Smart Cross-Ventilation**: Raat aur subah ke thande samay aamne-saamne ki khidkiyan kholein; subah 9 baje dhoop aane par khidkiyan aur motey parde band kar dein.\n"
                f"• 🌿 **Khus / Geeli Chatai**: Khidkiyon par geeli khus ki tatti ya geela sooti parda lagane se natural cooling effect milta hai.\n"
                f"• ⚪ **Cool Roof White Coating**: Chhat par safed chuna (slaked lime) ya solar reflective paint lagane se kamre ka taapmaan 4°C se 6°C tak kam ho jata hai.\n"
                f"• 🏺 **Terracotta Mitti Ke Matke**: Peene ke paani ke liye matke ka upayog karein jo natural evaporation se paani thanda rakhta hai.\n"
                f"• 💡 **Internal Heat Load Kam Karein**: Bulb aur unnecessary electronics band rakhein."
            )
        else:
            base_text = (
                f"🏠 **Science-Backed Strategies to Keep Rooms Cool Without Air Conditioning**\n\n"
                f"• 🌬️ **Nocturnal Cross-Ventilation**: Open opposite windows during the night and early morning to flush out warm air; seal windows and draw thermal-reflective blinds by 9:00 AM.\n"
                f"• 🌿 **Evaporative Vetiver Screens**: Install wet khus (vetiver) mats across windward openings for natural evaporative air cooling.\n"
                f"• ⚪ **Solar-Reflective Cool Roof Coating**: Applying high-albedo slaked lime or reflective elastomeric roof coatings reduces indoor ceiling temperatures by 4°C - 6°C.\n"
                f"• 🏺 **Terracotta Coolers**: Utilize natural unglazed clay pots (matkas) to keep drinking water chilled via capillary evaporation.\n"
                f"• 💡 **Internal Heat Elimination**: Switch off high-wattage incandescent lighting and heat-emitting home appliances during peak afternoon hours."
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 7. Science & Meteorological Definitions: Heatwave, UTCI, WBGT, UHI
    # -------------------------------------------------------------
    if any(k in q for k in ['what is heatwave', 'definition', 'utci', 'wbgt', 'urban heat island', 'uhi', 'wet bulb', 'imd criteria', 'red alert', 'orange alert', 'yellow alert']):
        if is_hinglish:
            base_text = (
                f"🔬 **Heatwave Vigyan & Takneeki Niyam (Definitions & Criteria)**\n\n"
                f"• 🌡️ **IMD Heatwave Niyam (India)**:\n"
                f"  - **Maidani Ilake (Plains)**: Taapmaan 40°C tak pahuche aur normal se 4.5°C zyada ho (ya flat 45°C ho jaye).\n"
                f"  - **Pahadi Ilake (Hills)**: Taapmaan 30°C ya usse upar ho.\n"
                f"  - **Tatiya Ilake (Coastal)**: Taapmaan 37°C ya usse upar ho.\n\n"
                f"• 🥵 **UTCI (Universal Thermal Climate Index)**: Yeh 'Feels Like' taapmaan batata hai, jisme dhoop, nami, hawa aur shareer ka cooling mechanism shamil hota hai.\n"
                f"• 💧 **Wet-Bulb Temperature (WBGT)**: Yeh batata hai ki kya hamara shareer paseene se thanda ho pa raha hai. 35°C wet-bulb ke upar insani shareer tolerate nahi kar pata.\n"
                f"• 🏙️ **Urban Heat Island (UHI)**: Shahron me concrete, asphalts aur building garmi ko sokh lete hain, jisse shahar gaon se 3°C-7°C zyada garm rehte hain."
            )
        else:
            base_text = (
                f"🔬 **Heatwave Science, Biometeorology & IMD Thresholds**\n\n"
                f"• 🌡️ **IMD Heatwave Criteria (India)**:\n"
                f"  - **Plains**: Ambient temperature reaches >= 40°C with departure >= 4.5°C above normal (or flat >= 45°C).\n"
                f"  - **Coastal Areas**: Ambient temperature reaches >= 37°C with departure >= 4.5°C.\n"
                f"  - **Hilly Regions**: Ambient temperature reaches >= 30°C with departure >= 4.5°C.\n\n"
                f"• 🥵 **UTCI (Universal Thermal Climate Index)**: A multi-node human thermo-physiology index quantifying perceived thermal stress combining temperature, humidity, thermal radiation, and wind.\n"
                f"• 💧 **Wet-Bulb Globe Temperature (WBGT)**: Metric evaluating environmental heat stress considering evaporative cooling limits. Sustained WBGT above 35°C poses extreme physiological risk.\n"
                f"• 🏙️ **Urban Heat Island (UHI)**: High density of concrete, asphalt, and reduced green cover causes urban areas to retain absorbed solar radiation, elevating city temperatures by 3°C - 7°C above surrounding rural landscapes."
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 8. Emergency Numbers & Hospital Heatstroke Facilities
    # -------------------------------------------------------------
    if any(k in q for k in ['ambulance', 'hospital', 'doctor', '108', '112', '1077', 'helpline', 'contact', 'phone', 'call']):
        if is_hinglish:
            base_text = (
                f"🚑 **Emergency Helpline & Chikitsa Sahayata**\n\n"
                f"• 📞 **Toll-Free Ambulance**: Turant **108** par call karein.\n"
                f"• 🚨 **Rashtriya Emergency Number**: **112** (Police, Fire, Medical).\n"
                f"• 🏢 **Disaster Management Helpline**: **1077** (Zila Aapad Prabandhan).\n"
                f"• 🏥 **Dedicated AC Heat Wards**: Sabhi Civil Hospital aur CHCs me saline drip aur cooling beds uplabdh hain."
            )
        else:
            base_text = (
                f"🚑 **Emergency Helplines & Medical Response**\n\n"
                f"• 📞 **Medical Ambulance Service**: Dial **108** (Toll-Free 24x7).\n"
                f"• 🚨 **Unified National Emergency**: Dial **112**.\n"
                f"• 🏢 **Disaster Management Cell**: Dial **1077**.\n"
                f"• 🏥 **Designated Heatstroke Facilities**: Regional civil hospitals operate air-conditioned cooling wards equipped with cold saline infusions."
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 9. Conversational Chit-Chat & Identity
    # -------------------------------------------------------------
    if any(k in q for k in ['who are you', 'what can you do', 'kaun ho', 'kya kar sakte ho', 'tum kaun ho', 'aap kaun ho', 'introduce', 'capabilities']):
        if is_hinglish:
            base_text = (
                f"🤖 **Namaste! Main aapka Advanced Real-Time Weather & Heatwave Safety AI Agent hoon.**\n\n"
                f"Meri mukhya visheshatayein (capabilities):\n\n"
                f"• 🛰️ **Live Satellite Weather**: Duniya ke kisi bhi shahar ka taaza taapmaan, nami, hawa aur baarish batana.\n"
                f"• ⚖️ **Shahar Tulna**: Do shaharon ke mausam ki tulna (jaise Delhi vs Mumbai).\n"
                f"• 🚨 **Heatwave Early Warning**: Loo ka khatra, IMD alerts aur thermal stress index (UTCI/WBGT).\n"
                f"• 🏥 **Health & Safety Advice**: Heatstroke first aid, home ORS recipe, bachhon aur buzurgon ki dekhbhaal.\n"
                f"• 🏠 **Passive Cooling**: Bina AC ke ghar thanda rakhne ke scientific upay.\n"
                f"• 🌐 **11 Bhashayein**: Hindi, Hinglish, Assamese, Bengali, Marathi, Gujarati, Tamil, Telugu, Punjabi aur English me batchit!"
            )
        else:
            base_text = (
                f"🤖 **Hello! I am your Advanced Real-Time Weather & Heatwave Early Warning AI Agent.**\n\n"
                f"My key capabilities include:\n\n"
                f"• 🛰️ **Global Live Satellite Telemetry**: Real-time ambient temperature, humidity, wind, and rain forecasts for ANY place worldwide.\n"
                f"• ⚖️ **Multi-City Comparison**: Compare thermal stress and weather parameters between cities side-by-side.\n"
                f"• 🚨 **Heatwave Alerting & Risk Modeling**: Active IMD alert monitoring, WBGT wet-bulb metrics, and UTCI perceived heat.\n"
                f"• 🏥 **Clinical Health & First Aid**: Heat exhaustion vs heatstroke differentiation, emergency 108 helplines, WHO ORS recipes.\n"
                f"• 🏠 **Passive Home Cooling**: Science-backed methods to lower indoor temperatures without air conditioning.\n"
                f"• 🌐 **Multilingual Support**: Fluent communication across 11 Indian and global languages!"
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    if any(k in q for k in ['joke', 'chutkula', 'climate joke', 'hasao']):
        joke_text = (
            f"😄 **Ek Chhota Sa Climate Joke**:\n\n"
            f"Suraj ne Baadal se kaha: \"Tum hamesha mere saamne kyu aa jaate ho?\"\n"
            f"Baadal ne muskurakar bola: \"Agar main na aau, toh dharti wale mujhe nahi, seedha AC ko yaad karenge!\" ☀️🌧️\n\n"
            f"Aap mausam, heatwave ya koi bhi jankari pooch sakte hain!"
            if is_hinglish else
            f"😄 **A Quick Weather Joke**:\n\n"
            f"Why did the sun go to school?\n"
            f"Because it wanted to get a little *brighter*! ☀️\n\n"
            f"Feel free to ask for real-time live satellite weather for any city or heatwave advice!"
        )
        final_text = await translate_text(joke_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 10. Multi-City Comparison (e.g. 'Delhi vs Mumbai', 'Compare Jaipur and Sohna')
    # -------------------------------------------------------------
    compare_places = extract_comparison_places(message)
    if len(compare_places) == 2:
        p1_name, p2_name = compare_places
        geo1 = await geocode_place(p1_name)
        geo2 = await geocode_place(p2_name)
        if geo1 and geo2:
            w1 = await fetch_weather_for_point(geo1["lat"], geo1["lng"])
            w2 = await fetch_weather_for_point(geo2["lat"], geo2["lng"])
            if w1 and w2 and "current" in w1 and "current" in w2:
                c1, c2 = w1["current"], w2["current"]
                t1, t2 = c1.get("temperature_2m", 30.0), c2.get("temperature_2m", 30.0)
                app1, app2 = c1.get("apparent_temperature", t1 + 3), c2.get("apparent_temperature", t2 + 3)
                hum1, hum2 = c1.get("relative_humidity_2m", 60), c2.get("relative_humidity_2m", 60)
                hotter = geo1["name"] if t1 > t2 else geo2["name"]
                diff = abs(round(t1 - t2, 1))

                if is_hinglish:
                    base_text = (
                        f"⚖️ **Mausam Tulna: {geo1['name']} vs {geo2['name']}**\n\n"
                        f"📊 **Taapmaan Vishleshan**:\n"
                        f"Abhi **{hotter}** ka taapmaan **{diff}°C** zyada garm hai!\n\n"
                        f"• 📍 **{geo1['displayName']}**:\n"
                        f"  - Taapmaan: **{t1}°C** (Feels like **{app1}°C**)\n"
                        f"  - Hawa Me Nami (Humidity): **{hum1}%**\n\n"
                        f"• 📍 **{geo2['displayName']}**:\n"
                        f"  - Taapmaan: **{t2}°C** (Feels like **{app2}°C**)\n"
                        f"  - Hawa Me Nami (Humidity): **{hum2}%**\n\n"
                        f"💡 **Advisory**: Dono shaharon me dhoop me nikalte waqt paryapt paani aur electrolytes peete rahein."
                    )
                else:
                    base_text = (
                        f"⚖️ **Thermal Comparison: {geo1['name']} vs {geo2['name']}**\n\n"
                        f"📊 **Comparative Analysis**:\n"
                        f"Currently, **{hotter}** is hotter by **{diff}°C**.\n\n"
                        f"• 📍 **{geo1['displayName']}**:\n"
                        f"  - Temperature: **{t1}°C** (Feels like **{app1}°C**)\n"
                        f"  - Relative Humidity: **{hum1}%**\n\n"
                        f"• 📍 **{geo2['displayName']}**:\n"
                        f"  - Temperature: **{t2}°C** (Feels like **{app2}°C**)\n"
                        f"  - Relative Humidity: **{hum2}%**\n\n"
                        f"💡 **Advisory**: Maintain adequate hydration and avoid prolonged direct sun exposure in both locations."
                    )
                final_text = await translate_text(base_text, effective_lang)
                return (final_text, False)

    # -------------------------------------------------------------
    # 11. Specific Place Weather Query (e.g. 'Sohna weather', 'Paris temperature')
    # -------------------------------------------------------------
    candidate = extract_place_candidate(message)
    if candidate and candidate.lower() not in INTENT_NON_CITY_WORDS:
        geocoded = await geocode_place(candidate)
        if geocoded:
            w_data = await fetch_weather_for_point(geocoded["lat"], geocoded["lng"])
            if w_data and "current" in w_data:
                # If LLM key is configured, invoke LLM with RAG telemetry context
                telemetry_summary = (
                    f"Location: {geocoded['displayName']}\n"
                    f"Temp: {w_data['current'].get('temperature_2m')}C\n"
                    f"Apparent Temp: {w_data['current'].get('apparent_temperature')}C\n"
                    f"Humidity: {w_data['current'].get('relative_humidity_2m')}%\n"
                    f"Wind: {w_data['current'].get('wind_speed_10m')} km/h\n"
                    f"Weather Code: {w_data['current'].get('weather_code')}\n"
                )
                llm_reply = await call_llm_service(message, telemetry_summary, effective_lang)
                if llm_reply:
                    return (llm_reply, False)

                # Fallback to high-grade built-in synthesizer
                report = build_chatgpt_weather_report(geocoded["displayName"], geocoded["name"], w_data, is_hinglish)
                final_text = await translate_text(report, effective_lang)
                return (final_text, False)

    # -------------------------------------------------------------
    # 12. General Weather Query (no specific place) -> Use ACTIVE REGION
    # -------------------------------------------------------------
    if any(k in q for k in ['weather', 'taapmaan', 'mausam', 'temp', 'temperature', 'forecast', 'baarish', 'rain', 'botor', 'bator', 'gorom', 'garmi', 'loo', 'dhoop', 'kal', 'tomorrow']):
        lat, lng = 26.1445, 91.7362
        coords_ctx = ctx.get("coordinates")
        if coords_ctx and isinstance(coords_ctx, (list, tuple)) and len(coords_ctx) == 2:
            try:
                lng, lat = float(coords_ctx[0]), float(coords_ctx[1])
            except Exception:
                pass

        w_data = await fetch_weather_for_point(lat, lng)
        if w_data and "current" in w_data:
            telemetry_summary = (
                f"Active Region: {region}\n"
                f"Temp: {w_data['current'].get('temperature_2m')}C\n"
                f"Apparent Temp: {w_data['current'].get('apparent_temperature')}C\n"
                f"Humidity: {w_data['current'].get('relative_humidity_2m')}%\n"
                f"Wind: {w_data['current'].get('wind_speed_10m')} km/h\n"
            )
            llm_reply = await call_llm_service(message, telemetry_summary, effective_lang)
            if llm_reply:
                return (llm_reply, False)

            report = build_chatgpt_weather_report(f"{region} (Active Region)", region, w_data, is_hinglish)
            final_text = await translate_text(report, effective_lang)
            return (final_text, False)

    # -------------------------------------------------------------
    # 13. LLM Check for General / Open Inquiries
    # -------------------------------------------------------------
    llm_reply = await call_llm_service(message, f"Active Region: {region}", effective_lang)
    if llm_reply:
        return (llm_reply, False)

    # -------------------------------------------------------------
    # 14. Open-Ended Encyclopedic Knowledge Extraction (Wikipedia / DuckDuckGo)
    # -------------------------------------------------------------
    wiki_info = await fetch_wiki_knowledge(message)
    if wiki_info:
        title, extract = wiki_info
        if is_hinglish:
            base_text = (
                f"💡 **{title} Ke Baare Me Jankari**\n\n"
                f"{extract}\n\n"
                f"• 🌤️ Aap kisi bhi shahar ka live mausam, garmi ke asar ya thermal safety se jude sawaal bhi pooch sakte hain!"
            )
        else:
            base_text = (
                f"💡 **Overview: {title}**\n\n"
                f"{extract}\n\n"
                f"• 🌤️ You can also inquire about live satellite weather for any location, climate metrics, or heat safety protocols!"
            )
        final_text = await translate_text(base_text, effective_lang)
        return (final_text, False)

    # -------------------------------------------------------------
    # 15. Default Conversational Welcome / Assistance
    # -------------------------------------------------------------
    if is_hinglish:
        base_text = (
            f"👋 **Namaste! Main aapka Real-Time Weather & Heatwave Safety Assistant hoon.**\n\n"
            f"Aap mujhse **kisi bhi shahar ka mausam, comparison, ya garmi se jude sawaal** pooch sakte hain!\n\n"
            f"Jaise:\n"
            f"• \"Sohna weather kaisa hai?\"\n"
            f"• \"Delhi vs Mumbai me kaun zyada garm hai?\"\n"
            f"• \"Heatstroke ke lakshan aur ilaaj\"\n"
            f"• \"Ghar par ORS ghol kaise banayein?\"\n"
            f"• \"Bina AC ke ghar ko thanda kaise rakhein?\"\n\n"
            f"📍 Map par kisi bhi sthaan ka mausam dekhna ho toh map pin picker ka upayog karein!"
        )
    else:
        base_text = (
            f"👋 **Hello! I am your Real-Time Weather & Thermal Safety AI Assistant.**\n\n"
            f"You can ask me about **live weather for any location, weather comparisons, heatwave safety, or health advisories!**\n\n"
            f"Examples:\n"
            f"• \"Weather in Sohna or Paris\"\n"
            f"• \"Which is hotter: Delhi or Mumbai?\"\n"
            f"• \"Heat stroke symptoms and first aid\"\n"
            f"• \"How to make home-made ORS solution\"\n"
            f"• \"How to keep rooms cool without AC\"\n\n"
            f"📍 You can also click the map button to drop a pin anywhere on earth!"
        )
    final_text = await translate_text(base_text, effective_lang)
    return (final_text, False)

@router.post("/chat")
async def chat_with_agent(query: UserQuery):
    """
    Primary AI agent endpoint with multi-language support (11 languages),
    LLM integration, and open-ended question answering.
    """
    ctx_dict = query.context if isinstance(query.context, dict) else {}
    req_lang = query.language or "auto"

    reply_text, has_map = await generate_chatgpt_style_response(
        query.message,
        ctx_dict,
        preferred_lang=req_lang
    )

    detected = detect_language(query.message)
    return {
        "reply": reply_text,
        "response": reply_text,
        "hasMapAction": has_map,
        "detectedLanguage": detected,
        "language": req_lang,
    }