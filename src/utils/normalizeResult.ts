import { CheckResult, DiagnosticStep } from '../types';

/**
 * Normalizes any CheckResult item (such as those loaded from historical saved reports,
 * external API posts, or different schema versions) to guarantee that steps,
 * dns, tcp, tls, and http objects exist with valid structures.
 */
export function normalizeCheckResult(raw: unknown, index = 0): CheckResult {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  const defaultStep = (name: string): DiagnosticStep => ({
    name,
    status: 'pending',
    timeMs: 0,
  });

  // Extract steps or legacy details
  const rawSteps = (typeof item.steps === 'object' && item.steps !== null ? item.steps : {}) as Record<string, unknown>;
  const rawDetails = (typeof item.details === 'object' && item.details !== null ? item.details : {}) as Record<string, unknown>;

  const mapStep = (name: string, key: 'dns' | 'tcp' | 'tls' | 'http'): DiagnosticStep => {
    // Check if item.steps[key] exists
    if (rawSteps[key] && typeof rawSteps[key] === 'object') {
      const stepObj = rawSteps[key] as Record<string, unknown>;
      return {
        name: (typeof stepObj.name === 'string' ? stepObj.name : name),
        status: (['pending', 'running', 'success', 'failed', 'skipped'].includes(stepObj.status as string)
          ? (stepObj.status as DiagnosticStep['status'])
          : (stepObj.status === 'ok' ? 'success' : 'failed')),
        timeMs: typeof stepObj.timeMs === 'number' ? stepObj.timeMs : 0,
        summary: typeof stepObj.summary === 'string' ? stepObj.summary : undefined,
        details: typeof stepObj.details === 'object' ? (stepObj.details as Record<string, unknown>) : undefined,
        error: typeof stepObj.error === 'string' ? stepObj.error : undefined,
      };
    }

    // Check if item.details[key] exists (legacy format)
    if (rawDetails[key] && typeof rawDetails[key] === 'object') {
      const detailObj = rawDetails[key] as Record<string, unknown>;
      const isOk = detailObj.status === 'ok' || detailObj.status === 'success';
      const isSkipped = detailObj.status === 'skipped';
      return {
        name,
        status: isSkipped ? 'skipped' : isOk ? 'success' : 'failed',
        timeMs: typeof detailObj.timeMs === 'number' ? detailObj.timeMs : 0,
        error: typeof detailObj.error === 'string' ? detailObj.error : undefined,
      };
    }

    return defaultStep(name);
  };

  const hostname = String(item.hostname || item.inputUrl || item.target || `target-${index + 1}`).replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  const port = typeof item.port === 'number' ? item.port : 443;
  const protocol = typeof item.protocol === 'string' ? item.protocol : (port === 443 ? 'https:' : 'http:');
  const totalTimeMs = typeof item.totalTimeMs === 'number' ? item.totalTimeMs : 0;

  // Extract resolved IP if available
  let resolvedIp: string | undefined = typeof item.resolvedIp === 'string' ? item.resolvedIp : undefined;
  if (!resolvedIp && rawDetails.dns && typeof rawDetails.dns === 'object') {
    const dnsObj = rawDetails.dns as { addresses?: string[] };
    if (Array.isArray(dnsObj.addresses) && dnsObj.addresses.length > 0) {
      resolvedIp = dnsObj.addresses[0];
    }
  }

  // Extract DNS records
  let dnsRecords = item.dnsRecords as CheckResult['dnsRecords'];
  if (!dnsRecords && rawDetails.dns && typeof rawDetails.dns === 'object') {
    const dnsObj = rawDetails.dns as { addresses?: string[] };
    if (Array.isArray(dnsObj.addresses) && dnsObj.addresses.length > 0) {
      dnsRecords = { a: dnsObj.addresses };
    }
  }

  // Extract HTTP details
  let httpDetails = item.httpDetails as CheckResult['httpDetails'];
  if (!httpDetails && rawDetails.http && typeof rawDetails.http === 'object') {
    const httpObj = rawDetails.http as { statusCode?: number; statusText?: string };
    if (typeof httpObj.statusCode === 'number') {
      httpDetails = {
        statusCode: httpObj.statusCode,
        statusText: httpObj.statusText || 'OK',
      };
    }
  }

  return {
    id: String(item.id || `check-${Date.now()}-${index}`),
    inputUrl: String(item.inputUrl || item.hostname || hostname),
    hostname,
    protocol,
    port,
    timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
    status: (['idle', 'running', 'ok', 'warning', 'error'].includes(item.status as string)
      ? (item.status as CheckResult['status'])
      : (item.status === 'success' ? 'ok' : item.status === 'failed' ? 'error' : 'ok')),
    summary: String(item.summary || (item.status === 'ok' ? 'All checks passed' : 'Check completed')),
    errorCategory: item.errorCategory as CheckResult['errorCategory'],
    errorReason: typeof item.errorReason === 'string' ? item.errorReason : undefined,
    solutionSuggestion: typeof item.solutionSuggestion === 'string' ? item.solutionSuggestion : undefined,
    rawError: typeof item.rawError === 'string' ? item.rawError : undefined,
    totalTimeMs,
    steps: {
      dns: mapStep('DNS Resolution', 'dns'),
      tcp: mapStep('TCP Handshake', 'tcp'),
      tls: mapStep('TLS Handshake', 'tls'),
      http: mapStep('HTTP Response', 'http'),
    },
    dnsRecords,
    resolvedIp,
    certDetails: item.certDetails as CheckResult['certDetails'],
    httpDetails,
  };
}
