import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGES, type LanguageCode } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, currentLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-sm ${
          isOpen ? 'ring-2 ring-rose-500/40 border-rose-500/50 bg-slate-800' : ''
        }`}
        title="Select Application Language"
        aria-label="Select Application Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="font-sans text-xs font-bold text-white whitespace-nowrap">
          {currentLanguageOption.name}
        </span>
        <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 font-sans">
          ({currentLanguageOption.nativeName})
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-rose-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-60 max-h-80 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            Select Language (भाषा)
          </div>

          <div className="pt-1">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-slate-200 font-medium truncate">{lang.name}</span>
                    <span className="text-[11px] text-slate-400 truncate">({lang.nativeName})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
