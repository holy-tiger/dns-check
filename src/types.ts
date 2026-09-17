export interface DiagnosticStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  timeMs?: number;
  summary?: string;
  details?: Record<string, unknown>;
  error?: string;
}

/**
 * How the visitor's own browser ended up when it tried to reach the target.
 *
 * - reachable: the browser loaded the target, so this network can use it.
 * - resolution-failed: the target failed from the browser *quickly*, yet public
 *   DoH resolvers reached over the same network resolved it to real addresses.
 *   A fast rejection is what a local/ISP resolver answering NXDOMAIN looks like:
 *   the name never made it past the local resolver, so no connection was ever
 *   attempted.
 * - network-blocked: the target failed only after running into the request
 *   timeout, while DoH resolved it. The name resolved fine, so the packets are
 *   being dropped further out — filtering on the IP path, not DNS.
 * - unresolved-elsewhere: the browser failed and public DoH answered without an
 *   address (e.g. NXDOMAIN), so the name itself has no usable record.
 * - network-down: a known-good baseline host failed over the same network too,
 *   so nothing is reachable and no per-target conclusion can be drawn.
 * - doh-blocked: the browser failed and public DoH is unreachable too, so DNS
 *   itself is filtered/blocked for this visitor.
 * - unknown: failed, but nothing else could be verified.
 * - skipped: the probe could not be run (e.g. mixed content: https page -> http target).
 */
export type ClientProbeDiagnosis =
  | 'reachable'
  | 'resolution-failed'
  | 'network-blocked'
  | 'unresolved-elsewhere'
  | 'network-down'
  | 'doh-blocked'
  | 'unknown'
  | 'skipped';

/**
 * How the failed browser request spent its time. This is the only signal that
 * separates "the local resolver rejected the name" (fast) from "the packets
 * were dropped on the way out" (timeout).
 */
export type ClientProbeFailureMode = 'fast' | 'timeout' | 'unknown';

export interface ClientProbeDohResult {
  provider: 'google' | 'cloudflare';
  ok: boolean;
  status?: string;
  addresses?: string[];
  timeMs: number;
  error?: string;
}

/** A known-good host probed over the visitor's network, used as a control. */
export interface ClientProbeBaselineResult {
  url: string;
  ok: boolean;
  timeMs: number;
  error?: string;
}

export interface ClientProbeResult {
  ok: boolean;
  skipped?: boolean;
  diagnosis: ClientProbeDiagnosis;
  timeMs: number;
  url: string;
  /** Low-level error message from the browser request, when it failed. */
  error?: string;
  /** Only set when the request failed. */
  failureMode?: ClientProbeFailureMode;
  /** Control probe, only run when the target itself failed. */
  baseline?: ClientProbeBaselineResult;
  doh: ClientProbeDohResult[];
  timestamp: number;
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
  errorCategory?: 'DNS' | 'TCP' | 'TLS' | 'HTTP' | 'TIMEOUT' | 'CLIENT' | 'UNKNOWN';
  errorReason?: string;
  solutionSuggestion?: string;
  rawError?: string;
  totalTimeMs: number;
  steps: {
    /** Measured by the visitor's own browser, not by the server. */
    client: DiagnosticStep;
    dns: DiagnosticStep;
    tcp: DiagnosticStep;
    tls: DiagnosticStep;
    http: DiagnosticStep;
  };
  clientProbe?: ClientProbeResult;
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

export interface ClientInfoResponse {
  success: boolean;
  ip: string;
  isPrivateOrLocal: boolean;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
}
