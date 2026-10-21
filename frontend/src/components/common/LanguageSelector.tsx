import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGES, type LanguageCode } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'sidebar';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'full',
  className = '',
}) => {
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

  const isSidebar = variant === 'sidebar';
  const isCompact = variant === 'compact';

  return (
    <div className={`relative shrink-0 ${isOpen ? 'z-50' : ''} ${className}`} ref={dropdownRef} data-no-translate="true">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#181920] border border-white/[0.08] hover:border-amber-500/40 text-slate-200 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-sm active:scale-95 ${
          isOpen ? 'ring-2 ring-amber-500/40 border-amber-500/60 bg-[#20222a]' : ''
        } ${isSidebar ? 'w-full justify-between' : ''}`}
        title="Change Language / भाषा बदलें"
        aria-label="Select Application Language"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="text-sm shrink-0">{currentLanguageOption.flag}</span>
          <span className="font-sans text-xs font-bold text-white whitespace-nowrap">
            {currentLanguageOption.nativeName}
          </span>
          {!isCompact && !isSidebar && (
            <span className="hidden md:inline-block text-[11px] font-medium text-slate-400 font-sans">
              ({currentLanguageOption.name})
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            isSidebar ? 'bottom-full mb-2 left-0 w-full' : 'top-full mt-2 right-0 sm:right-0 sm:left-auto'
          } w-64 max-h-84 overflow-y-auto rounded-2xl bg-[#181920]/98 backdrop-blur-xl border border-white/[0.1] shadow-2xl z-[100] p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 card-highlight-rim scrollbar-thin scrollbar-thumb-white/10`}
        >
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.06] flex items-center justify-between">
            <span>Select Language / भाषा चुनें</span>
            <Globe className="w-3.5 h-3.5 text-sky-400" />
          </div>

          <div className="pt-1 space-y-0.5">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  type="button"
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-base shrink-0">{lang.flag}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-100 font-medium text-xs truncate">
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans truncate">
                        {lang.name}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="flex items-center space-x-1 text-[10px] text-amber-400 font-mono font-bold shrink-0 ml-2">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
