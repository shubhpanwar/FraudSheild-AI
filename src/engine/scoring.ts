import type { Transaction, RiskAssessment, RiskLevel, TransactionStatus, RulesConfig } from '../types/fraud.ts';
import type { AccountProfile } from './rules.ts';
import { DEFAULT_RULES_CONFIG, evaluateRules } from './rules.ts';
import { predictFraudProbability } from './mlModel.ts';

export function calculateCombinedScore(
  ruleScore: number,
  modelScore: number,
  weights: { ruleWeight: number; mlWeight: number }
): number {
  const normRuleWeight = weights.ruleWeight / (weights.ruleWeight + weights.mlWeight || 1);
  const normMlWeight = weights.mlWeight / (weights.ruleWeight + weights.mlWeight || 1);

  const combined = normRuleWeight * ruleScore + normMlWeight * modelScore;
  return Math.min(100, Math.max(0, Math.round(combined)));
}

export function determineRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

export function determineTransactionStatus(
  score: number,
  config: RulesConfig = DEFAULT_RULES_CONFIG
): TransactionStatus {
  if (score >= config.blockThreshold) return 'BLOCKED';
  if (score >= config.flagThreshold) return 'FLAGGED';
  return 'APPROVED';
}

export function assessTransaction(
  tx: Transaction,
  accountProfile: AccountProfile | undefined,
  recentAccountTxs: Transaction[],
  allRecentTxs: Transaction[],
  config: RulesConfig = DEFAULT_RULES_CONFIG
): RiskAssessment {
  // Layer 1: Evaluate deterministic rules
  const { ruleScore, signals } = evaluateRules(
    tx,
    accountProfile,
    recentAccountTxs,
    allRecentTxs,
    config
  );

  // Layer 2: Evaluate ML model
  const mlResult = predictFraudProbability(
    tx,
    accountProfile,
    recentAccountTxs,
    allRecentTxs
  );

  // Layer 3: Calculate combined score
  const combinedScore = calculateCombinedScore(ruleScore, mlResult.modelScore, {
    ruleWeight: config.ruleWeight,
    mlWeight: config.mlWeight,
  });

  const riskLevel = determineRiskLevel(combinedScore);
  const status = determineTransactionStatus(combinedScore, config);

  return {
    transactionId: tx.id,
    ruleScore,
    modelScore: mlResult.modelScore,
    modelProbability: mlResult.modelProbability,
    combinedScore,
    riskLevel,
    status,
    modelVersion: mlResult.modelVersion,
    rulesVersion: 'rules-v2.1',
    assessedAt: new Date().toISOString(),
    signals,
    featureContributions: mlResult.featureContributions,
  };
}
