import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';
import { CheckResult, SupportedLang } from '../types';
import { translations, tFormat } from '../i18n';

interface DiagnosticReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CheckResult[];
  currentLang: SupportedLang;
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({
  isOpen,
  onClose,
  results,
  currentLang,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const t = translations[currentLang];
  const total = results.length;
  const okCount = results.filter((r) => r.status === 'ok').length;
  const failedCount = results.filter((r) => r.status !== 'ok').length;

  const generateMarkdownReport = () => {
    const localeString = currentLang === 'zh' ? 'zh-CN' : currentLang === 'ar' ? 'ar-SA' : 'en-US';
    const lines = [
      `# ${t.appTitle}`,
      `${t.reportTime}: ${new Date().toLocaleString(localeString)}`,
      `${tFormat(t.totalTestedCount, { total })} | ${t.statusHealthy}: ${okCount} | ${t.statusFailed}: ${failedCount}`,
      `----------------------------------------`,
      '',
    ];

    results.forEach((r, idx) => {
      lines.push(`### ${idx + 1}. ${r.hostname} (${r.protocol}://${r.hostname}:${r.port})`);
      lines.push(`- **Status**: ${r.status === 'ok' ? '✅ ' + t.statusHealthy : '❌ ' + t.statusFailed}`);
      lines.push(`- **Summary**: ${r.summary}`);
      lines.push(`- **Time**: ${r.totalTimeMs}ms`);
      if (r.resolvedIp) {
        lines.push(`- **IP**: ${r.resolvedIp}`);
      }
      if (r.errorReason) {
        lines.push(`- **Error**: ${r.errorReason}`);
      }
      if (r.solutionSuggestion) {
        lines.push(`- **Troubleshooting**: ${r.solutionSuggestion}`);
      }
      lines.push(`- **Pipeline**:`);
      if (r.steps?.client?.status && r.steps.client.status !== 'pending') {
        lines.push(`  * ${t.clientStage}: ${r.steps.client.status} (${r.steps.client.timeMs ?? 0}ms)`);
        const probe = r.clientProbe;
        if (probe?.failureMode) {
          const modeText =
            probe.failureMode === 'fast'
              ? t.clientProbeModeFast
              : probe.failureMode === 'timeout'
              ? t.clientProbeModeTimeout
              : t.clientProbeModeUnknown;
          lines.push(`    - ${t.clientProbeFailureMode}: ${modeText}`);
        }
        if (probe?.baseline) {
          lines.push(
            `    - ${t.clientProbeBaselineTitle}: ${
              probe.baseline.ok ? t.clientProbeBaselineOk : t.clientProbeBaselineFailed
            } (${probe.baseline.timeMs}ms)`
          );
        }
      }
      lines.push(`  * ${t.dnsStage}: ${r.steps?.dns?.status ?? 'pending'} (${r.steps?.dns?.timeMs ?? 0}ms)`);
      lines.push(`  * ${t.tcpStage}: ${r.steps?.tcp?.status ?? 'pending'} (${r.steps?.tcp?.timeMs ?? 0}ms)`);
      lines.push(`  * ${t.tlsStage}: ${r.steps?.tls?.status ?? 'pending'} (${r.steps?.tls?.timeMs ?? 0}ms)`);
      lines.push(`  * ${t.httpStage}: ${r.steps?.http?.status ?? 'pending'} (${r.steps?.http?.timeMs ?? 0}ms)`);
      lines.push('');
    });

    return lines.join('\n');
  };

  const reportText = generateMarkdownReport();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dns-connectivity-report-${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-800">
              {t.reportModalTitle}
            </h3>
          </div>
          <button
            id="close-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50">
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap select-all">
            {reportText}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            {tFormat(t.totalTestedCount, { total })}
          </span>

          <div className="flex items-center space-x-2">
            <button
              id="modal-copy-btn"
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>{t.copyReport}</span>
                </>
              )}
            </button>

            <button
              id="modal-download-btn"
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadReport}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
