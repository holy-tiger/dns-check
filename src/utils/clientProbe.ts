import {
  CheckResult,
  ClientProbeBaselineResult,
  ClientProbeDohResult,
  ClientProbeFailureMode,
  ClientProbeResult,
} from '../types';

/**
 * Visitor-side probing.
 *
 * Every result the server produces is measured on the server's network, which
 * says nothing about whether the person looking at the page can actually use
 * the target. These helpers run from the visitor's browser instead:
 *
 * 1. a real request (fetch, no-cors) to the target, which forces the visitor's
 *    own resolver + network path to be exercised;
 * 2. DNS-over-HTTPS queries to public resolvers, sent over the same network, so
 *    we can tell "your resolver failed" apart from "the domain is broken";
 * 3. a control request to a host that is known to be globally reachable, so a
 *    visitor with no working network is not mistaken for a blocked target.
 *
 * The browser never exposes *why* a request failed, so attribution is built
 * from how the failure behaved rather than from an error code: how long it
 * took, whether public DNS still resolves the name, and whether anything at
 * all is reachable from this network.
 */

export const REACHABILITY_TIMEOUT_MS = 8000;
const DOH_TIMEOUT_MS = 5000;
const MAX_CONCURRENT_PROBES = 6;

/**
 * A failure landing well before the timeout means the browser was told "no"
 * almost immediately — the signature of a local resolver answering NXDOMAIN (or
 * a RST), where no packet ever leaves the machine. A failure that runs into the
 * timeout instead means the packets were sent and then dropped.
 */
export const FAST_FAILURE_THRESHOLD_MS = 1500;

/**
 * IANA's reserved example domain: always resolvable, not owned by anyone who
 * could let it lapse, and not a target of deliberate blocking.
 */
const BASELINE_URL = 'https://example.com/';

const DOH_PROVIDERS: { provider: 'google' | 'cloudflare'; url: (name: string) => string; headers?: Record<string, string> }[] = [
  {
    provider: 'google',
    url: (name) => `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=A`,
  },
  {
    provider: 'cloudflare',
    url: (name) => `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=A`,
    headers: { accept: 'application/dns-json' },
  },
];

const DOH_STATUS_NAMES: Record<number, string> = {
  0: 'NOERROR',
  1: 'FORMERR',
  2: 'SERVFAIL',
  3: 'NXDOMAIN',
  4: 'NOTIMP',
  5: 'REFUSED',
};

function describeError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return `Timeout after ${REACHABILITY_TIMEOUT_MS}ms`;
  }
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  return String(err);
}

/** Builds the URL a browser should use to exercise the visitor's own DNS path. */
export function buildBrowserProbeUrl(result: CheckResult): string {
  const protocol = result.protocol === 'http:' ? 'http:' : 'https:';
  const raw = result.inputUrl || '';
  let url: URL;

  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `${protocol}//${raw || result.hostname}`);
  } catch {
    url = new URL(`${protocol}//${result.hostname}`);
  }

  // Always probe the hostname/port the server actually checked.
  url.protocol = protocol;
  url.hostname = result.hostname;
  url.port = result.port ? String(result.port) : '';
  if (!url.pathname || url.pathname === '') url.pathname = '/';

  return url.toString();
}

/**
 * A `no-cors` fetch resolves as soon as the request completes, so it succeeds
 * for any HTTP status but rejects when DNS/TCP/TLS fails. That is exactly the
 * signal we want: "could this visitor's network reach the target at all".
 */
