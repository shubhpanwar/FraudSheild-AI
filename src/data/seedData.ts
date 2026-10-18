import type { Transaction, FraudCase, AuditEvent, NetworkGraphData, GraphNode, GraphLink } from '../types/fraud.ts';
import type { AccountProfile } from '../engine/rules.ts';
import { assessTransaction } from '../engine/scoring.ts';

export const SEED_ACCOUNT_PROFILES: Record<string, AccountProfile> = {
  'ACC-1007': {
    accountId: 'ACC-1007',
    historicalBaselineMean: 145.0,
    historicalBaselineStd: 42.0,
    knownDevices: ['DEV-PHONE-1007'],
    knownCountries: ['US'],
    lastTransactionTime: '2026-10-18T01:10:00Z',
    lastCountry: 'US',
  },
  'ACC-2041': {
    accountId: 'ACC-2041',
    historicalBaselineMean: 210.0,
    historicalBaselineStd: 65.0,
    knownDevices: ['DEV-PHONE-2041'],
    knownCountries: ['GB'],
    lastTransactionTime: '2026-10-18T02:00:00Z',
    lastCountry: 'GB',
  },
  'ACC-3108': {
    accountId: 'ACC-3108',
    historicalBaselineMean: 320.0,
    historicalBaselineStd: 80.0,
    knownDevices: ['DEV-PHONE-3108'],
    knownCountries: ['CA'],
    lastTransactionTime: '2026-10-18T02:15:00Z',
    lastCountry: 'CA',
  },
  'ACC-4092': {
    accountId: 'ACC-4092',
    historicalBaselineMean: 190.0,
    historicalBaselineStd: 50.0,
    knownDevices: ['DEV-PHONE-4092'],
    knownCountries: ['DE'],
    lastTransactionTime: '2026-10-18T02:20:00Z',
    lastCountry: 'DE',
  },
  'ACC-5120': {
    accountId: 'ACC-5120',
    historicalBaselineMean: 85.0,
    historicalBaselineStd: 25.0,
    knownDevices: ['DEV-BOT-5120'],
    knownCountries: ['US'],
    lastTransactionTime: '2026-10-18T02:40:00Z',
    lastCountry: 'US',
  },
  'ACC-6780': {
    accountId: 'ACC-6780',
    historicalBaselineMean: 3500.0,
    historicalBaselineStd: 900.0,
    knownDevices: ['DEV-MAC-CORP-01', 'DEV-PHONE-6780'],
    knownCountries: ['US'],
    lastTransactionTime: '2026-10-18T00:30:00Z',
    lastCountry: 'US',
  },
  'ACC-7891': {
    accountId: 'ACC-7891',
    historicalBaselineMean: 250.0,
    historicalBaselineStd: 70.0,
    knownDevices: ['DEV-LAPTOP-7891'],
    knownCountries: ['JP'],
    lastTransactionTime: '2026-10-18T02:10:00Z',
    lastCountry: 'JP',
  },
  'ACC-8902': {
    accountId: 'ACC-8902',
    historicalBaselineMean: 95.0,
    historicalBaselineStd: 30.0,
    knownDevices: ['DEV-PHONE-8902'],
    knownCountries: ['US'],
    lastTransactionTime: '2026-10-17T22:15:00Z',
    lastCountry: 'US',
  },
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // 1. Critical Syndicate Device Ring: DEV-204 used across ACC-2041, ACC-3108, ACC-4092, and ACC-1007
  {
    id: 'TXN-9001',
    accountId: 'ACC-1007',
    accountName: 'Ananya Patel',
    accountTier: 'STANDARD',
    amount: 4850.0,
    currency: 'USD',
    merchantCategory: 'electronics',
    merchantName: 'Apex Electronics Direct',
    deviceId: 'DEV-204',
    deviceType: 'desktop_windows',
    ipAddress: '198.51.100.44',
    country: 'US',
    cardLast4: '4892',
    timestamp: '2026-10-18T02:50:12Z',
    idempotencyKey: 'idem-9001-f92e',
    channel: 'WEB',
  },
  {
    id: 'TXN-9002',
    accountId: 'ACC-2041',
    accountName: 'Marcus Vance',
    accountTier: 'STANDARD',
    amount: 2950.0,
    currency: 'USD',
    merchantCategory: 'crypto_exchange',
    merchantName: 'BitNexus Prime Exchange',
    deviceId: 'DEV-204',
    deviceType: 'desktop_windows',
    ipAddress: '198.51.100.44',
    country: 'US',
    cardLast4: '7721',
    timestamp: '2026-10-18T02:44:05Z',
    idempotencyKey: 'idem-9002-c11a',
    channel: 'WEB',
  },
  {
    id: 'TXN-9003',
    accountId: 'ACC-3108',
    accountName: 'Elena Rostova',
    accountTier: 'STANDARD',
    amount: 3400.0,
    currency: 'USD',
    merchantCategory: 'wire_transfer',
    merchantName: 'RemitFlow International',
    deviceId: 'DEV-204',
    deviceType: 'desktop_windows',
    ipAddress: '198.51.100.44',
    country: 'US',
    cardLast4: '3319',
    timestamp: '2026-10-18T02:38:20Z',
    idempotencyKey: 'idem-9003-a44b',
    channel: 'WEB',
  },
  {
    id: 'TXN-9004',
    accountId: 'ACC-4092',
    accountName: 'Tariq Al-Mansoor',
    accountTier: 'STANDARD',
    amount: 2800.0,
    currency: 'USD',
    merchantCategory: 'luxury_goods',
    merchantName: 'Grand Jewelers Geneva',
    deviceId: 'DEV-204',
    deviceType: 'desktop_windows',
    ipAddress: '198.51.100.44',
    country: 'US',
    cardLast4: '8840',
    timestamp: '2026-10-18T02:30:15Z',
    idempotencyKey: 'idem-9004-98fd',
    channel: 'WEB',
  },

  // 2. Rapid Velocity Burst / Card Testing on ACC-5120
  {
    id: 'TXN-8810',
    accountId: 'ACC-5120',
    accountName: 'David Miller',
    accountTier: 'STANDARD',
    amount: 890.0,
    currency: 'USD',
    merchantCategory: 'gaming',
    merchantName: 'Steam Digital Vault',
    deviceId: 'DEV-BOT-5120',
    deviceType: 'linux_bot',
    ipAddress: '203.0.113.88',
    country: 'US',
    cardLast4: '1092',
    timestamp: '2026-10-18T02:48:00Z',
    idempotencyKey: 'idem-8810-01',
    channel: 'API',
  },
  {
    id: 'TXN-8809',
    accountId: 'ACC-5120',
    accountName: 'David Miller',
    accountTier: 'STANDARD',
    amount: 750.0,
    currency: 'USD',
    merchantCategory: 'gaming',
    merchantName: 'Steam Digital Vault',
    deviceId: 'DEV-BOT-5120',
    deviceType: 'linux_bot',
    ipAddress: '203.0.113.88',
    country: 'US',
    cardLast4: '1092',
    timestamp: '2026-10-18T02:46:20Z',
    idempotencyKey: 'idem-8809-02',
    channel: 'API',
  },
  {
    id: 'TXN-8808',
    accountId: 'ACC-5120',
    accountName: 'David Miller',
    accountTier: 'STANDARD',
    amount: 620.0,
    currency: 'USD',
    merchantCategory: 'gaming',
    merchantName: 'Steam Digital Vault',
    deviceId: 'DEV-BOT-5120',
    deviceType: 'linux_bot',
    ipAddress: '203.0.113.88',
    country: 'US',
    cardLast4: '1092',
    timestamp: '2026-10-18T02:44:10Z',
    idempotencyKey: 'idem-8808-03',
    channel: 'API',
  },
  {
    id: 'TXN-8807',
    accountId: 'ACC-5120',
    accountName: 'David Miller',
    accountTier: 'STANDARD',
    amount: 510.0,
    currency: 'USD',
    merchantCategory: 'gaming',
    merchantName: 'Steam Digital Vault',
    deviceId: 'DEV-BOT-5120',
    deviceType: 'linux_bot',
    ipAddress: '203.0.113.88',
    country: 'US',
    cardLast4: '1092',
    timestamp: '2026-10-18T02:42:00Z',
    idempotencyKey: 'idem-8807-04',
    channel: 'API',
  },

  // 3. Impossible Geo-Velocity: ACC-7891 in GB only 35 minutes after Japan
  {
    id: 'TXN-7750',
    accountId: 'ACC-7891',
    accountName: 'Lucas Silva',
    accountTier: 'STANDARD',
    amount: 1850.0,
    currency: 'GBP',
    merchantCategory: 'electronics',
    merchantName: 'Currys London Megastore',
    deviceId: 'DEV-UNKNOWN-991',
    deviceType: 'mobile_android',
    ipAddress: '81.2.69.142',
    country: 'GB',
    cardLast4: '6523',
    timestamp: '2026-10-18T02:45:00Z',
    idempotencyKey: 'idem-7750-geo',
    channel: 'POS',
  },

  // 4. Legitimate High-Volume Corporate Transactions (ACC-6780)
  {
    id: 'TXN-6601',
    accountId: 'ACC-6780',
    accountName: 'Sarah Jenkins',
    accountTier: 'ENTERPRISE',
    amount: 4200.0,
    currency: 'USD',
    merchantCategory: 'electronics',
    merchantName: 'Dell Enterprise Cloud Systems',
    deviceId: 'DEV-MAC-CORP-01',
    deviceType: 'desktop_mac',
    ipAddress: '12.180.45.10',
    country: 'US',
    cardLast4: '9012',
    timestamp: '2026-10-18T01:55:00Z',
    idempotencyKey: 'idem-6601-legit',
    channel: 'WEB',
  },
  {
    id: 'TXN-6602',
    accountId: 'ACC-6780',
    accountName: 'Sarah Jenkins',
    accountTier: 'ENTERPRISE',
    amount: 2800.0,
    currency: 'USD',
    merchantCategory: 'travel',
    merchantName: 'United Airlines Corporate',
    deviceId: 'DEV-PHONE-6780',
    deviceType: 'mobile_ios',
    ipAddress: '12.180.45.10',
    country: 'US',
    cardLast4: '9012',
    timestamp: '2026-10-18T00:20:00Z',
    idempotencyKey: 'idem-6602-legit',
    channel: 'MOBILE_APP',
  },

  // 5. Legitimate Daily Consumers (ACC-8902 & Others)
  {
    id: 'TXN-5501',
    accountId: 'ACC-8902',
    accountName: 'Aiden Wright',
    accountTier: 'STANDARD',
    amount: 84.5,
    currency: 'USD',
    merchantCategory: 'grocery',
    merchantName: 'Trader Joe’s #54',
    deviceId: 'DEV-PHONE-8902',
    deviceType: 'mobile_ios',
    ipAddress: '73.189.22.4',
    country: 'US',
    cardLast4: '3411',
    timestamp: '2026-10-18T02:15:30Z',
    idempotencyKey: 'idem-5501',
    channel: 'POS',
  },
  {
    id: 'TXN-5502',
    accountId: 'ACC-8902',
    accountName: 'Aiden Wright',
    accountTier: 'STANDARD',
    amount: 14.99,
    currency: 'USD',
    merchantCategory: 'entertainment',
    merchantName: 'Netflix Subscription',
    deviceId: 'DEV-PHONE-8902',
    deviceType: 'mobile_ios',
    ipAddress: '73.189.22.4',
    country: 'US',
    cardLast4: '3411',
    timestamp: '2026-10-18T01:05:00Z',
    idempotencyKey: 'idem-5502',
    channel: 'WEB',
  },
  {
    id: 'TXN-5503',
    accountId: 'ACC-1007',
    accountName: 'Ananya Patel',
    accountTier: 'STANDARD',
    amount: 45.2,
    currency: 'USD',
    merchantCategory: 'grocery',
    merchantName: 'Safeway Grocery Online',
    deviceId: 'DEV-PHONE-1007',
    deviceType: 'mobile_ios',
    ipAddress: '68.105.12.9',
    country: 'US',
    cardLast4: '4892',
    timestamp: '2026-10-18T00:45:10Z',
    idempotencyKey: 'idem-5503',
    channel: 'MOBILE_APP',
  },
  {
    id: 'TXN-5504',
    accountId: 'ACC-3108',
    accountName: 'Elena Rostova',
    accountTier: 'STANDARD',
    amount: 120.0,
    currency: 'CAD',
    merchantCategory: 'utilities',
    merchantName: 'Hydro-Quebec Power',
    deviceId: 'DEV-PHONE-3108',
    deviceType: 'mobile_android',
    ipAddress: '142.250.80.3',
    country: 'CA',
    cardLast4: '3319',
    timestamp: '2026-10-17T23:30:00Z',
    idempotencyKey: 'idem-5504',
    channel: 'WEB',
  },
  {
    id: 'TXN-5505',
    accountId: 'ACC-2041',
    accountName: 'Marcus Vance',
    accountTier: 'STANDARD',
    amount: 65.0,
    currency: 'GBP',
    merchantCategory: 'travel',
    merchantName: 'Transport for London Oyster',
    deviceId: 'DEV-PHONE-2041',
    deviceType: 'mobile_ios',
    ipAddress: '82.165.197.1',
    country: 'GB',
    cardLast4: '7721',
    timestamp: '2026-10-17T22:50:00Z',
    idempotencyKey: 'idem-5505',
    channel: 'POS',
  },
];

