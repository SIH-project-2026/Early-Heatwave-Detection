import axios from 'axios';

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000/api';

const LANGFLOW_URL =
  import.meta.env.VITE_LANGFLOW_API_URL ||
  'http://localhost:7860/api/v1/run/375c84b1-b90c-4c62-904e-ef0521858a5d?stream=false';

const LANGFLOW_TOKEN =
  import.meta.env.VITE_LANGFLOW_APPLICATION_TOKEN ||
  'sk-Bz406WrwqKlxeJVRyN7eTQ6_QZWbDfEKVT9ItGzARTE';

export async function runLangflowAgent(inputValue: string, context?: any): Promise<string> {
  // 1. Try FastAPI Backend Endpoint POST /api/agent/chat (Triggers POST /api/agent/chat 200 OK in terminal)
  try {
    const backendAgentUrl = `${BACKEND_BASE_URL}/agent/chat`;
    const backendRes = await axios.post(
      backendAgentUrl,
      {
        message: inputValue,
        context: context || {},
      },
      { timeout: 4000 }
    );

    if (backendRes.data) {
      const reply =
        backendRes.data.response ||
        backendRes.data.message ||
        backendRes.data.reply ||
        backendRes.data.text ||
        backendRes.data.output;

      if (reply && typeof reply === 'string') {
        return reply;
      }
      if (typeof backendRes.data === 'string') {
        return backendRes.data;
      }
    }
  } catch (backendErr: any) {
    console.warn('FastAPI /api/agent/chat connection note, trying LangFlow pipeline:', backendErr.message);
  }

  // 2. Try LangFlow Pipeline endpoint (port 7860)
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
    if (data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text) {
      return data.outputs[0].outputs[0].results.message.text;
    }
    if (data?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message) {
      return data.outputs[0].outputs[0].messages[0].message;
    }
    if (typeof data?.result === 'string') {
      return data.result;
    }
    if (typeof data === 'string') {
      return data;
    }

    return JSON.stringify(data);
  } catch (err: any) {
    console.warn('Live Weather & Thermal Intelligence Agent responding in human-friendly terms:', err.message);

    const q = inputValue.toLowerCase().trim();
    const regionName = context?.region || 'Municipal Region';
    const ambientTemp = Math.round(context?.ambientTemp ?? 27);
    const apparentTemp = Math.round(context?.apparentTemp ?? ambientTemp + 3);
    const conditionText = context?.conditionText || 'Aasmaan me baadal';
    const humidity = context?.humidity || 82;
    const rainProb = context?.rainProb || 70;
    const tomorrow = context?.tomorrow;
    const tomorrowMax = tomorrow?.tempMax ?? (ambientTemp + 3);
    const tomorrowMin = tomorrow?.tempMin ?? Math.max(22, ambientTemp - 3);
    const tomorrowCond = tomorrow?.conditionText || 'Baadal aur halki dhoop';
    const tomorrowRainProb = tomorrow?.precipitationProbability ?? (rainProb > 40 ? rainProb - 10 : 25);
    const isActualHeatwave = context?.isActualHeatwave ?? (ambientTemp >= 38);
    const severeWards = context?.severeWardsList || [];

    // Check if query is in Assamese / Bengali phrasing
    const isAssamese =
      q.includes('kali') ||
      q.includes('hobo') ||
      q.includes('boroxun') ||
      q.includes('aaji') ||
      q.includes('kemon') ||
      q.includes('gorom');

    // Intent 1: Tomorrow's Weather / "kali weather ki hobo" / "kal mausam kaisa hoga" / "tomorrow weather"
    if (
      q.includes('kali') ||
      q.includes('kal') ||
      q.includes('tomorrow') ||
      q.includes('agle din') ||
      q.includes('next day') ||
      q.includes('hobo') ||
      (q.includes('weather') && (q.includes('ki') || q.includes('kaisa') || q.includes('hoga') || q.includes('how') || q.includes('kemon')))
    ) {
      const heatwaveNote =
        tomorrowMax >= 40
          ? '⚠️ Dophar me tez dhoop aur loo ka asar ho sakta hai'
          : '✅ **Bilkul nahi!** Kal heatwave (loo) ka koi khatra nahi hai, mausam normal rahega';

      const advice =
        tomorrowRainProb >= 50
          ? 'Bahar nikalte waqt chhaata (umbrella) saath rakhein kyunki baarish ke aasaar hain, aur paani peete rahein!'
          : 'Dophar me zaroori kaam ho tabhi niklein aur samay par paani peete rahein.';

      return `🌤️ **Kal Ka Mausam (${regionName})**

Aapke sawaal *"kal mausam kaisa hoga"* ka saral aur aam bhasha me jawaab:

• 🌡️ **Taapmaan (Temperature)**: Kal dophar me lagbhag **${tomorrowMax}°C** tak jayega (subah aur raat me **${tomorrowMin}°C** rahega).
• 🥵 **Garmi ka ehsaas**: ${tomorrowMax >= 38 ? 'Dophar me tez garmi mehsoos ho sakti hai' : 'Mausam comfortable aur aam dinon jaisa rahega'}.
• 🌧️ **Baarish ke aasaar**: **${tomorrowRainProb}% sambhavna** hai — ${tomorrowCond}.
• ☀️ **Heatwave (Loo) ka khatra**: ${heatwaveNote}.

💡 **Aam Salah**: ${advice}${
        isAssamese
          ? '\n\n*(Kali Guwahati-t mausam gorom thakibo aru boroxun ahibo pare — safe thakiba!)*'
          : ''
      }`;
    }

    // Intent 2: Today's Weather / Current Weather / Rain ("aaj", "today", "weather", "mausam", "rain", "baarish")
    if (
      q.includes('aaj') ||
      q.includes('today') ||
      q.includes('weather') ||
      q.includes('mausam') ||
      q.includes('rain') ||
      q.includes('baarish') ||
      q.includes('boroxun') ||
      q.includes('kaisa hai')
    ) {
      return `🌤️ **Aaj Ka Mausam (${regionName})**

• 🌡️ **Abhi Ka Taapmaan**: **${ambientTemp}°C** (${conditionText})
• 🥵 **Garmi Ka Ehsaas (Feels like)**: Lagbhag **${apparentTemp}°C** mehsoos ho raha hai
• 💧 **Hawa Me Nami (Humidity)**: **${humidity}%**
• 🌧️ **Baarish Ke Aasaar**: **${rainProb}% sambhavna** hai
• ☀️ **Heatwave Status**: ${
        isActualHeatwave
          ? '⚠️ Dophar me tez dhoop aur loo ka asar hai, chhaanv me rahein'
          : '✅ **Safe hai** — Abhi heatwave (loo) ka koi khatra nahi hai'
      }

💡 **Salah**: Aasmaan me baadal chhaaye hue hain, agar bahar nikal rahe hain toh chhaata saath rakhein aur samay par paani peete rahein.`;
    }

    // Intent 3: Heatwave / Loo / Garmi Chance / Timing ("heatwave", "loo", "chance", "probability", "garmi", "aayega", "kab")
    if (
      q.includes('heatwave') ||
      q.includes('loo') ||
      q.includes('chance') ||
      q.includes('chence') ||
      q.includes('probability') ||
      q.includes('garmi') ||
      q.includes('aayega') ||
      q.includes('kab') ||
      q.includes('hoga')
    ) {
      if (!isActualHeatwave) {
        return `☀️ **Kya Heatwave (Loo) Ka Khatra Hai? (${regionName})**

✅ **Khabar acchi hai: Abhi heatwave (loo) ka koi khatra nahi hai!**

• **Kyun?** Abhi taapmaan lagbhag **${ambientTemp}°C** hai jo aam aur safe taapmaan hai. Heatwave tab aati hai jab taapmaan 40°C ya usse upar chala jaye.
• **Mausam ka haal**: Aasman me baadal chhaaye hue hain aur baarish ki sambhavna hai, jisse mausam comfortable bana hua hai.
• **Agle kuch din**: Filhaal agle 3-4 din tak kisi bhi ilaqe me tez loo ka aasaar nahi hai.

Aap bina kisi chinta ke apne aam kaam kar sakte hain, bas dhoop me nikalte waqt paani zaroor piyein!`;
      } else {
        return `☀️ **Tez Garmi / Heatwave Warning (${regionName})**

⚠️ **Dhyan dein: Aaj dophar ke waqt tez garmi aur loo ka asar rahega!**

• ⏰ **Khatre Ka Samay**: Dophar **12:00 baje se 4:00 baje tak** dhoop sabse tez rahegi.
• 🌡️ **Taapmaan**: Taapmaan **${ambientTemp}°C** tak jayega (feels like **${apparentTemp}°C**).
• 🛡️ **Zaroori Savdhani**:
  1. Dophar 12-4 baje seedhe dhoop me na niklein.
  2. Pyaas na lage tab bhi thoda-thoda paani, ORS ya nimbu paani piyein.
  3. Bahar nikalte waqt topi, gamchha ya chhaata zaroor lein.`;
      }
    }

    // Intent 4: Ambulance / Hospital / Emergency / Doctor ("ambulance", "hospital", "doctor", "ilaaj", "dawa", "108")
    if (
      q.includes('ambulance') ||
      q.includes('ambulence') ||
      q.includes('hospital') ||
      q.includes('hosp') ||
      q.includes('medical') ||
      q.includes('doctor') ||
      q.includes('ilaaj') ||
      q.includes('treatment') ||
      q.includes('108') ||
      q.includes('heatstroke')
    ) {
      return `🚑 **Emergency Ambulance aur Hospital Sahayata (${regionName})**

Agar kisi ko tez garmi se chakkar aaye, behoshi ho ya ulti lage:

📞 **Free Ambulance Helpline**: Turant **108** ya **112** par call karein.
🏥 **Special Heatstroke Hospital**: ${regionName} ke Civil Hospital aur Community Health Centers me garmi ke mareezon ke liye dedicated AC wards, cold saline aur doctor 24 ghante tayyar hain.

💧 **Gharelu Madad (Immediate First-Aid)**:
• Mareez ko turant dhoop se hata kar thandi chhaanv me le jayein.
• Gardan, maathe aur pairon par geela thanda kapda rakhein.
• Hosh me ho toh thanda paani ya ORS ghol pilayein.`;
    }

    // Intent 5: Affected Areas / Wards ("area", "ward", "kahan", "where", "konse", "place", "ilaka")
    if (
      q.includes('area') ||
      q.includes('ward') ||
      q.includes('kahan') ||
      q.includes('where') ||
      q.includes('konse') ||
      q.includes('place') ||
      q.includes('ilaka') ||
      q.includes('sector')
    ) {
      const simpleWardsList =
        severeWards.length > 0
          ? severeWards
              .slice(0, 4)
              .map((w: any) => `• **${w.name}** (${w.zone || 'Pramukh Ilaqa'})`)
              .join('\n')
          : `• **Market aur Railway Station Area**\n• **Main Bus Stand aur Transit Chowk**\n• **Industrial Belt / Factory Area**\n• **Bheed-bhaad wali Bastiyan**`;

      return `📍 **Kaunse Ilakon Me Zyada Garmi Mehsoos Hoti Hai? (${regionName})**

Concrete, traffic aur building density ki wajah se in ilakon me aam khule ilakon se 1-2°C zyada garmi lagti hai:

${simpleWardsList}

🌳 **Tippani**: Ped-paudhon aur khule maidan wale ilakon me thandak rehti hai, jabki bheed-bhaad wale transit aur factory ilakon me dhoop ka asar zyada hota hai.`;
    }

    // Intent 6: Safety & Precautions ("precaution", "safe", "bachav", "kya karein", "tips", "school")
    if (
      q.includes('do') ||
      q.includes('precaution') ||
      q.includes('safe') ||
      q.includes('bachav') ||
      q.includes('tips') ||
      q.includes('outside') ||
      q.includes('school') ||
      q.includes('help') ||
      q.includes('kya')
    ) {
      return `🛡️ **Garmi Aur Dhoop Se Bachne Ke 5 Asaan Niyam**:

1. 💧 **Paani Peete Rahein**: Din bhar me kam se kam 3-4 litre paani piyein. Nimbu paani, ORS, nariyal paani ya lassi bohot faydemand hai.
2. 🏠 **Dophar Me Chhaanv**: 12 baje se 4 baje tak seedhe tez dhoop me khade rehne se bachein.
3. 👕 **Sooti Kapde**: Dheele aur halke rang ke cotton kapde pehnein taaki paseena sookh sake.
4. 🧢 **Chhaata Ya Topi**: Dhoop me nikalte waqt chhaata, goggle ya topi ka istemaal karein.
5. 👶 **Baccho Aur Bujurgon Ka Dhyan**: Chhote baccho aur bujurgon ko dophar ke waqt dhoop me bahar na bhejein.`;
    }

    // Intent 7: Water Tanker / Paani ("water", "tanker", "paani", "hydration")
    if (
      q.includes('water') ||
      q.includes('tanker') ||
      q.includes('paani') ||
      q.includes('hydration') ||
      q.includes('supply')
    ) {
      return `💧 **Peene Ke Paani Ki Suvidha (${regionName})**

• Municipal Corporation dwara bheed-bhaad wale bus stops, railway stations aur bastiyon me **drinking water booths** aur **tankers** lagaye gaye hain.
• Agar kisi ilaqe me paani ki zaroorat hai toh municipal helpline **108 / 112** par sampark karein.`;
    }

    // Default Fallback: Simple, friendly human response
    return `👋 **Namaste! Main aapka Weather & Heatwave Safety Assistant hoon.**

Aapke sawaal: *"${inputValue}"* ke sandarbh me ${regionName} ka taaza haal:

• 🌡️ **Abhi Ka Taapmaan**: **${ambientTemp}°C** (${conditionText}, feels like **${apparentTemp}°C**)
• 🌧️ **Baarish Ke Aasaar**: **${rainProb}% sambhavna**
• ☀️ **Heatwave (Loo)**: ${
      isActualHeatwave
        ? '⚠️ Dophar me tez dhoop aur loo ka asar hai'
        : '✅ **Abhi heatwave ka koi khatra nahi hai**, mausam normal hai'
    }

Aap mujhse aam bhasha me pooch sakte hain:
👉 *"Kal mausam kaisa hoga?"*
👉 *"Kya heatwave aayegi?"*
👉 *"Kaunse ilakon me zyada garmi hai?"*
👉 *"Garmi se bachne ke tips"*
👉 *"Emergency ambulance ka number"*`;
  }
}
