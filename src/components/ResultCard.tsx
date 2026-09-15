import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Globe,
  Wifi,
  ShieldCheck,
  ShieldAlert,
  Server,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react';
import { CheckResult, DiagnosticStep, SupportedLang } from '../types';
import { translations, tFormat } from '../i18n';

interface ResultCardProps {
  result: CheckResult;
  onRetest: (target: string) => void;
  isRetesting?: boolean;
  currentLang: SupportedLang;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onRetest,
  isRetesting,
  currentLang,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = translations[currentLang];

  const isFailed = result.status === 'error';
  const isWarning = result.status === 'warning';
  const isOk = result.status === 'ok';

  const handleCopySingle = () => {
    const lines = [
      `[Target]: ${result.inputUrl} (${result.hostname}:${result.port})`,
      `[Result]: ${result.summary}`,
      `[Duration]: ${result.totalTimeMs}ms`,
    ];

    if (result.errorReason) {
      lines.push(`[Error Reason]: ${result.errorReason}`);
    }
    if (result.solutionSuggestion) {
      lines.push(`[Troubleshooting]: ${result.solutionSuggestion}`);
    }
    if (result.resolvedIp) {
      lines.push(`[Resolved IP]: ${result.resolvedIp}`);
    }
    if (result.steps.dns.status) {
      lines.push(`- DNS: ${result.steps.dns.status} (${result.steps.dns.timeMs}ms)`);
    }
    if (result.steps.tcp.status) {
      lines.push(`- TCP: ${result.steps.tcp.status} (${result.steps.tcp.timeMs}ms)`);
    }
    if (result.steps.tls.status !== 'skipped') {
      lines.push(`- TLS: ${result.steps.tls.status} (${result.steps.tls.timeMs}ms)`);
    }
    if (result.steps.http.status !== 'skipped') {
      lines.push(`- HTTP: ${result.steps.http.status} (${result.steps.http.timeMs}ms)`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (isOk) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t.statusHealthy}</span>
        </span>
      );
    }
    if (result.errorCategory === 'DNS') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{t.dnsFailed}</span>
        </span>
      );
    }
    if (result.errorCategory === 'TCP' || result.errorCategory === 'TIMEOUT') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{result.errorCategory === 'TIMEOUT' ? t.tcpTimeout : t.tcpFailed}</span>
        </span>
      );
    }
    if (result.errorCategory === 'TLS') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>{t.tlsFailed}</span>
        </span>
      );
    }
    if (result.errorCategory === 'HTTP') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>{t.httpFailed}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>{t.statusFailed}</span>
      </span>
    );
  };

  const renderStepItem = (
    title: string,
    icon: React.ReactNode,
    step: DiagnosticStep,
    extraInfo?: React.ReactNode
  ) => {
    const isStepOk = step.status === 'success';
    const isStepFailed = step.status === 'failed';
    const isStepSkipped = step.status === 'skipped';

    return (
      <div className={`flex-1 min-w-[130px] p-2.5 rounded-xl border transition-all ${
        isStepFailed
          ? 'bg-rose-50/70 border-rose-200'
          : isStepOk
          ? 'bg-slate-50 border-slate-200/70'
          : 'bg-slate-50/40 border-slate-200/40 opacity-60'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-700">
            {icon}
            <span>{title}</span>
          </div>
          {isStepOk && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          {isStepFailed && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          {isStepSkipped && <span className="text-[10px] text-slate-400">{t.skipped}</span>}
        </div>

        <div className="text-xs">
          {isStepOk && (
            <div className="text-slate-600 flex items-center justify-between">
              <span className="text-emerald-700 font-medium">{t.stepOk}</span>
              <span className="font-mono text-slate-400">{step.timeMs}ms</span>
            </div>
          )}
          {isStepFailed && (
            <div className="text-rose-700 font-medium truncate" title={step.error}>
              {t.stepFailed} ({step.timeMs}ms)
            </div>
          )}
          {isStepSkipped && <div className="text-slate-400 text-[11px]">{t.skipped}</div>}
        </div>

        {extraInfo && <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-[11px]">{extraInfo}</div>}
      </div>
    );
  };

  return (
    <div
      id={`result-card-${result.id}`}
      className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden mb-4 ${
        isFailed
          ? 'border-rose-300 ring-1 ring-rose-200/50'
          : isWarning
          ? 'border-amber-300 ring-1 ring-amber-200/50'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Top Banner */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {getStatusBadge()}
            <div className="flex items-baseline space-x-2">
              <span className="font-mono font-bold text-slate-900 text-base">
                {result.hostname}
              </span>
              <span className="text-xs font-mono text-slate-400">
                :{result.port} ({result.protocol})
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{result.totalTimeMs}ms</span>
            </div>

            <button
              id={`retest-btn-${result.id}`}
              type="button"
              onClick={() => onRetest(result.inputUrl)}
              disabled={isRetesting}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={t.retestTarget}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRetesting ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              id={`copy-btn-${result.id}`}
              type="button"
              onClick={handleCopySingle}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={t.copySingle}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <a
              href={`${result.protocol}://${result.hostname}:${result.port}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={t.openInBrowser}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* SPECIFIC ERROR REASON CALLOUT BOX (Required by User) */}
        {(isFailed || isWarning) && result.errorReason && (
          <div className="mt-3 mb-4 rounded-xl border p-4 bg-rose-50/80 border-rose-200 text-rose-950 animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    {t.errorReasonLabel}
                  </span>
                  {result.errorCategory && (
                    <span className="text-xs font-medium text-rose-600">
                      {t.stage}: {result.errorCategory}
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-rose-900 mt-0.5">
                  {result.errorReason}
                </p>

                {result.solutionSuggestion && (
                  <div className="mt-2 text-xs text-rose-800 bg-white/80 border border-rose-200/70 rounded-lg p-2.5 flex items-start space-x-2">
                    <HelpCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-rose-900 mr-1">{t.suggestionLabel}:</span>
                      {result.solutionSuggestion}
                    </div>
                  </div>
                )}

                {result.rawError && (
                  <details className="mt-2 text-[11px] text-rose-700 cursor-pointer">
                    <summary className="font-mono hover:underline">{t.rawSystemError}</summary>
                    <pre className="mt-1 p-2 rounded bg-rose-100/70 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto text-rose-900">
                      {result.rawError}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Pipeline Stages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2">
          {/* Stage 1: DNS */}
          {renderStepItem(
            t.dnsStage,
            <Globe className="w-3.5 h-3.5 text-blue-500" />,
            result.steps.dns,
            result.resolvedIp ? (
              <span className="font-mono text-slate-600 truncate block" title={result.resolvedIp}>
                IP: {result.resolvedIp}
              </span>
            ) : undefined
          )}

          {/* Stage 2: TCP */}
          {renderStepItem(
            t.tcpStage,
            <Wifi className="w-3.5 h-3.5 text-indigo-500" />,
            result.steps.tcp,
            <span className="font-mono text-slate-500 block">{t.port}: {result.port}</span>
          )}

          {/* Stage 3: TLS */}
          {renderStepItem(
            t.tlsStage,
            result.certDetails?.isExpired ? (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            ),
            result.steps.tls,
            result.certDetails ? (
              <span
                className={`block truncate ${
                  result.certDetails.isExpired ? 'text-rose-600 font-medium' : 'text-slate-500'
                }`}
              >
                {result.certDetails.isExpired
                  ? t.certExpired
                  : tFormat(t.certDaysRemaining, { days: result.certDetails.daysRemaining })}
              </span>
            ) : undefined
          )}

          {/* Stage 4: HTTP */}
          {renderStepItem(
            t.httpStage,
            <Server className="w-3.5 h-3.5 text-purple-500" />,
            result.steps.http,
            result.httpDetails?.statusCode ? (
              <span
                className={`font-mono block ${
                  result.httpDetails.statusCode < 400 ? 'text-emerald-700' : 'text-rose-600 font-medium'
                }`}
              >
                {t.httpStatus}: {result.httpDetails.statusCode} {result.httpDetails.statusText || ''}
              </span>
            ) : undefined
          )}
        </div>

        {/* Toggle Details button */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            {result.resolvedIp && (
              <span className="text-slate-600 font-mono">
                {t.resolvedIp}: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{result.resolvedIp}</code>
              </span>
            )}
          </div>

          <button
            id={`toggle-details-${result.id}`}
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center space-x-1 text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            <span>{isExpanded ? t.collapseTechDetails : t.expandTechDetails}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Technical Details Drawer */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200/80 p-4 sm:p-5 text-xs text-slate-700 space-y-4 animate-in fade-in duration-150">
          {/* DNS Records */}
          <div>
            <h4 className="font-semibold text-slate-800 flex items-center space-x-1.5 mb-2">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.dnsRecordsTitle}</span>
            </h4>
            <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
              <div>
                <span className="text-slate-400 font-mono inline-block w-24">A (IPv4):</span>
                {result.dnsRecords?.a && result.dnsRecords.a.length > 0 ? (
                  <span className="font-mono text-slate-800">
                    {result.dnsRecords.a.join(', ')}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">None</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-mono inline-block w-24">AAAA (IPv6):</span>
                {result.dnsRecords?.aaaa && result.dnsRecords.aaaa.length > 0 ? (
                  <span className="font-mono text-slate-800">
                    {result.dnsRecords.aaaa.join(', ')}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">None</span>
                )}
              </div>
              {result.dnsRecords?.cname && result.dnsRecords.cname.length > 0 && (
                <div>
                  <span className="text-slate-400 font-mono inline-block w-24">CNAME:</span>
                  <span className="font-mono text-slate-800">
                    {result.dnsRecords.cname.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TLS Details */}
          {result.certDetails && (
            <div>
              <h4 className="font-semibold text-slate-800 flex items-center space-x-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.tlsCertTitle}</span>
              </h4>
              <div className="bg-white rounded-lg border border-slate-200 p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">{t.certIssuer}: </span>
                  <span className="font-mono text-slate-800">{result.certDetails.issuer}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t.certSubject}: </span>
                  <span className="font-mono text-slate-800">{result.certDetails.subject}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t.certValidity}: </span>
                  <span className="font-mono text-slate-800">
                    {result.certDetails.validFrom} ~ {result.certDetails.validTo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{t.certProtocol}: </span>
                  <span className="font-mono text-slate-800">{result.certDetails.protocol || 'TLS'}</span>
                </div>
              </div>
            </div>
          )}

          {/* HTTP Header Details */}
          {result.httpDetails && (
            <div>
              <h4 className="font-semibold text-slate-800 flex items-center space-x-1.5 mb-2">
                <Server className="w-3.5 h-3.5 text-purple-600" />
                <span>{t.httpHeaderTitle}</span>
              </h4>
              <div className="bg-white rounded-lg border border-slate-200 p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">{t.httpStatus}: </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {result.httpDetails.statusCode} {result.httpDetails.statusText}
                  </span>
                </div>
                {result.httpDetails.server && (
                  <div>
                    <span className="text-slate-400">Server: </span>
                    <span className="font-mono text-slate-800">{result.httpDetails.server}</span>
                  </div>
                )}
                {result.httpDetails.contentType && (
                  <div>
                    <span className="text-slate-400">Content-Type: </span>
                    <span className="font-mono text-slate-800">{result.httpDetails.contentType}</span>
                  </div>
                )}
                {result.httpDetails.redirectLocation && (
                  <div className="col-span-full">
                    <span className="text-slate-400">{t.httpLocation}: </span>
                    <span className="font-mono text-blue-600">{result.httpDetails.redirectLocation}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
