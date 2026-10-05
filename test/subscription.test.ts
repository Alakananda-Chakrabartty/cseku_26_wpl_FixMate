import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBSCRIPTION_FEE_BDT,
  normalizeSubscriptionMethod,
  normalizeTransactionId,
} from '../server/subscription.ts';

test('monthly provider subscription fee is fixed and public', () => {
  assert.equal(SUBSCRIPTION_FEE_BDT, 500);
});

test('supported payment methods are normalized', () => {
  assert.equal(normalizeSubscriptionMethod('bKash'), 'bKash');
  assert.equal(normalizeSubscriptionMethod('Nagad'), 'Nagad');
  assert.equal(normalizeSubscriptionMethod('rocket'), null);
});

test('transaction IDs are validated before admin review', () => {
  assert.equal(normalizeTransactionId('TRX123456'), 'TRX123456');
  assert.equal(normalizeTransactionId('1234567890'), '1234567890');
  assert.equal(normalizeTransactionId('abc'), null);
  assert.equal(normalizeTransactionId('   '), null);
  assert.equal(normalizeTransactionId('TRX 123456'), null);
  assert.equal(normalizeTransactionId('x'.repeat(81)), null);
});
