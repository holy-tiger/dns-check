import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TargetInput } from './components/TargetInput';
import { SummaryStats } from './components/SummaryStats';
import { ResultCard } from './components/ResultCard';
import { DiagnosticReportModal } from './components/DiagnosticReportModal';
import { ShareLinkModal } from './components/ShareLinkModal';
import { UploadReportModal } from './components/UploadReportModal';
import { LoadReportModal } from './components/LoadReportModal';
import { CheckResult, SupportedLang, SavedReport, ReportUploadResponse } from './types';
import { normalizeCheckResult } from './utils/normalizeResult';
import { translations, getInitialLanguage, applyDocumentLanguage, tFormat } from './i18n';
import { Activity, ShieldAlert, WifiOff, FileText, RotateCw, X, Globe, MapPin } from 'lucide-react';

export default function App() {
  const [currentLang, setCurrentLang] = useState<SupportedLang>(() => getInitialLanguage());
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'failed' | 'ok'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalTargets, setShareModalTargets] = useState<string[]>([]);
  const [retestingId, setRetestingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDnsServer, setActiveDnsServer] = useState<string | undefined>(undefined);
  const [currentTimeout, setCurrentTimeout] = useState<number>(5000);
  const [initialTargets, setInitialTargets] = useState<string[]>([]);

  // Snapshot & Report Upload States
  const [snapshotReport, setSnapshotReport] = useState<SavedReport | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [uploadedReportInfo, setUploadedReportInfo] = useState<ReportUploadResponse | null>(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);

  // Avoid running autostart twice
  const hasAutoStartedRef = useRef(false);

  // Sync document lang/dir whenever currentLang changes
  useEffect(() => {
    applyDocumentLanguage(currentLang);
  }, [currentLang]);

  // Handle language switch
  const handleLanguageChange = (newLang: SupportedLang) => {
    setCurrentLang(newLang);
    applyDocumentLanguage(newLang);

    // Update URL param ?lang= without full reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Fetch and restore a saved report by ID
  const loadReportById = async (reportId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}`);
      if (!res.ok) {
        throw new Error(translations[currentLang].reportNotFound);
      }
      const data = await res.json();
      if (data.success && data.report) {
        const rep: SavedReport = data.report;
        const normalizedResults = Array.isArray(rep.results)
          ? rep.results.map((r, i) => normalizeCheckResult(r, i))
          : [];
        setSnapshotReport(rep);
        setResults(normalizedResults);
        setInitialTargets(rep.targets || []);
        setActiveDnsServer(rep.customDns);
        setCurrentTimeout(rep.timeoutMs || 5000);

        // Update URL to match current reportId
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('reportId', rep.id);
          url.searchParams.delete('targets');
          url.searchParams.delete('autostart');
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        throw new Error(translations[currentLang].reportNotFound);
      }
    } catch (err: unknown) {
      console.error('Error restoring report:', err);
      setErrorMessage(err instanceof Error ? err.message : translations[currentLang].reportNotFound);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload current results to server and save as local file
  const handleUploadReport = async () => {
    if (results.length === 0) return;
    setIsUploadingReport(true);
    setErrorMessage(null);
    try {
      const targetsList = results.map((r) => r.inputUrl || r.hostname);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          targets: targetsList,
          customDns: activeDnsServer,
          timeoutMs: currentTimeout,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Upload failed (${res.status})`);
      }

      const uploadData: ReportUploadResponse = await res.json();
      if (uploadData.success) {
        setUploadedReportInfo(uploadData);
        setIsUploadModalOpen(true);
      }
    } catch (err: unknown) {
      console.error('Report upload error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingReport(false);
    }
  };

  // Parse URL query parameters on initial mount and optionally autostart or restore report
  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;

    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang === 'zh' || urlLang === 'en' || urlLang === 'ar') {
      setCurrentLang(urlLang);
      applyDocumentLanguage(urlLang);
    }

    // 1. Check if reportId is passed to restore
    const reportIdParam = urlParams.get('reportId') || urlParams.get('id');
    if (reportIdParam) {
      loadReportById(reportIdParam);
      return;
    }

    // 2. Otherwise check for targets parameter
    const rawTargets = urlParams.get('targets') || urlParams.get('domains') || urlParams.get('urls');
    const rawDns = urlParams.get('dns') || undefined;
    const rawTimeout = urlParams.get('timeout');
    const parsedTimeout = rawTimeout ? parseInt(rawTimeout, 10) : 5000;
    const timeout = !isNaN(parsedTimeout) && parsedTimeout >= 1000 ? parsedTimeout : 5000;

    if (rawTargets) {
      const parsedTargets = rawTargets
        .split(/[,|\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (parsedTargets.length > 0) {
        setInitialTargets(parsedTargets);
        // Autostart immediately since targets were passed in the URL (e.g. shared test link)
        handleBatchCheck(parsedTargets, rawDns, timeout, (urlLang as SupportedLang) || currentLang);
        return;
      }
    }

    // Default first-time load: run demo targets so user immediately sees how it works
    const defaultTargets = [
      'baidu.com',
      'github.com',
      'invalid-domain-notfound-999.xyz',
      'expired.badssl.com',
    ];
    handleBatchCheck(defaultTargets, undefined, 5000, currentLang);
  }, []);

  const handleBatchCheck = async (
    targets: string[],
    customDns?: string,
    timeoutMs: number = 5000,
    langOverride?: SupportedLang
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveDnsServer(customDns);
    setCurrentTimeout(timeoutMs);

    const langToUse = langOverride || currentLang;

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets,
          customDns,
          timeoutMs,
          lang: langToUse,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Service response error (${response.status})`);
      }

      const data = await response.json();
      if (data.results && Array.isArray(data.results)) {
        setResults(data.results.map((r: unknown, i: number) => normalizeCheckResult(r, i)));
      }
    } catch (err: unknown) {
      console.error('Check failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Diagnostic request failed, please check service status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleRetest = async (targetUrl: string) => {
    setRetestingId(targetUrl);
    try {
      const response = await fetch('/api/check-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: targetUrl,
          customDns: activeDnsServer,
          timeoutMs: currentTimeout,
          lang: currentLang,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const normalized = normalizeCheckResult(data.result);
          setResults((prev) =>
            prev.map((item) => (item.inputUrl === targetUrl ? normalized : item))
          );
        }
      }
    } catch (err) {
      console.error('Single retest failed:', err);
    } finally {
      setRetestingId(null);
    }
  };

  const t = translations[currentLang];

  const handleCopySummary = () => {
    const total = results.length;
    const ok = results.filter((r) => r.status === 'ok').length;
    const failed = results.filter((r) => r.status !== 'ok').length;

    let summaryText = `[${t.appTitle}]\n${tFormat(t.totalTestedCount, { total })} | ${t.statusHealthy}: ${ok} | ${t.statusFailed}: ${failed}\n\n`;

    results.forEach((r, idx) => {
      summaryText += `${idx + 1}. ${r.hostname}:${r.port} -> ${r.summary}\n`;
      if (r.errorReason) {
        summaryText += `   ${t.errorReasonLabel}: ${r.errorReason}\n`;
      }
      if (r.solutionSuggestion) {
        summaryText += `   ${t.suggestionLabel}: ${r.solutionSuggestion}\n`;
      }
    });

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dns-check-results-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenShareModal = (targets: string[], customDns?: string, timeoutMs?: number) => {
    setShareModalTargets(targets);
    if (customDns) setActiveDnsServer(customDns);
    if (timeoutMs) setCurrentTimeout(timeoutMs);
    setIsShareModalOpen(true);
  };

  // Filter and search
  const filteredResults = results.filter((r) => {
    // Filter
    if (activeFilter === 'failed' && r.status === 'ok') return false;
    if (activeFilter === 'ok' && r.status !== 'ok') return false;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchHost = r.hostname.toLowerCase().includes(q);
      const matchIp = r.resolvedIp?.toLowerCase().includes(q);
      const matchReason = r.errorReason?.toLowerCase().includes(q);
      const matchSummary = r.summary.toLowerCase().includes(q);
      return matchHost || matchIp || matchReason || matchSummary;
    }

    return true;
  });

  return (
    <div className={`min-h-screen bg-slate-100/60 text-slate-800 antialiased flex flex-col font-sans ${currentLang === 'ar' ? 'rtl' : 'ltr'}`}>
      <Header
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onOpenLoadModal={() => setIsLoadModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Restored Snapshot Banner */}
        {snapshotReport && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {t.snapshotBannerTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-mono font-semibold">
                    {snapshotReport.id}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {tFormat(t.snapshotBannerDesc, {
                    id: snapshotReport.id,
                    time: new Date(snapshotReport.createdAt).toLocaleString(),
                    count: results.length,
                  })}
                </p>

                {snapshotReport.clientInfo && snapshotReport.clientInfo.ip && (
                  <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-500 flex-wrap gap-y-1">
                    <span className="inline-flex items-center space-x-1 font-mono text-slate-700 bg-white/70 px-2 py-0.5 rounded-md border border-indigo-100">
                      <Globe className="w-3 h-3 text-blue-500" />
                      <span>{snapshotReport.clientInfo.ip}</span>
                    </span>
                    {snapshotReport.clientInfo.country && (
                      <span className="inline-flex items-center space-x-1 text-slate-700 bg-white/70 px-2 py-0.5 rounded-md border border-indigo-100">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span>
                          {snapshotReport.clientInfo.country}
                          {snapshotReport.clientInfo.region && snapshotReport.clientInfo.region !== snapshotReport.clientInfo.country
                            ? ` (${snapshotReport.clientInfo.region})`
                            : ''}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                id="retest-snapshot-btn"
                type="button"
                onClick={() => {
                  handleBatchCheck(snapshotReport.targets, snapshotReport.customDns, snapshotReport.timeoutMs);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t.retestSnapshotBtn}</span>
              </button>

              <button
                id="exit-snapshot-btn"
                type="button"
                onClick={() => {
                  setSnapshotReport(null);
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('reportId');
                    url.searchParams.delete('id');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.exitSnapshotBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Form */}
        <TargetInput
          onCheck={(targets, customDns, timeout) => {
            setSnapshotReport(null);
            handleBatchCheck(targets, customDns, timeout);
          }}
          isLoading={isLoading}
          currentLang={currentLang}
          initialTargets={initialTargets}
          onOpenShareModal={handleOpenShareModal}
        />

        {/* Global Error Notice if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Summary Metric Stats & Filters */}
        <SummaryStats
          results={results}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExport={handleExportJson}
          onCopyReport={handleCopySummary}
          copied={copiedSummary}
          currentLang={currentLang}
          onUploadReport={handleUploadReport}
          isUploadingReport={isUploadingReport}
        />

        {/* Loading Indicator when running */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-blue-200/80 p-8 shadow-xs mb-6 text-center">
            <div className="inline-flex p-3 bg-blue-50 rounded-2xl text-blue-600 mb-3 animate-pulse">
              <Activity className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {t.diagnosingBannerTitle}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t.diagnosingBannerDesc}
            </p>
          </div>
        )}

        {/* Results List */}
        {!isLoading && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                <span>{t.resultsListTitle}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({tFormat(t.showingCount, { current: filteredResults.length, total: results.length })})
                </span>
              </h2>

              <button
                id="view-full-report-btn"
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t.viewMarkdownReport}
              </button>
            </div>

            {filteredResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                <WifiOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>{t.noFilterMatches}</p>
              </div>
            ) : (
              <div>
                {filteredResults.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    onRetest={handleSingleRetest}
                    isRetesting={retestingId === result.inputUrl}
                    currentLang={currentLang}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial Empty State if no results */}
        {!isLoading && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {t.readyToDiagnoseTitle}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {t.readyToDiagnoseDesc}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          {t.footerNote}
        </div>
      </footer>

      {/* Markdown Diagnostic Report Modal */}
      <DiagnosticReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        results={results}
        currentLang={currentLang}
      />

      {/* Shareable Test Link Modal */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        targets={shareModalTargets.length > 0 ? shareModalTargets : initialTargets}
        currentLang={currentLang}
        customDns={activeDnsServer}
        timeoutMs={currentTimeout}
      />

      {/* Uploaded Report Modal */}
      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        reportInfo={uploadedReportInfo}
        currentLang={currentLang}
      />

      {/* Load Report by ID Modal */}
      <LoadReportModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoadReport={(id) => loadReportById(id)}
        currentLang={currentLang}
      />
    </div>
  );
}
