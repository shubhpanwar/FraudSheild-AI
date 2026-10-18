export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TransactionStatus = 'APPROVED' | 'FLAGGED' | 'BLOCKED';

export type MerchantCategory =
  | 'electronics'
  | 'crypto_exchange'
  | 'wire_transfer'
  | 'luxury_goods'
  | 'grocery'
  | 'entertainment'
  | 'travel'
  | 'gaming'
  | 'utilities';

export interface Transaction {
  id: string;
  accountId: string;
  accountName?: string;
  accountTier?: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  amount: number;
  currency: string;
  merchantCategory: MerchantCategory;
  merchantName: string;
  deviceId: string;
  deviceType: 'mobile_ios' | 'mobile_android' | 'desktop_mac' | 'desktop_windows' | 'linux_bot';
  ipAddress: string;
  country: string;
  cardLast4: string;
  timestamp: string; // ISO 8601 UTC
  idempotencyKey: string;
  channel: 'WEB' | 'MOBILE_APP' | 'API' | 'POS';
}

export interface RiskSignal {
  code: string;
  name: string;
  category: 'RULES' | 'ML_FEATURE' | 'NETWORK';
  severity: RiskLevel;
  scoreContribution: number; // points towards score (0-100)
  evidence: string;
  baselineValue?: string | number;
  observedValue?: string | number;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  value: number;
  weight: number;
  impact: 'increases_risk' | 'decreases_risk';
  description: string;
}

export interface AIExplanation {
  summary: string;
  keyDrivers: string[];
  evidencePoints: string[];
  syndicateHypothesis?: string;
  uncertaintyRating: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedActions: string[];
  generatedAt: string;
  modelUsed: string;
}

export interface RiskAssessment {
  transactionId: string;
  ruleScore: number; // 0-100
  modelScore: number; // 0-100
  modelProbability: number; // 0.0 - 1.0
  combinedScore: number; // 0-100
  riskLevel: RiskLevel;
  status: TransactionStatus;
  modelVersion: string;
  rulesVersion: string;
  assessedAt: string;
  signals: RiskSignal[];
  featureContributions: FeatureContribution[];
  aiExplanation?: AIExplanation;
}

export type CaseStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'CONFIRMED_FRAUD'
  | 'FALSE_POSITIVE'
  | 'ESCALATED'
  | 'RESOLVED';

export type CasePriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export interface CaseNote {
  id: string;
  author: string;
  createdAt: string;
  content: string;
  isSystemGenerated?: boolean;
}

export interface FraudCase {
  id: string;
  transactionId: string;
  transaction: Transaction;
  riskAssessment: RiskAssessment;
  status: CaseStatus;
  priority: CasePriority;
  assignedTo: string;
  openedAt: string;
  updatedAt: string;
  notes: CaseNote[];
  tags: string[];
  resolution?: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entityType: 'TRANSACTION' | 'CASE' | 'RULE_CONFIG' | 'MODEL_CONFIG';
  entityId: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'ACCOUNT' | 'DEVICE' | 'MERCHANT' | 'IP' | 'TRANSACTION';
  riskScore?: number;
  isFlagged?: boolean;
  cluster?: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  type: 'USES_DEVICE' | 'CONNECTS_FROM_IP' | 'PAYS_MERCHANT' | 'OWNS_TRANSACTION';
  isSuspicious?: boolean;
}

export interface NetworkGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface RulesConfig {
  amountBaselineMultiplier: number; // e.g. 3.0x
  rapidTransactionWindowMinutes: number; // e.g. 10 mins
  rapidTransactionCountThreshold: number; // e.g. 3 transactions
  sharedDeviceAccountThreshold: number; // e.g. 2 accounts
  ruleWeight: number; // e.g. 0.50
  mlWeight: number; // e.g. 0.50
  flagThreshold: number; // e.g. 65
  blockThreshold: number; // e.g. 85
  enabledRules: {
    baselineDeviation: boolean;
    rapidVelocity: boolean;
    unfamiliarDevice: boolean;
    sharedDeviceSyndicate: boolean;
    highRiskCategory: boolean;
    geoIpMismatch: boolean;
  };
}

export interface ModelPerformanceMetrics {
  version: string;
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucPr: number;
  rocAuc: number;
  falsePositiveRate: number;
  averageInferenceLatencyMs: number;
  totalEvaluated: number;
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  featuresImportance: { feature: string; importance: number }[];
}

export interface DashboardSummary {
  totalTransactions24h: number;
  totalAmountProcessed: number;
  flaggedTransactionsCount: number;
  blockedTransactionsCount: number;
  approvedTransactionsCount: number;
  fraudRatePercent: number;
  openCasesCount: number;
  avgRiskScore: number;
  activeSyndicatesCount: number;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  hourlyTrends: {
    hour: string;
    total: number;
    flagged: number;
    volume: number;
  }[];
}
