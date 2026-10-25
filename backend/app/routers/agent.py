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

# Provider API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class UserQuery(BaseModel):
    message: str
    context: Optional[Any] = None
    language: Optional[str] = "auto"

# ----------------- DOMAIN & INTENT RESTRICTIONS -----------------

DOMAIN_KEYWORDS = {
    'weather', 'mausam', 'temp', 'temperature', 'taapmaan', 'climate', 'heat', 'heatwave',
    'garmi', 'loo', 'humidity', 'rain', 'baarish', 'barish', 'forecast', 'wind', 'hawa',
    'uv', 'utci', 'wbgt', 'uhi', 'thermal', 'monsoon', 'storm', 'toofan', 'cloud', 'baadal',
    'air quality', 'aqi', 'pollution', 'hawa ki gunwatta',
    'heatstroke', 'stroke', 'sunstroke', 'exhaustion', 'dehydration', 'hydration',
    'ors', 'electrolyte', 'water', 'paani', 'cooling', 'cooler', 'ac', 'dhoop',
    'first aid', 'symptom', 'symptoms', 'lakshan', 'ilaaj', 'treatment', 'curfew', 
    'refuge center', 'sdrf', 'tanker', 'emergency', 'help', 'tips',
    'hotter', 'colder', 'sohna', 'delhi', 'kanpur', 'lucknow', 'mumbai', 'jaipur'
}

# Words that MUST NEVER be searched as cities in Geocoding
NON_CITY_INTENT_WORDS = {
    'heatstroke', 'stroke', 'sunstroke', 'exhaustion', 'symptom', 'symptoms',
    'lakshan', 'ilaaj', 'treatment', 'first', 'aid', 'first-aid', 'firstaid',
    'ors', 'ghol', 'electrolyte', 'hydration', 'water', 'paani', 'recipe',
    'cooling', 'cooler', 'without', 'ac', 'room', 'rooms', 'matka', 'curtain',
    'prevention', 'steps', 'emergency', 'doctor', 'hospital', 'ambulance', '108', '112',
    'tips', 'khatra', 'bachav', 'curfew', 'refuge', 'what', 'are', 'how', 'to', 'make'
}

QUERY_STOPWORDS = {
    'what', 'is', 'the', 'how', 'weather', 'weathwe', 'wether', 'temperature', 'temp', 'in', 'at',
    'for', 'of', 'today', 'tomorrow', 'now', 'forecast', 'please', 'tell', 'me', 'rain',
    'heat', 'heatwave', 'humidity', 'wind', 'kya', 'kiya', 'kaisa', 'kaise', 'hai', 'he',
    'ho', 'hoga', 'hogi', 'ka', 'ke', 'ki', 'ko', 'me', 'mein', 'par', 'se',
    'batao', 'bataiye', 'kitna', 'kitni', 'taapmaan', 'garmi', 'mausam', 'abhi', 'aaj', 'kal',
    'are', 'and', 'can', 'you', 'give', 'details', 'steps'
}

CITY_ALIASES = {
    'guwati': 'Guwahati', 'guwahti': 'Guwahati', 'ghy': 'Guwahati', 'dilli': 'Delhi',
    'nayi dilli': 'New Delhi', 'newdelhi': 'New Delhi', 'bombay': 'Mumbai',
    'calcutta': 'Kolkata', 'bangalore': 'Bengaluru', 'blr': 'Bengaluru',
    'madras': 'Chennai', 'gurgaon': 'Gurugram', 'gurugram': 'Gurugram',
    'sona': 'Sohna', 'sohna': 'Sohna', 'jaypur': 'Jaipur', 'lakhnau': 'Lucknow',
    'lucknow': 'Lucknow', 'banaras': 'Varanasi', 'kashi': 'Varanasi', 'varanasi': 'Varanasi',
    'poona': 'Pune', 'pune': 'Pune', 'hydrabad': 'Hyderabad', 'hyderabad': 'Hyderabad',
    'patna': 'Patna', 'ranchi': 'Ranchi', 'bhopal': 'Bhopal', 'indore': 'Indore',
    'chandigarh': 'Chandigarh', 'shimla': 'Shimla', 'dehradun': 'Dehradun', 'srinagar': 'Srinagar'
}

