import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCombinedScore,
  determineRiskLevel,
  determineTransactionStatus,
  assessTransaction,
} from './scoring.ts';
import { evaluateRules, DEFAULT_RULES_CONFIG } from './rules.ts';
import { predictFraudProbability } from './mlModel.ts';
import type { Transaction } from '../types/fraud.ts';

test('calculateCombinedScore: computes weighted 50/50 score correctly', () => {
  const result = calculateCombinedScore(80, 70, { ruleWeight: 0.5, mlWeight: 0.5 });
  assert.equal(result, 75);
});

test('calculateCombinedScore: clamps between 0 and 100', () => {
  const high = calculateCombinedScore(150, 100, { ruleWeight: 0.5, mlWeight: 0.5 });
  assert.equal(high, 100);
  const low = calculateCombinedScore(-10, 0, { ruleWeight: 0.5, mlWeight: 0.5 });
  assert.equal(low, 0);
});

test('determineRiskLevel: categorizes score bands accurately', () => {
  assert.equal(determineRiskLevel(85), 'CRITICAL');
  assert.equal(determineRiskLevel(65), 'HIGH');
  assert.equal(determineRiskLevel(45), 'MEDIUM');
  assert.equal(determineRiskLevel(20), 'LOW');
});

test('determineTransactionStatus: respects flag and block thresholds', () => {
  const config = { ...DEFAULT_RULES_CONFIG, flagThreshold: 65, blockThreshold: 85 };
  assert.equal(determineTransactionStatus(90, config), 'BLOCKED');
  assert.equal(determineTransactionStatus(70, config), 'FLAGGED');
  assert.equal(determineTransactionStatus(50, config), 'APPROVED');
});

test('evaluateRules: triggers baseline surge when amount far exceeds historical average', () => {
  const mockTx: Transaction = {
    id: 'TXN-TEST-1',
    accountId: 'ACC-1001',
    amount: 5000.0,
    currency: 'USD',
    merchantCategory: 'electronics',
    merchantName: 'BestBuy Online',
    deviceId: 'DEV-KNOWN',
    deviceType: 'mobile_ios',
    ipAddress: '192.168.1.1',
    country: 'US',
    cardLast4: '4242',
    timestamp: new Date().toISOString(),
    idempotencyKey: 'idem-1',
    channel: 'WEB',
  };

  const accountProfile = {
    accountId: 'ACC-1001',
    historicalBaselineMean: 200.0,
    historicalBaselineStd: 50.0,
    knownDevices: ['DEV-KNOWN'],
    knownCountries: ['US'],
  };

  const { ruleScore, signals } = evaluateRules(mockTx, accountProfile, [], [mockTx]);
  assert.ok(ruleScore >= 25, `Expected ruleScore >= 25, got ${ruleScore}`);
  assert.ok(signals.some((s) => s.code === 'AMOUNT_CRITICAL_BASELINE_SURGE' || s.code === 'AMOUNT_ABOVE_ACCOUNT_BASELINE'));
});

test('evaluateRules: detects shared device syndicate ring across accounts', () => {
  const now = new Date().toISOString();
  const mockTx: Transaction = {
    id: 'TXN-RING-1',
    accountId: 'ACC-NEW',
    amount: 150.0,
    currency: 'USD',
    merchantCategory: 'grocery',
    merchantName: 'Target Superstore',
    deviceId: 'DEV-SHARED-RING',
    deviceType: 'desktop_windows',
    ipAddress: '10.0.0.1',
    country: 'US',
    cardLast4: '1111',
    timestamp: now,
    idempotencyKey: 'idem-ring-1',
    channel: 'WEB',
  };

  // Seed multiple prior accounts using this device
  const priorTxs: Transaction[] = [
    { ...mockTx, id: 'TXN-RING-0', accountId: 'ACC-VICTIM-1' },
    { ...mockTx, id: 'TXN-RING-2', accountId: 'ACC-VICTIM-2' },
    { ...mockTx, id: 'TXN-RING-3', accountId: 'ACC-VICTIM-3' },
  ];

  const { signals } = evaluateRules(mockTx, undefined, [], [...priorTxs, mockTx]);
  assert.ok(
    signals.some((s) => s.code.includes('SYNDICATE') || s.code.includes('SHARED_HARDWARE')),
    'Expected syndicate shared device signal'
  );
});

test('assessTransaction: executes end-to-end multi-layer pipeline', () => {
  const normalTx: Transaction = {
    id: 'TXN-LEGIT-1',
    accountId: 'ACC-LEGIT',
    amount: 45.0,
    currency: 'USD',
    merchantCategory: 'grocery',
    merchantName: 'Whole Foods Market',
    deviceId: 'DEV-MY-PHONE',
    deviceType: 'mobile_ios',
    ipAddress: '1.2.3.4',
    country: 'US',
    cardLast4: '9999',
    timestamp: new Date().toISOString(),
    idempotencyKey: 'idem-legit',
    channel: 'MOBILE_APP',
  };

  const accountProfile = {
    accountId: 'ACC-LEGIT',
    historicalBaselineMean: 60.0,
    historicalBaselineStd: 15.0,
    knownDevices: ['DEV-MY-PHONE'],
    knownCountries: ['US'],
  };

  const assessment = assessTransaction(normalTx, accountProfile, [normalTx], [normalTx]);
  assert.ok(assessment.combinedScore < 45, `Expected low risk score for normal tx, got ${assessment.combinedScore}`);
  assert.equal(assessment.status, 'APPROVED');
  assert.ok(assessment.modelVersion.length > 0);
  assert.ok(Array.isArray(assessment.featureContributions));
});
