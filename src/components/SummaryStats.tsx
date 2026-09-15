import React from 'react';
import { CheckCircle2, AlertOctagon, Clock, Search, Download, Copy, Check, CloudUpload } from 'lucide-react';
import { CheckResult, SupportedLang } from '../types';
import { translations, tFormat } from '../i18n';

interface SummaryStatsProps {
  results: CheckResult[];
  activeFilter: 'all' | 'failed' | 'ok';
  onFilterChange: (filter: 'all' | 'failed' | 'ok') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExport: () => void;
  onCopyReport: () => void;
  copied: boolean;
  currentLang: SupportedLang;
  onUploadReport?: () => void;
  isUploadingReport?: boolean;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  results,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onExport,
  onCopyReport,
  copied,
  currentLang,
  onUploadReport,
  isUploadingReport,
}) => {
  if (results.length === 0) return null;

  const t = translations[currentLang];

  const total = results.length;
  const okCount = results.filter((r) => r.status === 'ok').length;
  const failedCount = results.filter((r) => r.status === 'error' || r.status === 'warning').length;
  const validTimes = results.filter((r) => r.totalTimeMs > 0).map((r) => r.totalTimeMs);
  const avgTime = validTimes.length > 0 ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 mb-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            {t.totalTargets}
          </span>
          <div className="text-xl font-bold text-slate-800 font-mono">{total}</div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3">
          <span className="text-xs text-emerald-700 font-medium block mb-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.statusHealthy}</span>
          </span>
          <div className="text-xl font-bold text-emerald-700 font-mono">{okCount}</div>
        </div>

        <div className={`rounded-xl p-3 border transition-colors ${
          failedCount > 0
            ? 'bg-rose-50/70 border-rose-200 text-rose-700'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <span className="text-xs font-medium block mb-1 flex items-center space-x-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{t.statusFailed}</span>
          </span>
          <div className="text-xl font-bold font-mono">{failedCount}</div>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-3">
          <span className="text-xs text-blue-700 font-medium block mb-1 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.avgDuration}</span>
          </span>
          <div className="text-xl font-bold text-blue-800 font-mono">{avgTime} ms</div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            <button
              id="filter-all-btn"
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {tFormat(t.filterAll, { count: total })}
            </button>
            <button
              id="filter-failed-btn"
              type="button"
              onClick={() => onFilterChange('failed')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'failed'
                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                  : 'text-rose-700 hover:bg-rose-100/50'
              }`}
            >
              {tFormat(t.filterFailed, { count: failedCount })}
            </button>
            <button
              id="filter-ok-btn"
              type="button"
              onClick={() => onFilterChange('ok')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'ok'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-emerald-700 hover:bg-emerald-100/50'
              }`}
            >
              {tFormat(t.filterOk, { count: okCount })}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-filter-input"
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            id="copy-report-btn"
            type="button"
            onClick={onCopyReport}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
            title={t.copyReport}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.copyReport}</span>
              </>
            )}
          </button>

          <button
            id="export-report-btn"
            type="button"
            onClick={onExport}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
            title={t.exportJson}
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.exportJson}</span>
          </button>

          {onUploadReport && (
            <button
              id="upload-report-stats-btn"
              type="button"
              onClick={onUploadReport}
              disabled={isUploadingReport}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors shrink-0 shadow-2xs disabled:opacity-50"
              title={t.uploadReportBtn}
            >
              <CloudUpload className="w-3.5 h-3.5 text-blue-600" />
              <span>{isUploadingReport ? t.uploadingReport : t.uploadReportBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