def is_domain_relevant(query: str) -> bool:
    q_lower = query.lower()
    if re.search(r'(-?\d+\.?\d*)\s*°?\s*[NSns]?\s*,\s*(-?\d+\.?\d*)', q_lower):
        return True
    for kw in DOMAIN_KEYWORDS:
        if kw in q_lower:
            return True
    tokens = [t.strip() for t in re.sub(r'[^\w\s]', ' ', q_lower).split()]
    for t in tokens:
        if t in CITY_ALIASES:
            return True
    return False

def detect_language_preference(text: str) -> str:
    if not text:
        return 'en'
    if re.search(r'[\u0900-\u097F]', text):
        return 'hi'
    q_lower = text.lower()
    hinglish_markers = [
        'kya', 'kaisa', 'kaise', 'kaisi', 'hai', 'he', 'hoga', 'hogi', 'mausam',
        'taapmaan', 'garmi', 'baarish', 'loo', 'aaj', 'kal', 'batao', 'bataiye',
        'kahan', 'kitna', 'kitni', 'paani', 'chahiye', 'khatra', 'bachav', 'ilaaj', 'dhoop'
    ]
    if any(re.search(r'\b' + re.escape(w) + r'\b', q_lower) for w in hinglish_markers):
        return 'hinglish'
    return 'en'

def extract_place_candidate(text: str) -> str:
    lower = text.lower().strip()
    
    # CRITICAL: Agar question health, first-aid, ORS, ya general heat topic ka hai, NEVER extract city!
    for non_city in NON_CITY_INTENT_WORDS:
        if re.search(r'\b' + re.escape(non_city) + r'\b', lower):
            return ""

    cleaned = re.sub(r'[^\w\s]', ' ', lower)
    tokens = [t.strip() for t in cleaned.split() if t.strip() and t.strip() not in QUERY_STOPWORDS and t.strip() not in NON_CITY_INTENT_WORDS]
    if not tokens:
        return ""
    
    raw = " ".join(tokens)
    if raw in CITY_ALIASES:
        return CITY_ALIASES[raw]
    for t in tokens:
        if t in CITY_ALIASES:
            return CITY_ALIASES[t]
            
    # City candidates must be meaningful proper nouns (> 2 letters and not plain words)
    valid = [t for t in tokens if len(t) > 2 and not t.isdigit()]
    return valid[0] if valid else ""

async def geocode_place(name: str) -> Optional[Dict[str, Any]]:
    if not name or len(name) < 2 or name.lower() in NON_CITY_INTENT_WORDS:
        return None
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={name}&count=1&language=en&format=json"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                results = res.json().get("results", [])
                if results:
                    top = results[0]
                    state = f", {top['admin1']}" if top.get("admin1") else ""
                    country = f", {top['country']}" if top.get("country") else ""
                    return {
                        "name": top["name"],
                        "displayName": f"{top['name']}{state}{country}",
                        "lat": top["latitude"],
                        "lng": top["longitude"],
                    }
    except Exception:
        pass
    return None

async def fetch_weather_for_point(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lng}&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&"
        f"daily=temperature_2m_max,temperature_2m_min&timezone=auto"
    )
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                return res.json()
    except Exception as e:
        print(f"[Weather API Warning]: {e}")
    return None

# ----------------- DIRECT REST LLM ENGINE -----------------

async def call_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    # 1. Google Gemini via Official REST API
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"parts": [{"text": user_prompt}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800}
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text")
                        if text_part:
                            return text_part.strip()
        except Exception as e:
            print(f"[Gemini Error]: {e}")

    # 2. Groq (Llama-3.3-70b)
    if GROQ_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.2
                    }
                )
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
        except Exception:
            pass

    return None

# ----------------- INTENT EXPERT KNOWLEDGE FALLBACKS -----------------

