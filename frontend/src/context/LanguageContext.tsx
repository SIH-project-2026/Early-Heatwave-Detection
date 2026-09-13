import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'bn'
  | 'mr'
  | 'te'
  | 'ta'
  | 'gu'
  | 'as'
  | 'kn'
  | 'or'
  | 'ml';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export const TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  dashboard: {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    bn: 'ড্যাশবোর্ড',
    mr: 'डॅशबोर्ड',
    te: 'డాష్‌బోర్డ్',
    ta: 'டாஷ்போர்டு',
    gu: 'ડેશબોર્ડ',
    as: 'ডেশ্ববৰ্ড',
    kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    or: 'ଡ୍ୟାସବୋର୍ଡ',
    ml: 'ഡാഷ്‌ബോർഡ്',
  },
  heatRiskMap: {
    en: 'Heat Risk Map',
    hi: 'हीट रिस्क मैप',
    bn: 'হিট রিস্ক ম্যাপ',
    mr: 'उष्णता धोका नकाशा',
    te: 'హీట్ రిస్క్ మ్యాప్',
    ta: 'வெப்ப அபாய வரைபடம்',
    gu: 'હીટ રિસ્ક નકશો',
    as: 'হিট ৰিস্ক মেপ',
    kn: 'ಹೀಟ್ ರಿಸ್ಕ್ ಮ್ಯಾಪ್',
    or: 'ହିଟ୍ ରିସ୍କ ମାନଚିତ୍ର',
    ml: 'ഹീറ്റ് റിസ്ക് മാപ്പ്',
  },
  analytics: {
    en: 'Analytics',
    hi: 'एनालिटिक्स',
    bn: 'অ্যানালিটিক্স',
    mr: 'विश्लेषण',
    te: 'విశ్లేషణ',
    ta: 'பகுப்பாய்வு',
    gu: 'વિશ્લેષણ',
    as: 'বিশ্লেষণ',
    kn: 'ವಿಶ್ಲೇಷಣೆ',
    or: 'ବିଶ୍ଳେଷଣ',
    ml: 'അനലിറ്റിക്സ്',
  },
  emergencyResources: {
    en: 'Emergency Resources',
    hi: 'आपातकालीन संसाधन',
    bn: 'জরুরি সংস্থান',
    mr: 'आपत्कालीन संसाधने',
    te: 'అత్యవసర వనరులు',
    ta: 'அவசர வளங்கள்',
    gu: 'કટોકટી સંસાધનો',
    as: 'জৰুৰী সম্পদ',
    kn: 'ತುರ್ತು ಸಂಪನ್ಮೂಲಗಳು',
    or: 'ଜରୁରୀକାଳୀନ ସମ୍ବଳ',
    ml: 'അടിയന്തര വിഭവങ്ങൾ',
  },
  alerts: {
    en: 'Alerts',
    hi: 'अलर्ट',
    bn: 'সতর্কতা',
    mr: 'इशारे',
    te: 'హెచ్చరికలు',
    ta: 'எச்சரிக்கைகள்',
    gu: 'ચેતવણીઓ',
    as: 'সতৰ্কবাৰ্তা',
    kn: 'ಎಚ್ಚರಿಕೆಗಳು',
    or: 'ସତର୍କତା',
    ml: 'മുന്നറിയിപ്പുകൾ',
  },
  settings: {
    en: 'Settings',
    hi: 'सेटिंग्स',
    bn: 'সেটিংস',
    mr: 'सेटिंग्ज',
    te: 'సెట్టింగ్‌లు',
    ta: 'அமைப்புகள்',
    gu: 'સેટિંગ્સ',
    as: 'ছেটিংছ',
    kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    or: 'ସେଟିଙ୍ଗ୍ସ',
    ml: 'ക്രമീകരണങ്ങൾ',
  },
  askAi: {
    en: 'ASK AI',
    hi: 'एआई से पूछें',
    bn: 'এআই কে জিজ্ঞাসা করুন',
    mr: 'एआय ला विचारा',
    te: 'AI ని అడగండి',
    ta: 'AI-யிடம் கேளுங்கள்',
    gu: 'AI ને પૂછો',
    as: 'AI ক সোধক',
    kn: 'AI ಕೇಳಿ',
    or: 'AI ପଚାରନ୍ତୁ',
    ml: 'AI-യോട് ചോദിക്കുക',
  },
  askAiAgent: {
    en: 'Ask AI Agent',
    hi: 'एआई एजेंट से पूछें',
    bn: 'এআই এজেন্টকে জিজ্ঞাসা করুন',
    mr: 'एआय एजंटला विचारा',
    te: 'AI ఏజెంట్‌ను అడగండి',
    ta: 'AI முகவரிடம் கேளுங்கள்',
    gu: 'AI એજન્ટને પૂછો',
    as: 'AI এজেণ্টক সোধক',
    kn: 'AI ಏಜೆಂಟ್ ಕೇಳಿ',
    or: 'AI ଏଜେଣ୍ଟଙ୍କୁ ପଚାରନ୍ତୁ',
    ml: 'AI ഏജന്റിനോട് ചോദിക്കുക',
  },
  systemOperational: {
    en: 'SYSTEM OPERATIONAL',
    hi: 'सिस्टम सक्रिय',
    bn: 'সিস্টেম সক্রিয়',
    mr: 'प्रणाली कार्यरत',
    te: 'సిస్టమ్ యాక్టివ్',
    ta: 'கணினி இயங்குகிறது',
    gu: 'સિસ્ટમ સક્રિય',
    as: 'ব্যৱস্থা সক্ৰিয়',
    kn: 'ವ್ಯವಸ್ಥೆ ಸಕ್ರಿಯ',
    or: 'ସିଷ୍ଟମ ସକ୍ରିୟ',
    ml: 'സിസ്റ്റം പ്രവർത്തിക്കുന്നു',
  },
  selectLanguage: {
    en: 'Select Language',
    hi: 'भाषा चुनें',
    bn: 'ভাষা নির্বাচন করুন',
    mr: 'भाषा निवडा',
    te: 'భాషను ఎంచుకోండి',
    ta: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    gu: 'ભાષા પસંદ કરો',
    as: 'ভাষা বাছক',
    kn: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    or: 'ଭାଷା ବାଛନ୍ତୁ',
    ml: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
  },
  navigationMenu: {
    en: 'Navigation Menu',
    hi: 'नेविगेशन मेनू',
    bn: 'নেভিগেশন মেনু',
    mr: 'नेव्हिगेशन मेनू',
    te: 'నావిగేషన్ మెను',
    ta: 'வழிசெலுத்தல் மெனு',
    gu: 'નેવિગેશન મેનૂ',
    as: 'নেভিগেচন মেনু',
    kn: 'ನ್ಯಾವಿಗೇಷನ್ ಮೆನು',
    or: 'ନେଭିଗେସନ୍ ମେନୁ',
    ml: 'നാവിഗേഷൻ മെനു',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageOption: LanguageOption;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('app_language') as LanguageCode;
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch {
      // Ignore
    }
  };

  const currentLanguageOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const t = (key: string): string => {
    if (TRANSLATIONS[key] && TRANSLATIONS[key][language]) {
      return TRANSLATIONS[key][language];
    }
    if (TRANSLATIONS[key] && TRANSLATIONS[key]['en']) {
      return TRANSLATIONS[key]['en'];
    }
    return key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLanguageOption, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
