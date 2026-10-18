import type { Transaction, RiskSignal, RulesConfig } from '../types/fraud.ts';

export interface AccountProfile {
  accountId: string;
  historicalBaselineMean: number;
  historicalBaselineStd: number;
  knownDevices: string[];
  knownCountries: string[];
  lastTransactionTime?: string;
  lastCountry?: string;
}

export const DEFAULT_RULES_CONFIG: RulesConfig = {
  amountBaselineMultiplier: 3.0,
  rapidTransactionWindowMinutes: 10,
  rapidTransactionCountThreshold: 3,
  sharedDeviceAccountThreshold: 2,
  ruleWeight: 0.50,
  mlWeight: 0.50,
  flagThreshold: 65,
  blockThreshold: 85,
  enabledRules: {
    baselineDeviation: true,
    rapidVelocity: true,
    unfamiliarDevice: true,
    sharedDeviceSyndicate: true,
    highRiskCategory: true,
    geoIpMismatch: true,
  },
};

export function evaluateRules(
  currentTx: Transaction,
  accountProfile: AccountProfile | undefined,
  recentAccountTransactions: Transaction[],
  allRecentTransactions: Transaction[],
  config: RulesConfig = DEFAULT_RULES_CONFIG
): { ruleScore: number; signals: RiskSignal[] } {
  const signals: RiskSignal[] = [];

  const baselineMean = accountProfile?.historicalBaselineMean ?? 350.0;
  const knownDevices = new Set(accountProfile?.knownDevices ?? []);
  const knownCountries = new Set(accountProfile?.knownCountries ?? ['US']);

  // Rule 1: Amount above account historical baseline
  if (config.enabledRules.baselineDeviation) {
    const ratio = currentTx.amount / (baselineMean > 0 ? baselineMean : 1);
    if (ratio >= config.amountBaselineMultiplier * 2.5) {
      // Very extreme deviation
      signals.push({
        code: 'AMOUNT_CRITICAL_BASELINE_SURGE',
        name: 'Critical Historical Baseline Surge',
        category: 'RULES',
        severity: 'CRITICAL',
        scoreContribution: 40,
        evidence: `Transaction amount $${currentTx.amount.toFixed(2)} is ${(ratio).toFixed(1)}x higher than account 90-day baseline mean ($${baselineMean.toFixed(2)})`,
        baselineValue: `$${baselineMean.toFixed(2)}`,
        observedValue: `$${currentTx.amount.toFixed(2)}`,
      });
    } else if (ratio >= config.amountBaselineMultiplier) {
      signals.push({
        code: 'AMOUNT_ABOVE_ACCOUNT_BASELINE',
        name: 'Amount Substantially Above Baseline',
        category: 'RULES',
        severity: 'HIGH',
        scoreContribution: 25,
        evidence: `Transaction amount $${currentTx.amount.toFixed(2)} exceeds ${(config.amountBaselineMultiplier)}x account historical mean ($${baselineMean.toFixed(2)})`,
        baselineValue: `$${baselineMean.toFixed(2)}`,
        observedValue: `$${currentTx.amount.toFixed(2)}`,
      });
    }
  }

  // Rule 2: Rapid velocity window check
  if (config.enabledRules.rapidVelocity) {
    const currentMs = new Date(currentTx.timestamp).getTime();
    const windowMs = config.rapidTransactionWindowMinutes * 60 * 1000;
    const windowStart = currentMs - windowMs;

    const inWindow = recentAccountTransactions.filter(
      (tx) => tx.id !== currentTx.id && new Date(tx.timestamp).getTime() >= windowStart
    );

    if (inWindow.length >= config.rapidTransactionCountThreshold * 2) {
      signals.push({
        code: 'CRITICAL_VELOCITY_BURST',
        name: 'Rapid High-Frequency Transaction Burst',
        category: 'RULES',
        severity: 'CRITICAL',
        scoreContribution: 35,
        evidence: `${inWindow.length + 1} transactions executed in past ${config.rapidTransactionWindowMinutes} minutes (Threshold: ${config.rapidTransactionCountThreshold})`,
        baselineValue: `Max ${config.rapidTransactionCountThreshold} per ${config.rapidTransactionWindowMinutes}m`,
        observedValue: `${inWindow.length + 1} transactions`,
      });
    } else if (inWindow.length >= config.rapidTransactionCountThreshold) {
      signals.push({
        code: 'RAPID_TRANSACTION_PATTERN',
        name: 'Elevated Velocity Spike',
        category: 'RULES',
        severity: 'HIGH',
        scoreContribution: 22,
        evidence: `${inWindow.length + 1} transactions detected within a ${config.rapidTransactionWindowMinutes}-minute window`,
        baselineValue: `Normal <= 1 tx`,
        observedValue: `${inWindow.length + 1} transactions`,
      });
    }
  }

  // Rule 3: Unfamiliar device fingerprint
  if (config.enabledRules.unfamiliarDevice) {
    if (knownDevices.size > 0 && !knownDevices.has(currentTx.deviceId)) {
      signals.push({
        code: 'UNFAMILIAR_DEVICE_HARDWARE',
        name: 'Unfamiliar Device Fingerprint',
        category: 'RULES',
        severity: 'MEDIUM',
        scoreContribution: 18,
        evidence: `Device ${currentTx.deviceId} (${currentTx.deviceType}) has never been authorized or recorded in synthetic account history`,
        baselineValue: Array.from(knownDevices).join(', '),
        observedValue: currentTx.deviceId,
      });
    }
  }

  // Rule 4: Shared device syndicate check (multiple distinct accounts on same hardware)
  if (config.enabledRules.sharedDeviceSyndicate) {
    const accountsUsingDevice = new Set(
      allRecentTransactions
        .filter((tx) => tx.deviceId === currentTx.deviceId)
        .map((tx) => tx.accountId)
    );
    // Include current account
    accountsUsingDevice.add(currentTx.accountId);

    if (accountsUsingDevice.size > config.sharedDeviceAccountThreshold * 1.5) {
      signals.push({
        code: 'COORDINATED_SYNDICATE_DEVICE_RING',
        name: 'Syndicate Multi-Account Device Ring',
        category: 'NETWORK',
        severity: 'CRITICAL',
        scoreContribution: 45,
        evidence: `Device ${currentTx.deviceId} is actively shared across ${accountsUsingDevice.size} distinct accounts (${Array.from(accountsUsingDevice).slice(0, 4).join(', ')})`,
        baselineValue: '1 account per device',
        observedValue: `${accountsUsingDevice.size} accounts shared`,
      });
    } else if (accountsUsingDevice.size >= config.sharedDeviceAccountThreshold) {
      signals.push({
        code: 'SHARED_HARDWARE_MULTI_ACCOUNT',
        name: 'Shared Hardware Across Accounts',
        category: 'NETWORK',
        severity: 'HIGH',
        scoreContribution: 25,
        evidence: `Device ${currentTx.deviceId} has been linked to ${accountsUsingDevice.size} different customer accounts`,
        baselineValue: 'Single account',
        observedValue: `${accountsUsingDevice.size} accounts`,
      });
    }
  }

  // Rule 5: High-risk merchant category & high ticket size
  if (config.enabledRules.highRiskCategory) {
    const highRiskCategories = ['crypto_exchange', 'wire_transfer', 'gaming', 'luxury_goods'];
    if (highRiskCategories.includes(currentTx.merchantCategory) && currentTx.amount > 1000) {
      signals.push({
        code: 'HIGH_RISK_MERCHANT_OUTFLOW',
        name: 'High-Risk Merchant Capital Outflow',
        category: 'RULES',
        severity: currentTx.amount > 5000 ? 'HIGH' : 'MEDIUM',
        scoreContribution: currentTx.amount > 5000 ? 25 : 15,
        evidence: `High-value outflow of $${currentTx.amount.toFixed(2)} directed to elevated-risk category [${currentTx.merchantCategory.toUpperCase()}] at ${currentTx.merchantName}`,
        baselineValue: 'Standard retail',
        observedValue: currentTx.merchantCategory,
      });
    }
  }

  // Rule 6: Geo-location velocity impossibility
  if (config.enabledRules.geoIpMismatch) {
    if (accountProfile?.lastTransactionTime && accountProfile?.lastCountry) {
      const prevMs = new Date(accountProfile.lastTransactionTime).getTime();
      const currMs = new Date(currentTx.timestamp).getTime();
      const diffMinutes = Math.abs(currMs - prevMs) / (60 * 1000);

      if (accountProfile.lastCountry !== currentTx.country && diffMinutes < 120) {
        signals.push({
          code: 'GEO_VELOCITY_IMPOSSIBILITY',
          name: 'Impossible Geographic Velocity',
          category: 'RULES',
          severity: 'CRITICAL',
          scoreContribution: 40,
          evidence: `Transaction initiated in ${currentTx.country} just ${diffMinutes.toFixed(0)}m after activity in ${accountProfile.lastCountry} (physical travel impossible)`,
          baselineValue: `Origin ${accountProfile.lastCountry}`,
          observedValue: `Origin ${currentTx.country} (${diffMinutes.toFixed(0)}m elapsed)`,
        });
      }
    } else if (knownCountries.size > 0 && !knownCountries.has(currentTx.country)) {
      signals.push({
        code: 'UNFAMILIAR_COUNTRY_ORIGIN',
        name: 'Unfamiliar Country of Origin',
        category: 'RULES',
        severity: 'MEDIUM',
        scoreContribution: 16,
        evidence: `Transaction country [${currentTx.country}] not observed in historical profile`,
        baselineValue: Array.from(knownCountries).join(', '),
        observedValue: currentTx.country,
      });
    }
  }

  // Calculate raw rule score as saturated sum
  const rawSum = signals.reduce((acc, s) => acc + s.scoreContribution, 0);
  const ruleScore = Math.min(100, Math.max(0, rawSum));

  return { ruleScore, signals };
}