def get_expert_medical_fallback(query: str, lang: str) -> Optional[str]:
    q = query.lower()
    is_hi = lang == 'hi'
    is_hing = lang == 'hinglish'

    # 1. Heatstroke Symptoms & First Aid
    if any(k in q for k in ['heatstroke', 'symptom', 'first aid', 'first-aid', 'lakshan', 'ilaaj']):
        if is_hi:
            return (
                "### 🚨 हीटस्ट्रोक (लू लगना): लक्षण एवं आपातकालीन प्राथमिक उपचार\n\n"
                "**मुख्य लक्षण:**\n"
                "• शरीर का तापमान अत्यधिक बढ़ना (104°F या 40°C से ऊपर)\n"
                "• पसीना आना पूरी तरह बंद हो जाना और त्वचा का लाल व सूखा होना\n"
                "• तेज सिरदर्द, चक्कर आना, उल्टी या बेहोशी की स्थिति\n"
                "• नाड़ी (Pulse) का तेज और कमजोर चलना\n\n"
                "**आपातकालीन प्राथमिक उपचार (Immediate First-Aid):**\n"
                "1. **स्थान बदलें:** पीड़ित को तुरंत धूप से हटाकर ठंडी, वातानुकूलित या छायादार जगह पर ले जाएं।\n"
                "2. **शरीर का तापमान घटाएं:** गर्दन, कांख (armpits) और माथे पर ठंडे पानी की पट्टियां या आइस पैक रखें।\n"
                "3. **कपड़े ढीले करें:** तंग कपड़े उतारें या ढीले करें ताकि हवा लग सके।\n"
                "4. **हाइड्रेशन:** यदि व्यक्ति पूरी तरह होश में है, तो घूंट-घूंट करके ठंडा पानी या ओआरएस (ORS) पिलाएं। बेहोशी की हालत में कुछ न पिलाएं।\n"
                "5. **चिकित्सा सहायता:** तुरंत **108** या **112** पर कॉल करके निकटतम अस्पताल ले जाएं।"
            )
        elif is_hing:
            return (
                "### 🚨 Heatstroke Symptoms & Emergency First-Aid Protocols\n\n"
                "**Key Symptoms:**\n"
                "• Body temperature rising above 104°F (40°C)\n"
                "• Lack of sweating; skin feels red, hot, and dry\n"
                "• Severe headache, dizziness, nausea, or confusion\n"
                "• Rapid, shallow breathing and fast pulse rate\n\n"
                "**Immediate First-Aid Steps:**\n"
                "1. **Shift Location:** Patient ko turant direct dhoop se hata kar shaded ya AC/fan wale room me le jayein.\n"
                "2. **Cool Down Rapidly:** Cold wet cloth ya ice packs ko neck, armpits aur forehead par lagayein.\n"
                "3. **Loosen Clothing:** Tight kapde remove karein taaki skin ko air mil sake.\n"
                "4. **Hydrate:** Agar patient conscious hai toh chhota-chhota sip karke cold water ya ORS dein. Unconscious patient ko kuch na pilayein.\n"
                "5. **Emergency Helpline:** Condition serious hone par turant **108** ya **112** par call karein."
            )
        else:
            return (
                "### 🚨 Heatstroke: Critical Symptoms & Immediate First-Aid\n\n"
                "**Prominent Symptoms:**\n"
                "• Core body temperature soaring above **104°F (40°C)**\n"
                "• Cessation of sweating; skin appears flushed, hot, and completely dry\n"
                "• Throbbing headache, nausea, vertigo, delirium, or loss of consciousness\n"
                "• Tachycardia (rapid pulse) and shallow breathing\n\n"
                "**Emergency First-Aid Protocol:**\n"
                "1. **Immediate Relocation:** Move the individual out of sunlight into an air-conditioned room or dense shade.\n"
                "2. **Active External Cooling:** Apply cold compresses or ice packs to high blood-flow zones (neck, armpits, and groin).\n"
                "3. **Fan & Mist:** Spray the body with cool water while fanning continuously to accelerate evaporative cooling.\n"
                "4. **Fluid Administration:** Provide sips of chilled water or oral rehydration salts (ORS) **only** if fully conscious.\n"
                "5. **Emergency Transport:** Heatstroke is a life-threatening medical crisis. Call emergency services (**108 / 112**) immediately."
            )

    # 2. ORS Recipe & Hydration
    if any(k in q for k in ['ors', 'ghol', 'electrolyte', 'recipe']):
        if is_hi:
            return (
                "### 💧 घर पर मानक ओआरएस (ORS) घोल बनाने की विधि (WHO Formula)\n\n"
                "**आवश्यक सामग्री:**\n"
                "• **1 लीटर** साफ, उबला हुआ और ठंडा किया हुआ पानी\n"
                "• **6 छोटी चम्मच (teaspoon)** चीनी\n"
                "• **आधा (1/2) छोटी चम्मच** खाने का नमक\n\n"
                "**बनाने का तरीका:**\n"
                "1. एक साफ बर्तन में 1 लीटर पानी लें।\n"
                "2. इसमें चीनी और नमक डालकर तब तक चम्मच से घोलें जब तक पूरी तरह घुल न जाए।\n"
                "3. **सेवन:** लू या डिहाइड्रेशन में दिनभर में थोड़ा-थोड़ा पिएं। यह 24 घंटे तक उपयोग के लिए सुरक्षित रहता है।"
            )
        else:
            return (
                "### 💧 WHO Standard Home-Made ORS (Oral Rehydration Solution)\n\n"
                "**Exact Ingredients:**\n"
                "• **1 Litre** clean, boiled and cooled drinking water\n"
                "• **6 level teaspoons** of granulated sugar\n"
                "• **1/2 level teaspoon** of standard edible salt\n\n"
                "**Preparation & Usage:**\n"
                "1. Stir the mixture vigorously until all sugar and salt crystals dissolve completely.\n"
                "2. Drink regular small sips throughout periods of heat exposure to replenish sodium and vital electrolytes.\n"
                "3. Discard and prepare a fresh batch after 24 hours."
            )

    # 3. Cooling Room Without AC
    if any(k in q for k in ['cool', 'without ac', 'thanda', 'cooler']):
        if is_hi:
            return (
                "### ❄️ बिना एसी (AC) के कमरा ठंडा रखने के प्रभावी उपाय\n\n"
                "• **पर्दे व शीशे ढकें:** सुबह 9 से शाम 5 बजे तक खिड़कियों पर मोटे पर्दे या खस की चटाई लगाएं ताकि सीधी धूप अंदर न आए।\n"
                "• **क्रॉस वेंटिलेशन:** शाम को जब बाहर की हवा ठंडी हो जाए, तब आमने-सामने की खिड़कियां खोल दें।\n"
                "• **मिट्टी का घड़ा (Matka):** कमरे में गीली मिट्टी के बर्तन या पानी से भरी बाल्टी पंखे के सामने रखें।\n"
                "• **लाइट्स बंद रखें:** गरमाहट पैदा करने वाले पुराने बल्ब बंद रखें और केवल एलईडी (LED) इस्तेमाल करें।"
            )
        else:
            return (
                "### ❄️ Passive Cooling Techniques to Keep Rooms Cool Without AC\n\n"
                "• **Solar Heat Deflection:** Keep heavy reflective curtains or bamboo blinds closed between 9:00 AM and 5:00 PM.\n"
                "• **Night Cross-Ventilation:** Open windows on opposite sides of the room once ambient outside temperatures drop after dusk.\n"
                "• **Evaporative Cooling:** Place a wide bowl of iced water or wet clay pots directly in the airflow path of your ceiling/table fan.\n"
                "• **Thermal Mass Management:** Minimize heat-radiating indoor incandescent lighting and appliances during peak afternoon hours."
            )

    return None