export function buildInitialCases(transactions: Transaction[]): FraudCase[] {
  const cases: FraudCase[] = [];

  for (const tx of transactions) {
    const profile = SEED_ACCOUNT_PROFILES[tx.accountId];
    const assessment = assessTransaction(
      tx,
      profile,
      transactions.filter((t) => t.accountId === tx.accountId),
      transactions
    );

    if (assessment.status === 'FLAGGED' || assessment.status === 'BLOCKED') {
      const isCritical = assessment.riskLevel === 'CRITICAL';
      const caseId = `CASE-${cases.length + 101}`;

      cases.push({
        id: caseId,
        transactionId: tx.id,
        transaction: tx,
        riskAssessment: assessment,
        status: isCritical ? 'OPEN' : 'INVESTIGATING',
        priority: isCritical ? 'P1_CRITICAL' : 'P2_HIGH',
        assignedTo: isCritical ? 'Senior Analyst (Sarah K.)' : 'Fraud Triage Pool',
        openedAt: tx.timestamp,
        updatedAt: tx.timestamp,
        tags: assessment.signals.map((s) => s.code),
        notes: [
          {
            id: `note-${caseId}-init`,
            author: 'FraudShield Automated Monitor',
            createdAt: tx.timestamp,
            content: `Case created automatically. Risk Score: ${assessment.combinedScore}/100 [${assessment.riskLevel}]. Top signal: ${assessment.signals[0]?.name ?? 'Unusual pattern'}`,
            isSystemGenerated: true,
          },
        ],
      });
    }
  }

  return cases;
}

