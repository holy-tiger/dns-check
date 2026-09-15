export interface DiagnosticStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  timeMs?: number;
  summary?: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface CertDetails {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isExpired: boolean;
  protocol?: string;
  authorized?: boolean;
}

export interface CheckResult {
  id: string;
  inputUrl: string;
  hostname: string;
  protocol: string;
  port: number;
  timestamp: number;
  status: 'idle' | 'running' | 'ok' | 'warning' | 'error';
  summary: string;
  errorCategory?: 'DNS' | 'TCP' | 'TLS' | 'HTTP' | 'TIMEOUT' | 'UNKNOWN';
  errorReason?: string;
  solutionSuggestion?: string;
  rawError?: string;
  totalTimeMs: number;
  steps: {
    dns: DiagnosticStep;
    tcp: DiagnosticStep;
    tls: DiagnosticStep;
    http: DiagnosticStep;
  };
  dnsRecords?: {
    a?: string[];
    aaaa?: string[];
    cname?: string[];
  };
  resolvedIp?: string;
  certDetails?: CertDetails;
  httpDetails?: {
    statusCode: number;
    statusText: string;
    server?: string;
    contentType?: string;
    contentLength?: string;
    redirectLocation?: string;
  };
}

export type SupportedLang = 'zh' | 'en' | 'ar';

export interface CheckRequestOptions {
  targets: string[];
  customDns?: string;
  timeoutMs?: number;
  lang?: SupportedLang;
}

export interface SavedReportClientInfo {
  userAgent?: string;
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
}

export interface SavedReport {
  id: string;
  createdAt: number;
  targets: string[];
  customDns?: string;
  timeoutMs: number;
  total: number;
  okCount: number;
  failedCount: number;
  avgTimeMs: number;
  results: CheckResult[];
  clientInfo?: SavedReportClientInfo;
}

export interface ReportUploadResponse {
  success: boolean;
  id: string;
  createdAt: number;
  viewUrl: string;
  message?: string;
  clientInfo?: SavedReportClientInfo;
}

