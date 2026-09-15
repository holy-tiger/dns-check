import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Sparkles, SlidersHorizontal, Server, Clock, Link2 } from 'lucide-react';
import { SupportedLang } from '../types';
import { translations, tFormat } from '../i18n';

interface TargetInputProps {
  onCheck: (targets: string[], customDns: string | undefined, timeoutMs: number) => void;
  isLoading: boolean;
  currentLang: SupportedLang;
  initialTargets?: string[];
  onOpenShareModal: (targets: string[], customDns?: string, timeoutMs?: number) => void;
}

export const TargetInput: React.FC<TargetInputProps> = ({
  onCheck,
  isLoading,
  currentLang,
  initialTargets,
  onOpenShareModal,
}) => {
  const [inputText, setInputText] = useState(
    initialTargets && initialTargets.length > 0
      ? initialTargets.join('\n')
      : 'baidu.com\ngithub.com\ninvalid-domain-notfound-999.xyz\nexpired.badssl.com'
  );

  // Sync if initialTargets updates
  useEffect(() => {
    if (initialTargets && initialTargets.length > 0) {
      setInputText(initialTargets.join('\n'));
    }
  }, [initialTargets]);

  const [selectedDns, setSelectedDns] = useState('');
  const [customDnsInput, setCustomDnsInput] = useState('');
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const t = translations[currentLang];

  const PRESET_GROUPS = [
    {
      name: t.presetHealthy,
      description: 'baidu.com, qq.com, github.com, cloudflare.com, 1.1.1.1',
      targets: [
        'baidu.com',
        'qq.com',
        'github.com',
        'cloudflare.com',
        '1.1.1.1',
      ],
    },
    {
      name: t.presetTrouble,
      description: 'invalid-domain-notfound-999.xyz, expired.badssl.com, wrong.host.badssl.com, self-signed.badssl.com, httpbin.org/status/502',
      targets: [
        'baidu.com',
        'invalid-domain-notfound-999.xyz',
        'expired.badssl.com',
        'wrong.host.badssl.com',
        'self-signed.badssl.com',
        'httpbin.org/status/502',
      ],
    },
  ];

  const DNS_OPTIONS = [
    { label: t.dnsDefault, value: '' },
    { label: 'Aliyun DNS (223.5.5.5)', value: '223.5.5.5' },
    { label: 'Tencent DNSPod (119.29.29.29)', value: '119.29.29.29' },
    { label: 'Cloudflare DNS (1.1.1.1)', value: '1.1.1.1' },
    { label: 'Google Public DNS (8.8.8.8)', value: '8.8.8.8' },
    { label: t.dnsCustom, value: 'custom' },
  ];

  const parseTargets = () => {
    return inputText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = parseTargets();
    if (lines.length === 0) return;

    const activeDns = selectedDns === 'custom' ? customDnsInput.trim() : (selectedDns || undefined);
    onCheck(lines, activeDns, timeoutMs);
  };

  const handleOpenShare = () => {
    const lines = parseTargets();
    const activeDns = selectedDns === 'custom' ? customDnsInput.trim() : (selectedDns || undefined);
    onOpenShareModal(lines.length > 0 ? lines : ['baidu.com', 'github.com'], activeDns, timeoutMs);
  };

  const handleApplyPreset = (targets: string[]) => {
    setInputText(targets.join('\n'));
  };

  const handleClear = () => {
    setInputText('');
  };

  const targetsList = parseTargets();
  const lineCount = targetsList.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <label htmlFor="target-input-field" className="block text-sm font-semibold text-slate-800">
              {t.inputTitle}
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.inputSubtitle}
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <button
              id="generate-share-link-top-btn"
              type="button"
              onClick={handleOpenShare}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors shadow-2xs"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{t.generateLinkBtn}</span>
            </button>
            <button
              id="toggle-advanced-btn"
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showAdvanced
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.advancedBtn}</span>
            </button>
            <button
              id="clear-input-btn"
              type="button"
              onClick={handleClear}
              disabled={isLoading || !inputText}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.clearBtn}</span>
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="target-input-field"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.placeholder}
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-800 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-sans"
          />
          <div className="absolute right-3 bottom-3 text-xs text-slate-400 font-mono pointer-events-none">
            {tFormat(t.targetsReadyCount, { count: lineCount })}
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.customDnsLabel}</span>
              </label>
              <select
                id="dns-select"
                value={selectedDns}
                onChange={(e) => setSelectedDns(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {DNS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {selectedDns === 'custom' && (
                <input
                  id="custom-dns-input"
                  type="text"
                  placeholder="e.g. 8.8.4.4 / 208.67.222.222"
                  value={customDnsInput}
                  onChange={(e) => setCustomDnsInput(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.timeoutLabel}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3000, 5000, 10000].map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setTimeoutMs(ms)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      timeoutMs === ms
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {tFormat(t.seconds, { n: ms / 1000 })}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {t.timeoutDesc}
              </p>
            </div>
          </div>
        )}

        {/* Presets and Action */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center">
              <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
              {t.presetLabel}
            </span>
            {PRESET_GROUPS.map((group, idx) => (
              <button
                key={idx}
                id={`preset-btn-${idx}`}
                type="button"
                onClick={() => handleApplyPreset(group.targets)}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200/60"
                title={group.description}
              >
                {group.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 flex-wrap justify-end">
            <button
              id="generate-share-link-bottom-btn"
              type="button"
              onClick={handleOpenShare}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 text-emerald-800 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
            >
              <Link2 className="w-4 h-4 text-emerald-600" />
              <span>{t.generateLinkBtn}</span>
            </button>

            <button
              id="start-detection-btn"
              type="submit"
              disabled={isLoading || lineCount === 0}
              className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.diagnosing}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{tFormat(t.startDetection, { count: lineCount })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
