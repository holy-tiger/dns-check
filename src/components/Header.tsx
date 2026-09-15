import React from 'react';
import { Activity, ShieldCheck, Globe, Wifi, FileText } from 'lucide-react';
import { SupportedLang } from '../types';
import { translations } from '../i18n';

interface HeaderProps {
  currentLang: SupportedLang;
  onLanguageChange: (lang: SupportedLang) => void;
  onOpenLoadModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentLang, onLanguageChange, onOpenLoadModal }) => {
  const t = translations[currentLang];

  const languages: { code: SupportedLang; label: string; flag: string }[] = [
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xs sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {t.appTitle}
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                {t.appBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {onOpenLoadModal && (
            <button
              id="header-load-report-btn"
              type="button"
              onClick={onOpenLoadModal}
              className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors border border-slate-200/80 shadow-2xs"
              title={t.loadReportByIdBtn}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">{t.loadReportByIdBtn}</span>
              <span className="sm:hidden">快照</span>
            </button>
          )}

          {/* Language Switcher dropdown / buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-medium">
            {languages.map((item) => (
              <button
                key={item.code}
                id={`lang-btn-${item.code}`}
                type="button"
                onClick={() => onLanguageChange(item.code)}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                  currentLang === item.code
                    ? 'bg-white text-blue-600 font-semibold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={item.label}
              >
                <span>{item.flag}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