export const INITIAL_AUDIT_LOG: AuditEvent[] = [
  {
    id: 'AUD-001',
    actor: 'system.engine',
    action: 'SYSTEM_BOOTSTRAP',
    entityType: 'MODEL_CONFIG',
    entityId: 'FraudXGB-Ensemble-v2.4',
    timestamp: '2026-10-18T00:00:00Z',
    details: { version: 'FraudXGB-Ensemble-v2.4', weights: { ruleWeight: 0.5, mlWeight: 0.5 } },
  },
  {
    id: 'AUD-002',
    actor: 'system.rules',
    action: 'FLAG_TRANSACTION',
    entityType: 'TRANSACTION',
    entityId: 'TXN-9001',
    timestamp: '2026-10-18T02:50:12Z',
    details: { score: 92, riskLevel: 'CRITICAL', signalsCount: 3 },
  },
  {
    id: 'AUD-003',
    actor: 'system.rules',
    action: 'FLAG_TRANSACTION',
    entityType: 'TRANSACTION',
    entityId: 'TXN-9002',
    timestamp: '2026-10-18T02:44:05Z',
    details: { score: 88, riskLevel: 'CRITICAL', signalsCount: 2 },
  },
  {
    id: 'AUD-004',
    actor: 'analyst.sarah_k',
    action: 'CASE_ASSIGNED',
    entityType: 'CASE',
    entityId: 'CASE-101',
    timestamp: '2026-10-18T02:52:00Z',
    details: { assignedTo: 'Senior Analyst (Sarah K.)', status: 'INVESTIGATING' },
  },
];

