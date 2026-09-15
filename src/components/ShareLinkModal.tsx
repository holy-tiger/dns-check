import React, { useState } from 'react';
import { X, Link2, Copy, Check, ExternalLink, Globe, Sparkles, CheckCircle2 } from 'lucide-react';
import { SupportedLang } from '../types';
import { translations, tFormat } from '../i18n';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: string[];
  currentLang: SupportedLang;
  customDns?: string;
  timeoutMs?: number;
  onRunTestWithUrl?: (url: string) => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  targets,
  currentLang,
  customDns,
  timeoutMs,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLang>(currentLang);
  const [copied, setCopied] = useState(false);

  // Sync selectedLang if currentLang changes
  React.useEffect(() => {
    setSelectedLang(currentLang);
  }, [currentLang]);

  if (!isOpen) return null;

  const t = translations[currentLang];

  // Construct shareable URL
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://mysite.com';

  const params = new URLSearchParams();
  if (targets.length > 0) {
    params.set('targets', targets.join(','));
  }
  params.set('lang', selectedLang);
  params.set('autostart', '1');

  if (customDns && customDns.trim()) {
    params.set('dns', customDns.trim());
  }
  if (timeoutMs && timeoutMs !== 5000) {
    params.set('timeout', String(timeoutMs));
  }

  const generatedUrl = `${baseUrl}?${params.toString()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpenNow = () => {
    window.location.href = generatedUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.shareLinkModalTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {t.appBadge}
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t.shareLinkModalDesc}
          </p>

          {/* Targets Summary Pill List */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{tFormat(t.totalTestedCount, { total: targets.length })}</span>
              <span className="text-emerald-600 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>autostart=1</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {targets.map((tgt, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs"
                >
                  {tgt}
                </span>
              ))}
            </div>
          </div>

          {/* Language Selector for the link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>测试链接展示语言 (URL 参数: ?lang=)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'zh' as SupportedLang, label: '中文 (zh)' },
                { code: 'en' as SupportedLang, label: 'English (en)' },
                { code: 'ar' as SupportedLang, label: 'العربية (ar)' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedLang(item.code)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    selectedLang === item.code
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generated URL Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              完整测试 URL
            </label>
            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={generatedUrl}
                className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 select-all focus:outline-hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              id="copy-share-link-btn"
              type="button"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{t.linkCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t.copyLink}</span>
                </>
              )}
            </button>

            <button
              id="open-share-link-btn"
              type="button"
              onClick={handleOpenNow}
              className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>{t.openLinkPreview}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
