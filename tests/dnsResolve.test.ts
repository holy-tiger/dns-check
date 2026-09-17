import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CNAME_TIMEOUT_MS,
  resolveHostRecords,
  type HostResolver,
} from '../src/server/dnsResolve.ts';

const never = () => new Promise<string[]>(() => {});

const delay = <T>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const fail = (code: string, message: string = code) =>
  Promise.reject(Object.assign(new Error(message), { code }));

const codeOf = (err: unknown) => (err as { code?: string }).code;

/** A resolver where every query fails unless a test overrides it. */
function fakeResolver(overrides: Partial<HostResolver> = {}): HostResolver {
  return {
    resolve4: () => fail('ENODATA', 'queryA ENODATA'),
    resolve6: () => fail('ENODATA', 'queryAaaa ENODATA'),
    resolveCname: () => fail('ENODATA', 'queryCname ENODATA'),
    ...overrides,
  };
}

test('a stalling CNAME lookup cannot turn a healthy A record into a DNS timeout', async () => {
  // Reproduces baidu.com / qq.com behind Docker's embedded resolver: the A
  // lookup answers in milliseconds while the CNAME query never comes back.
  const started = Date.now();
  const records = await resolveHostRecords({
    hostname: 'baidu.com',
    resolver: fakeResolver({
      resolve4: () => delay(3, ['124.237.177.164', '111.63.65.247']),
      resolve6: () => fail('ENODATA', 'queryAaaa ENODATA baidu.com'),
      resolveCname: () => never(),
    }),
    timeoutMs: 4000,
  });

  assert.deepEqual(records.a, ['124.237.177.164', '111.63.65.247']);
  assert.deepEqual(records.aaaa, []);
  assert.deepEqual(records.cname, []);
  assert.ok(
    Date.now() - started < 2000,
    'CNAME gets its own short budget instead of holding the address budget'
  );
});

test('a refused CNAME lookup is reported as an empty CNAME list', async () => {
  const records = await resolveHostRecords({
    hostname: 'example.com',
    resolver: fakeResolver({
      resolve4: () => delay(5, ['93.184.216.34']),
      resolveCname: () => fail('ESERVFAIL', 'queryCname ESERVFAIL example.com'),
    }),
    timeoutMs: 4000,
  });

  assert.deepEqual(records.a, ['93.184.216.34']);
  assert.deepEqual(records.cname, []);
});

test('CNAME is still reported when the resolver does answer it', async () => {
  const records = await resolveHostRecords({
    hostname: 'www.baidu.com',
    resolver: fakeResolver({
      resolve4: () => delay(5, ['110.242.68.66']),
      resolveCname: () => delay(10, ['www.a.shifen.com']),
    }),
    timeoutMs: 4000,
  });

  assert.deepEqual(records.cname, ['www.a.shifen.com']);
});

test('address and CNAME lookups are issued in parallel, not back to back', async () => {
  const started: string[] = [];
  const track = (name: string, value: string[]) => {
    started.push(name);
    return delay(20, value);
  };

  await resolveHostRecords({
    hostname: 'parallel.example',
    resolver: fakeResolver({
      resolve4: () => track('a', ['1.2.3.4']),
      resolve6: () => track('aaaa', []),
      resolveCname: () => track('cname', []),
    }),
    timeoutMs: 4000,
  });

  assert.deepEqual([...started].sort(), ['a', 'aaaa', 'cname']);
});

test('a real resolver failure is surfaced instead of being blamed on the domain', async () => {
  await assert.rejects(
    () =>
      resolveHostRecords({
        hostname: 'broken.example',
        resolver: fakeResolver({
          resolve4: () => fail('ESERVFAIL', 'queryA ESERVFAIL broken.example'),
        }),
        timeoutMs: 1000,
      }),
    (err: unknown) => codeOf(err) === 'ESERVFAIL'
  );
});

test('an unresponsive resolver still reports a DNS timeout', async () => {
  const started = Date.now();
  await assert.rejects(
    () =>
      resolveHostRecords({
        hostname: 'hung.example',
        resolver: fakeResolver({ resolve4: () => never(), resolve6: () => never() }),
        timeoutMs: 150,
      }),
    (err: unknown) => codeOf(err) === 'ETIMEDOUT' && /DNS 查询超时/.test((err as Error).message)
  );
  assert.ok(Date.now() - started < 1500);
});

test('a name with no address records is reported as not found', async () => {
  await assert.rejects(
    () =>
      resolveHostRecords({
        hostname: 'gone.example',
        resolver: fakeResolver({
          resolve4: () => fail('ENOTFOUND', 'queryA ENOTFOUND gone.example'),
          resolve6: () => fail('ENOTFOUND', 'queryAaaa ENOTFOUND gone.example'),
        }),
        timeoutMs: 1000,
      }),
    (err: unknown) => codeOf(err) === 'ENOTFOUND'
  );
});

test('a name that exists without address records keeps its ENODATA diagnosis', async () => {
  await assert.rejects(
    () =>
      resolveHostRecords({
        hostname: 'no-address.example',
        resolver: fakeResolver(),
        timeoutMs: 1000,
      }),
    (err: unknown) => codeOf(err) === 'ENODATA'
  );
});

test('the system lookup rescues hosts that only exist in /etc/hosts', async () => {
  const records = await resolveHostRecords({
    hostname: 'internal.lan',
    resolver: fakeResolver({
      resolve4: () => fail('ENOTFOUND', 'queryA ENOTFOUND internal.lan'),
    }),
    timeoutMs: 1000,
    systemLookup: async () => [{ address: '127.0.0.1', family: 4 }],
  });

  assert.deepEqual(records.a, ['127.0.0.1']);
});

test('the system lookup is not consulted when it is unavailable', async () => {
  await assert.rejects(
    () =>
      resolveHostRecords({
        hostname: 'internal.lan',
        resolver: fakeResolver({
          resolve4: () => fail('ENOTFOUND', 'queryA ENOTFOUND internal.lan'),
        }),
        timeoutMs: 1000,
      }),
    (err: unknown) => codeOf(err) === 'ENOTFOUND'
  );
});

test('the CNAME budget never exceeds the caller-supplied budget', async () => {
  const started = Date.now();
  await resolveHostRecords({
    hostname: 'tiny-budget.example',
    resolver: fakeResolver({
      resolve4: () => delay(5, ['1.2.3.4']),
      resolveCname: () => never(),
    }),
    timeoutMs: 100,
  });

  assert.ok(Date.now() - started < DEFAULT_CNAME_TIMEOUT_MS);
});
