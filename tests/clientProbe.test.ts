import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FAST_FAILURE_THRESHOLD_MS,
  REACHABILITY_TIMEOUT_MS,
  classify,
  classifyFailureMode,
} from '../src/utils/clientProbe.ts';
import type { ClientProbeDohResult } from '../src/types.ts';

const dohWithAddress = (addresses: string[]): ClientProbeDohResult => ({
  provider: 'google',
  ok: true,
  status: 'NOERROR',
  addresses,
  timeMs: 20,
});

const dohNxdomain = (): ClientProbeDohResult => ({
  provider: 'google',
  ok: true,
  status: 'NXDOMAIN',
  addresses: [],
  timeMs: 20,
});

const dohUnreachable = (): ClientProbeDohResult => ({
  provider: 'google',
  ok: false,
  timeMs: 5000,
  error: 'Timeout after 5000ms',
});

test('a target that loaded is reachable even if every control probe failed', () => {
  // The browser got the page, so nothing else needs explaining.
  assert.equal(classify(true, [], { mode: 'unknown', baselineOk: true }), 'reachable');
  assert.equal(
    classify(true, [dohUnreachable()], { mode: 'unknown', baselineOk: false }),
    'reachable'
  );
});

test('a visitor with no working network is not mistaken for a blocked target', () => {
  // This is the case that would otherwise be reported as "your DNS is blocking
  // it", when in fact the device simply has no connectivity.
  assert.equal(
    classify(false, [dohWithAddress(['203.0.113.9'])], { mode: 'fast', baselineOk: false }),
    'network-down'
  );
});

test('an instant failure while public DNS still resolves points at the local resolver', () => {
  // The signature of a local/ISP resolver answering NXDOMAIN: the request is
  // refused immediately, yet the same network resolves the name over DoH.
  assert.equal(
    classify(false, [dohWithAddress(['203.0.113.9'])], { mode: 'fast', baselineOk: true }),
    'resolution-failed'
  );
});

test('a failure that ran into the timeout points at the packets, not at DNS', () => {
  // The name resolved, so the connection attempt started; something further out
  // is dropping the traffic.
  assert.equal(
    classify(false, [dohWithAddress(['203.0.113.9'])], { mode: 'timeout', baselineOk: true }),
    'network-blocked'
  );
});

test('an undetermined failure duration still blames the local path', () => {
  // Conservative default: with no timing evidence, a visitor who cannot resolve
  // is reported as a local problem rather than a healthy target.
  assert.equal(
    classify(false, [dohWithAddress(['203.0.113.9'])], { mode: 'unknown', baselineOk: true }),
    'resolution-failed'
  );
});

test('public DNS answering without an address means the name itself is broken', () => {
  assert.equal(
    classify(false, [dohNxdomain()], { mode: 'fast', baselineOk: true }),
    'unresolved-elsewhere'
  );
});

test('one resolver answering with an address outweighs another answering NXDOMAIN', () => {
  assert.equal(
    classify(false, [dohNxdomain(), dohWithAddress(['203.0.113.9'])], {
      mode: 'fast',
      baselineOk: true,
    }),
    'resolution-failed'
  );
  assert.equal(
    classify(false, [dohUnreachable(), dohNxdomain()], { mode: 'fast', baselineOk: true }),
    'unresolved-elsewhere'
  );
});

test('when DoH is unreachable too there is nothing left to attribute', () => {
  assert.equal(
    classify(false, [dohUnreachable(), dohUnreachable()], { mode: 'timeout', baselineOk: true }),
    'doh-blocked'
  );
});

test('a failure with no DoH evidence at all stays unknown', () => {
  assert.equal(classify(false, [], { mode: 'unknown', baselineOk: true }), 'unknown');
});

test('failure mode separates instant rejections from dropped packets', () => {
  assert.equal(classifyFailureMode(0), 'unknown');
  assert.equal(classifyFailureMode(FAST_FAILURE_THRESHOLD_MS - 1), 'fast');
  assert.equal(classifyFailureMode(FAST_FAILURE_THRESHOLD_MS), 'unknown');
  assert.equal(classifyFailureMode(REACHABILITY_TIMEOUT_MS * 0.9 - 1), 'unknown');
  assert.equal(classifyFailureMode(REACHABILITY_TIMEOUT_MS * 0.9), 'timeout');
  assert.equal(classifyFailureMode(REACHABILITY_TIMEOUT_MS), 'timeout');
});
