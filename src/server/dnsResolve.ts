// The A/AAAA/CNAME lookups behind the DNS step of a diagnostic run.
//
// Kept in its own module because the ordering here is load-bearing:
//
// - A and AAAA decide whether the hostname resolves at all. They run in
//   parallel and share the caller's timeout budget, so that budget is a
//   ceiling rather than the sum of both queries.
// - CNAME is only extra context for the report. Plenty of resolvers stall for
//   several seconds when a name simply has no CNAME record, so it gets its own
//   short budget and can never turn a healthy A/AAAA answer into
//   "DNS query timed out".
// - When nothing resolves, the reason matters: "the resolver could not answer"
//   (SERVFAIL / REFUSED / timeout) is a different problem from "the domain has
//   no records", and only the latter should be reported as NXDOMAIN/ENOTFOUND.

export interface HostResolver {
  resolve4(hostname: string): Promise<string[]>;
  resolve6(hostname: string): Promise<string[]>;
  resolveCname(hostname: string): Promise<string[]>;
}

export interface SystemLookupEntry {
  address: string;
  family: number;
}

export interface ResolvedHostRecords {
  a: string[];
  aaaa: string[];
  cname: string[];
}

export interface ResolveHostRecordsOptions {
  hostname: string;
  resolver: HostResolver;
  // Budget shared by the A and AAAA lookups.
  timeoutMs: number;
  // Separate, short budget for the optional CNAME lookup.
  cnameTimeoutMs?: number;
  // Fallback that also honours /etc/hosts and search domains. Omit it when a
  // specific DNS server is being tested: that server is the thing under test,
  // so answering from the system resolver would mask its failures.
  systemLookup?: (hostname: string) => Promise<SystemLookupEntry[]>;
}

// CNAME lookups normally answer in well under 100ms; a second is generous.
export const DEFAULT_CNAME_TIMEOUT_MS = 1200;

// Codes that mean the name has no record of this type, not that the resolver is broken.
const ABSENT_RECORD_CODES = new Set(['ENODATA', 'ENOTFOUND', 'NXDOMAIN']);

// `error`/`value` are both declared optional so that reading them never
// depends on narrowing the union (this project does not enable strict mode).
type Settled<T> =
  | { ok: true; value: T; error?: undefined }
  | { ok: false; error: unknown; value?: undefined };

export function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(timeoutMsg);
      (err as unknown as { code: string }).code = 'ETIMEDOUT';
      reject(err);
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error })
  );
}

function codeOf(error: unknown): string {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return typeof code === 'string' && code ? code : 'UNKNOWN_DNS_ERROR';
}

function asError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function syntheticError(code: string, message: string): Error {
  const err = new Error(message);
  (err as unknown as { code: string }).code = code;
  return err;
}

// Picks the failure worth reporting when neither A nor AAAA produced an
// address. A resolver-side failure wins over an absent record: a broken
// resolver is the more likely cause of a mixed result and the one the user can
// act on, whereas reporting it as NXDOMAIN would blame the domain.
function describeMissingRecords(aError: unknown, aaaaError: unknown): Error {
  const errors = [aError, aaaaError].filter((err) => err != null);
  if (errors.length === 0) {
    return syntheticError('ENODATA', 'No A or AAAA records were returned');
  }

  const hardFailure = errors.find((err) => !ABSENT_RECORD_CODES.has(codeOf(err)));
  if (hardFailure) return asError(hardFailure);

  // A name can legitimately exist while having no address records of a given
  // family; only report "not found" when neither query saw an ENODATA answer.
  if (errors.every((err) => codeOf(err) === 'ENODATA')) return asError(errors[0]);

  return syntheticError('ENOTFOUND', '无法找到该域名的 IP 记录 (NXDOMAIN / ENOTFOUND)');
}

async function resolvePrimaryRecords(
  hostname: string,
  resolver: HostResolver,
  systemLookup?: (hostname: string) => Promise<SystemLookupEntry[]>
): Promise<{ a: string[]; aaaa: string[] }> {
  const [aResult, aaaaResult] = await Promise.all([
    settle(resolver.resolve4(hostname)),
    settle(resolver.resolve6(hostname)),
  ]);

  const a = aResult.ok ? aResult.value : [];
  const aaaa = aaaaResult.ok ? aaaaResult.value : [];
  if (a.length > 0 || aaaa.length > 0) return { a, aaaa };

  const aError = aResult.ok
    ? syntheticError('ENODATA', 'No A records were returned')
    : aResult.error;
  const aaaaError = aaaaResult.ok
    ? syntheticError('ENODATA', 'No AAAA records were returned')
    : aaaaResult.error;

  if (systemLookup) {
    try {
      const entries = (await systemLookup(hostname)) || [];
      const fallbackA: string[] = [];
      const fallbackAaaa: string[] = [];
      for (const entry of entries) {
        if (entry.family === 4) fallbackA.push(entry.address);
        else if (entry.family === 6) fallbackAaaa.push(entry.address);
      }
      if (fallbackA.length > 0 || fallbackAaaa.length > 0) {
        return { a: fallbackA, aaaa: fallbackAaaa };
      }
    } catch {
      // Keep the original resolver errors: they explain why we got here.
    }
  }

  throw describeMissingRecords(aError, aaaaError);
}

// Resolves the records for one hostname. Throws only when the hostname itself
// could not be resolved; a CNAME that is missing, slow or refused is reported
// as an empty list.
export async function resolveHostRecords(
  options: ResolveHostRecordsOptions
): Promise<ResolvedHostRecords> {
  const { hostname, resolver, timeoutMs, systemLookup } = options;
  const cnameTimeoutMs = Math.max(
    0,
    Math.min(options.cnameTimeoutMs ?? DEFAULT_CNAME_TIMEOUT_MS, timeoutMs)
  );

  // Started alongside the address lookups so a stalling CNAME query cannot
  // extend the run beyond the caller's budget.
  const cnamePromise = withTimeout(
    resolver.resolveCname(hostname),
    cnameTimeoutMs,
    `CNAME lookup timed out (${cnameTimeoutMs}ms)`
  ).catch(() => [] as string[]);

  const primary = await withTimeout(
    resolvePrimaryRecords(hostname, resolver, systemLookup),
    timeoutMs,
    `DNS 查询超时 (${timeoutMs}ms)`
  );
  const cname = await cnamePromise;

  return { a: primary.a, aaaa: primary.aaaa, cname };
}