# ----------------- MAIN API ENDPOINT -----------------

@router.post("")
@router.post("/")
async def handle_agent_query(payload: UserQuery):
    user_query = payload.message.strip()
    if not user_query:
        return {"response": "Please specify a weather, heatwave, or thermal safety query."}

    # 1. Guardrail Check
    if not is_domain_relevant(user_query):
        lang = detect_language_preference(user_query)
        if lang == 'hi':
            return {
                "response": (
                    "मैं केवल **मौसम, लू (हीटवेव), तापीय स्वास्थ्य और आपदा प्रबंधन** से जुड़े "
                    "प्रश्नों के उत्तर देने के लिए अधिकृत हूँ। कृपया मौसम, लू के लक्षण या सुरक्षा परामर्श संबंधी प्रश्न पूछें।"
                )
            }
        elif lang == 'hinglish':
            return {
                "response": (
                    "Main sirf **Weather, Heatwaves, Thermal Comfort aur Disaster Safety** "
                    "se related sawalon ke jawab deta hoon. Please mausam ya safety guidelines ke baare me poochiye."
                )
            }
        else:
            return {
                "response": (
                    "I am specialized exclusively in **meteorological telemetry, heatwave risks, and thermal emergency protocols**.\n\n"
                    "Please ask questions related to real-time weather forecasts, heatwave warnings, ORS recipes, or heatstroke precautions."
                )
            }

    target_lang = detect_language_preference(user_query)
    lang_instruction = "English"
    if target_lang == 'hi':
        lang_instruction = "Hindi (Devanagari script only)"
    elif target_lang == 'hinglish':
        lang_instruction = "Hinglish (Conversational Hindi in Roman script)"

    # 2. Check if this is a Medical / Safety Knowledge Query (Heatstroke, ORS, Cooling)
    expert_knowledge = get_expert_medical_fallback(user_query, target_lang)

    # 3. Check for Location Telemetry (ONLY if NOT a health query)
    place_name = extract_place_candidate(user_query)
    weather_context = ""
    resolved_place = None

    if place_name:
        resolved_place = await geocode_place(place_name)
        if resolved_place:
            w_data = await fetch_weather_for_point(resolved_place["lat"], resolved_place["lng"])
            if w_data and "current" in w_data:
                curr = w_data["current"]
                weather_context = (
                    f"Live Satellite Telemetry for {resolved_place['displayName']}:\n"
                    f"- Ambient Temperature: {curr.get('temperature_2m')}°C\n"
                    f"- Apparent Heat (Feels Like): {curr.get('apparent_temperature')}°C\n"
                    f"- Relative Humidity: {curr.get('relative_humidity_2m')}%\n"
                    f"- Wind Velocity: {curr.get('wind_speed_10m')} km/h\n"
                )

    # 4. LLM Prompt Construction
    system_prompt = f"""
You are the Official Climate & Heatwave AI Copilot for the National Thermal Early Warning Platform.

DIRECTIVES:
1. Target Language: {lang_instruction}. (Default to professional English unless user writes Hindi/Hinglish).
2. Domain: Strictly weather, thermal safety, hydration, heatstroke medical first-aid, and municipal directives.
3. Clean Layout: Use clear Markdown with bold headers and spaced bullet points. Never run words together.
"""

    user_prompt = f"User Query: {user_query}\n\n"
    if weather_context:
        user_prompt += f"Verified Ground-Truth Weather Data:\n{weather_context}\n"
    user_prompt += "Provide an insightful, structured response:"

    # 5. Call LLM
    llm_resp = await call_llm(system_prompt, user_prompt)
    if llm_resp:
        return {"response": llm_resp}

    # 6. Fallback Priorities:
    # Priority A: If it was an advisory/health query, return expert medical knowledge
    if expert_knowledge:
        return {"response": expert_knowledge}

    # Priority B: If it was a valid place query, return live weather
    if resolved_place and weather_context:
        curr = w_data["current"]
        return {
            "response": (
                f"### Current Weather Observations for {resolved_place['displayName']}\n\n"
                f"• **Ambient Temperature:** {curr.get('temperature_2m')}°C (Feels like: {curr.get('apparent_temperature')}°C)\n"
                f"• **Relative Humidity:** {curr.get('relative_humidity_2m')}%\n"
                f"• **Wind Speed:** {curr.get('wind_speed_10m')} km/h\n\n"
                f"**Advisory:** Conditions are within regular operational limits. Stay sufficiently hydrated."
            )
        }

    return {
        "response": (
            "Please specify a valid municipal location or ask a heatwave safety question "
            "(e.g., *'Current weather in Sohna'*, *'Home-made ORS recipe'*, or *'Heatstroke first-aid'*)."
        )
    }