async function probeReachability(
  url: string,
  timeoutMs = REACHABILITY_TIMEOUT_MS
): Promise<{ ok: boolean; timeMs: number; error?: string }> {
  if (typeof fetch !== 'function') {
    return { ok: false, timeMs: 0, error: 'fetch() is not available in this browser' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    await fetch(url, {
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      credentials: 'omit',
      signal: controller.signal,
    });
    return { ok: true, timeMs: Date.now() - started };
  } catch (err) {
    return { ok: false, timeMs: Date.now() - started, error: describeError(err) };
  } finally {
    clearTimeout(timer);
  }
}

/** DNS-over-HTTPS query issued from the visitor's network. */
async function queryDoh(
  provider: 'google' | 'cloudflare',
  urlBuilder: (name: string) => string,
  hostname: string,
  headers: Record<string, string> | undefined,
  timeoutMs = DOH_TIMEOUT_MS
): Promise<ClientProbeDohResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const res = await fetch(urlBuilder(hostname), {
      cache: 'no-store',
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      return { provider, ok: false, timeMs: Date.now() - started, error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      Status?: number;
      Answer?: { name?: string; type?: number; data?: string }[];
    };

    const addresses = (data.Answer || [])
      .filter((answer) => answer.type === 1 && typeof answer.data === 'string')
      .map((answer) => String(answer.data));

    return {
      provider,
      ok: true,
      status: DOH_STATUS_NAMES[data.Status ?? 0] || `STATUS_${data.Status}`,
      addresses,
      timeMs: Date.now() - started,
    };
  } catch (err) {
    return { provider, ok: false, timeMs: Date.now() - started, error: describeError(err) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probes a host that should resolve and load from anywhere. Only run once the
 * target itself failed: if this fails too, the visitor's network is the story,
 * not the target's DNS.
 */
async function probeBaseline(): Promise<ClientProbeBaselineResult> {
  const reach = await probeReachability(BASELINE_URL);
  return { url: BASELINE_URL, ok: reach.ok, timeMs: reach.timeMs, error: reach.error };
}

/**
 * A whole batch can fail on every target, and probing the same control host
 * once per target would be slow and rude. The result is shared for a short
 * window, which is safe because "can this device reach the internet at all"
 * does not change within a single run.
 */
const BASELINE_TTL_MS = 15000;
let baselineProbe: { at: number; promise: Promise<ClientProbeBaselineResult> } | null = null;

function probeBaselineShared(): Promise<ClientProbeBaselineResult> {
  const now = Date.now();
  if (baselineProbe && now - baselineProbe.at < BASELINE_TTL_MS) {
    return baselineProbe.promise;
  }
  const promise = probeBaseline();
  baselineProbe = { at: now, promise };
  return promise;
}

export function classifyFailureMode(timeMs: number): ClientProbeFailureMode {
  if (!(timeMs > 0)) return 'unknown';
  if (timeMs < FAST_FAILURE_THRESHOLD_MS) return 'fast';
  if (timeMs >= REACHABILITY_TIMEOUT_MS * 0.9) return 'timeout';
  return 'unknown';
}

/**
 * Turns the raw observations into the single conclusion the report needs.
 * Kept separate from the i18n layer so the wording stays translatable.
 */
export function classify(
  reachable: boolean,
  doh: ClientProbeDohResult[],
  failure: { mode: ClientProbeFailureMode; baselineOk: boolean }
): ClientProbeResult['diagnosis'] {
  if (reachable) return 'reachable';

  // Nothing at all is reachable from this network, so blaming the target's DNS
  // would be wrong.
  if (!failure.baselineOk) return 'network-down';

  const resolvable = doh.some((item) => item.ok && (item.addresses?.length ?? 0) > 0);
  if (resolvable) {
    // The name resolves over this network's public-DNS path, so the domain is
    // healthy. What differs is how the local failure behaved: an instant
    // rejection points at the local resolver, a timeout points at the packets.
    return failure.mode === 'timeout' ? 'network-blocked' : 'resolution-failed';
  }

  const dohReachable = doh.some((item) => item.ok);
  if (dohReachable) return 'unresolved-elsewhere';
  if (doh.length > 0 && doh.every((item) => !item.ok)) return 'doh-blocked';

  return 'unknown';
}

/**
 * Runs the visitor-side probe for a single target. Never throws: a probe that
 * cannot run is reported as `skipped` so the rest of the report stays intact.
 */
export async function probeTargetFromBrowser(result: CheckResult): Promise<ClientProbeResult> {
  const timestamp = Date.now();
  const url = buildBrowserProbeUrl(result);

  // A https page cannot request a http resource: the browser blocks it before
  // any DNS lookup happens, so treat it as "not probed" instead of "failed".
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://')
  ) {
    return {
      ok: false,
      skipped: true,
      diagnosis: 'skipped',
      timeMs: 0,
      url,
      error: 'Mixed content: https page cannot probe an http target',
      doh: [],
      timestamp,
    };
  }

  try {
    const reach = await probeReachability(url);

    // The target loaded, so there is nothing to attribute: skip the control
    // probes and save the visitor the extra requests.
    if (reach.ok) {
      return {
        ok: true,
        diagnosis: 'reachable',
        timeMs: reach.timeMs,
        url,
        doh: [],
        timestamp,
      };
    }

    const failureMode = classifyFailureMode(reach.timeMs);
    const [baseline, dohResults] = await Promise.all([
      probeBaselineShared(),
      Promise.all(
        DOH_PROVIDERS.map((entry) => queryDoh(entry.provider, entry.url, result.hostname, entry.headers))
      ),
    ]);

    return {
      ok: false,
      diagnosis: classify(false, dohResults, { mode: failureMode, baselineOk: baseline.ok }),
      timeMs: reach.timeMs,
      url,
      error: reach.error,
      failureMode,
      baseline,
      doh: dohResults,
      timestamp,
    };
  } catch (err) {
    // Defensive: probing must never break the diagnostic run.
    return {
      ok: false,
      diagnosis: 'unknown',
      timeMs: 0,
      url,
      error: describeError(err),
      doh: [],
      timestamp,
    };
  }
}

/** Probes a batch of results with a small concurrency limit. */
export async function probeResultsInBrowser(
  results: CheckResult[]
): Promise<Map<string, ClientProbeResult>> {
  const probes = new Map<string, ClientProbeResult>();
  if (typeof window === 'undefined' || results.length === 0) return probes;

  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT_PROBES, results.length) },
    async () => {
      while (cursor < results.length) {
        const index = cursor;
        cursor += 1;
        const result = results[index];
        if (!result) continue;
        probes.set(result.id, await probeTargetFromBrowser(result));
      }
    }
  );

  await Promise.all(workers);
  return probes;
}