export function generateNetworkGraphData(transactions: Transaction[]): NetworkGraphData {
  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  // Count device usage to flag shared devices
  const deviceAccounts = new Map<string, Set<string>>();
  for (const tx of transactions) {
    if (!deviceAccounts.has(tx.deviceId)) {
      deviceAccounts.set(tx.deviceId, new Set());
    }
    deviceAccounts.get(tx.deviceId)!.add(tx.accountId);
  }

  for (const tx of transactions) {
    // 1. Account Node
    const accNodeId = `acc:${tx.accountId}`;
    if (!nodeMap.has(accNodeId)) {
      nodeMap.set(accNodeId, {
        id: accNodeId,
        label: tx.accountName ? `${tx.accountId} (${tx.accountName.split(' ')[0]})` : tx.accountId,
        type: 'ACCOUNT',
        subtitle: tx.accountTier ?? 'ACCOUNT',
        metadata: { accountId: tx.accountId, tier: tx.accountTier, name: tx.accountName },
      });
    }

    // 2. Device Node
    const devNodeId = `dev:${tx.deviceId}`;
    const sharedCount = deviceAccounts.get(tx.deviceId)?.size ?? 1;
    const isDeviceSuspicious = sharedCount >= 2;

    if (!nodeMap.has(devNodeId)) {
      nodeMap.set(devNodeId, {
        id: devNodeId,
        label: tx.deviceId,
        type: 'DEVICE',
        isFlagged: isDeviceSuspicious,
        subtitle: isDeviceSuspicious ? `SHARED (${sharedCount} accounts)` : tx.deviceType,
        metadata: { deviceId: tx.deviceId, deviceType: tx.deviceType, accountsLinked: sharedCount },
      });
    }

    // 3. Merchant Node
    const merchNodeId = `merch:${tx.merchantName.replace(/\s+/g, '_')}`;
    if (!nodeMap.has(merchNodeId)) {
      nodeMap.set(merchNodeId, {
        id: merchNodeId,
        label: tx.merchantName,
        type: 'MERCHANT',
        subtitle: tx.merchantCategory.toUpperCase(),
        metadata: { category: tx.merchantCategory },
      });
    }

    // 4. IP Node
    const ipNodeId = `ip:${tx.ipAddress}`;
    if (!nodeMap.has(ipNodeId)) {
      nodeMap.set(ipNodeId, {
        id: ipNodeId,
        label: tx.ipAddress,
        type: 'IP',
        subtitle: `${tx.country}`,
        metadata: { ip: tx.ipAddress, country: tx.country },
      });
    }

    // 5. Transaction Node (for key flagged or recent txs)
    const txNodeId = `tx:${tx.id}`;
    const isHighAmount = tx.amount > 1000;
    if (!nodeMap.has(txNodeId)) {
      nodeMap.set(txNodeId, {
        id: txNodeId,
        label: `${tx.id} ($${tx.amount.toFixed(0)})`,
        type: 'TRANSACTION',
        isFlagged: isHighAmount,
        subtitle: tx.merchantCategory,
        metadata: { amount: tx.amount, currency: tx.currency, status: isHighAmount ? 'FLAGGED' : 'NORMAL' },
      });
    }

    // Add Edges
    links.push({
      source: accNodeId,
      target: devNodeId,
      label: 'uses',
      type: 'USES_DEVICE',
      isSuspicious: isDeviceSuspicious,
    });

    links.push({
      source: accNodeId,
      target: txNodeId,
      label: 'initiates',
      type: 'OWNS_TRANSACTION',
      isSuspicious: isHighAmount,
    });

    links.push({
      source: txNodeId,
      target: merchNodeId,
      label: `$${tx.amount.toFixed(0)}`,
      type: 'PAYS_MERCHANT',
      isSuspicious: isHighAmount,
    });

    links.push({
      source: devNodeId,
      target: ipNodeId,
      label: 'ip',
      type: 'CONNECTS_FROM_IP',
      isSuspicious: isDeviceSuspicious,
    });
  }

  // Deduplicate links
  const linkKeySet = new Set<string>();
  const uniqueLinks: GraphLink[] = [];
  for (const l of links) {
    const key = `${l.source}->${l.target}:${l.type}`;
    if (!linkKeySet.has(key)) {
      linkKeySet.add(key);
      uniqueLinks.push(l);
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links: uniqueLinks,
  };
}
