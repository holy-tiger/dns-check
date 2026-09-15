import React, { useState, useEffect } from 'react';
import { X, FileText, Search, Clock, CheckCircle2, AlertOctagon, ArrowRight, Loader2, RefreshCw, Globe, MapPin } from 'lucide-react';
import { SupportedLang } from '../types';
import { translations, tFormat } from '../i18n';

interface ReportSummaryItem {
  id: string;
  createdAt: number;
  targets: string[];
  total: number;
  okCount: number;
  failedCount: number;
  avgTimeMs: number;
  clientInfo?: {
    ip?: string;
    country?: string;
    region?: string;
  };
}

interface LoadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadReport: (reportId: string) => void;
  currentLang: SupportedLang;
}

export const LoadReportModal: React.FC<LoadReportModalProps> = ({
  isOpen,
  onClose,
  onLoadReport,
  currentLang,
}) => {
  const [inputId, setInputId] = useState('');
  const [recentReports, setRecentReports] = useState<ReportSummaryItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const t = translations[currentLang];

  const fetchRecentReports = async () => {
    setLoadingList(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setRecentReports(data.reports);
      }
    } catch {
      setErrorMsg('Failed to load recent reports');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecentReports();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputId.trim();
    if (!cleanId) return;
    onLoadReport(cleanId);
    onClose();
  };

  const handleSelectReport = (id: string) => {
    onLoadReport(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.loadReportModalTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {t.loadReportModalDesc}
              </p>
            </div>
          </div>
          <button
            id="close-load-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Manual ID Input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="manual-report-id-input"
                type="text"
                placeholder={t.inputReportIdPlaceholder}
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <button
              id="submit-load-id-btn"
              type="submit"
              disabled={!inputId.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
            >
              <span>{t.loadBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Recent Reports List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.recentReportsTitle}</span>
              </label>
              <button
                id="refresh-reports-list-btn"
                type="button"
                onClick={fetchRecentReports}
                disabled={loadingList}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 p-1 rounded-md"
              >
                <RefreshCw className={`w-3 h-3 ${loadingList ? 'animate-spin' : ''}`} />
                <span>刷新</span>
              </button>
            </div>

            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>{t.loadingReportData}</span>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {t.noRecentReports}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {recentReports.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => handleSelectReport(rep.id)}
                    className="p-3 bg-white hover:bg-indigo-50/50 border border-slate-200 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 group hover:border-indigo-200 hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-800 group-hover:text-indigo-600">
                          {rep.id}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rep.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {rep.targets.slice(0, 3).map((tgt, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono text-slate-600"
                          >
                            {tgt}
                          </span>
                        ))}
                        {rep.targets.length > 3 && (
                          <span className="text-[11px] text-slate-400 self-center">
                            +{rep.targets.length - 3}
                          </span>
                        )}

                        {rep.clientInfo && rep.clientInfo.ip && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[10px] font-mono text-blue-700">
                            <Globe className="w-2.5 h-2.5 text-blue-500" />
                            <span>{rep.clientInfo.ip}</span>
                            {rep.clientInfo.country && (
                              <span className="text-blue-500 font-sans font-normal ml-0.5">
                                · {rep.clientInfo.country}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center space-x-1 font-mono font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{rep.okCount}</span>
                        </span>
                        {rep.failedCount > 0 && (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md flex items-center space-x-1 font-mono font-semibold">
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                            <span>{rep.failedCount}</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 transition-colors"
                      >
                        {t.loadBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            id="close-load-modal-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
