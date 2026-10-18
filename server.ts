import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_TRANSACTIONS,
  SEED_ACCOUNT_PROFILES,
  buildInitialCases,
  INITIAL_AUDIT_LOG,
  generateNetworkGraphData,
} from './src/data/seedData.ts';
import { assessTransaction } from './src/engine/scoring.ts';
import { DEFAULT_RULES_CONFIG } from './src/engine/rules.ts';
import { BENCHMARK_MODEL_METRICS } from './src/engine/mlModel.ts';
import type {
  Transaction,
  FraudCase,
  AuditEvent,
  RulesConfig,
  DashboardSummary,
  RiskAssessment,
  AIExplanation,
} from './src/types/fraud.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-Memory Database store with seed data
let transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
let cases: FraudCase[] = buildInitialCases(transactions);
let auditEvents: AuditEvent[] = [...INITIAL_AUDIT_LOG];
let rulesConfig: RulesConfig = { ...DEFAULT_RULES_CONFIG };

// Cache of risk assessments for transactions
const assessmentsMap = new Map<string, RiskAssessment>();

function getOrComputeAssessment(tx: Transaction): RiskAssessment {
  const existing = assessmentsMap.get(tx.id);
  if (existing) return existing;

  const profile = SEED_ACCOUNT_PROFILES[tx.accountId];
  const assessment = assessTransaction(
    tx,
    profile,
    transactions.filter((t) => t.accountId === tx.accountId),
    transactions,
    rulesConfig
  );
  assessmentsMap.set(tx.id, assessment);
  return assessment;
}

// Pre-populate assessments for initial transactions
transactions.forEach((tx) => getOrComputeAssessment(tx));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for logging audit events
function logAudit(
  actor: string,
  action: string,
  entityType: AuditEvent['entityType'],
  entityId: string,
  details: Record<string, unknown>
) {
  const event: AuditEvent = {
    id: `AUD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
    actor,
    action,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    details,
  };
  auditEvents.unshift(event);
  if (auditEvents.length > 200) auditEvents.pop();
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Transactions List with filtering & pagination
app.get('/api/v1/transactions', (req: Request, res: Response) => {
  const { status, riskLevel, search, merchantCategory, page = '1', limit = '20' } = req.query;

  let filtered = [...transactions];

  // Map to include assessments for filtering
  const withAssessments = filtered.map((tx) => ({
    tx,
    assessment: getOrComputeAssessment(tx),
  }));

  let results = withAssessments;

  if (status && typeof status === 'string' && status !== 'ALL') {
    results = results.filter((item) => item.assessment.status === status);
  }

  if (riskLevel && typeof riskLevel === 'string' && riskLevel !== 'ALL') {
    results = results.filter((item) => item.assessment.riskLevel === riskLevel);
  }

  if (merchantCategory && typeof merchantCategory === 'string' && merchantCategory !== 'ALL') {
    results = results.filter((item) => item.tx.merchantCategory === merchantCategory);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.tx.id.toLowerCase().includes(q) ||
        item.tx.accountId.toLowerCase().includes(q) ||
        (item.tx.accountName && item.tx.accountName.toLowerCase().includes(q)) ||
        item.tx.deviceId.toLowerCase().includes(q) ||
        item.tx.merchantName.toLowerCase().includes(q) ||
        item.tx.cardLast4.includes(q)
    );
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const total = results.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = results.slice(startIndex, startIndex + limitNum);

  res.json({
    data: paginated.map((item) => ({
      ...item.tx,
      assessment: item.assessment,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// 2. Transaction Detail
app.get('/api/v1/transactions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const tx = transactions.find((t) => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const assessment = getOrComputeAssessment(tx);
  const relatedAccountTxs = transactions.filter(
    (t) => t.accountId === tx.accountId && t.id !== tx.id
  );
  const relatedDeviceTxs = transactions.filter(
    (t) => t.deviceId === tx.deviceId && t.id !== tx.id
  );

  const existingCase = cases.find((c) => c.transactionId === tx.id);

  res.json({
    transaction: tx,
    assessment,
    existingCaseId: existingCase?.id ?? null,
    relatedActivity: {
      accountHistoryCount: relatedAccountTxs.length,
      deviceSharedAccountsCount: new Set(relatedDeviceTxs.map((t) => t.accountId)).size,
      recentAccountTxs: relatedAccountTxs.slice(0, 5),
      recentDeviceTxs: relatedDeviceTxs.slice(0, 5),
    },
  });
});

// 3. Transaction Risk Assessment
app.get('/api/v1/transactions/:id/risk', (req: Request, res: Response) => {
  const { id } = req.params;
  const tx = transactions.find((t) => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  const assessment = getOrComputeAssessment(tx);
  res.json(assessment);
});

// 4. Submit and Ingest New Transaction
app.post('/api/v1/transactions', (req: Request, res: Response) => {
  const body = req.body;

  // Basic validation
  if (!body.accountId || body.amount === undefined || !body.merchantCategory || !body.deviceId) {
    return res.status(400).json({
      error: 'Missing required fields: accountId, amount, merchantCategory, deviceId',
    });
  }

  const newTx: Transaction = {
    id: body.id || `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    accountId: body.accountId,
    accountName: body.accountName || `Customer ${body.accountId}`,
    accountTier: body.accountTier || 'STANDARD',
    amount: parseFloat(body.amount),
    currency: body.currency || 'USD',
    merchantCategory: body.merchantCategory,
    merchantName: body.merchantName || 'Merchant Partner',
    deviceId: body.deviceId,
    deviceType: body.deviceType || 'mobile_ios',
    ipAddress: body.ipAddress || '198.51.100.12',
    country: body.country || 'US',
    cardLast4: body.cardLast4 || '4242',
    timestamp: body.timestamp || new Date().toISOString(),
    idempotencyKey: body.idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    channel: body.channel || 'WEB',
  };

  // Add to transactions (prepend to show live stream)
  transactions.unshift(newTx);

  // Assess risk
  const profile = SEED_ACCOUNT_PROFILES[newTx.accountId];
  const assessment = assessTransaction(
    newTx,
    profile,
    transactions.filter((t) => t.accountId === newTx.accountId),
    transactions,
    rulesConfig
  );
  assessmentsMap.set(newTx.id, assessment);

  // If FLAGGED or BLOCKED, automatically open or link a fraud case
  let createdCase: FraudCase | null = null;
  if (assessment.status === 'FLAGGED' || assessment.status === 'BLOCKED') {
    const isCritical = assessment.riskLevel === 'CRITICAL';
    const caseId = `CASE-${cases.length + 101}`;
    createdCase = {
      id: caseId,
      transactionId: newTx.id,
      transaction: newTx,
      riskAssessment: assessment,
      status: isCritical ? 'OPEN' : 'INVESTIGATING',
      priority: isCritical ? 'P1_CRITICAL' : 'P2_HIGH',
      assignedTo: isCritical ? 'Senior Analyst (Automated Triage)' : 'Fraud Triage Pool',
      openedAt: newTx.timestamp,
      updatedAt: newTx.timestamp,
      tags: assessment.signals.map((s) => s.code),
      notes: [
        {
          id: `note-${caseId}-auto`,
          author: 'FraudShield Monitoring Engine',
          createdAt: new Date().toISOString(),
          content: `Real-time anomaly detected. Combined Risk Score: ${assessment.combinedScore}/100 [${assessment.riskLevel}]. Status: ${assessment.status}. Initiated automated case file.`,
          isSystemGenerated: true,
        },
      ],
    };
    cases.unshift(createdCase);

    logAudit('system.pipeline', 'FLAG_TRANSACTION', 'TRANSACTION', newTx.id, {
      score: assessment.combinedScore,
      riskLevel: assessment.riskLevel,
      status: assessment.status,
      signals: assessment.signals.map((s) => s.code),
    });
  } else {
    logAudit('system.pipeline', 'APPROVE_TRANSACTION', 'TRANSACTION', newTx.id, {
      score: assessment.combinedScore,
      status: assessment.status,
    });
  }

  res.status(201).json({
    transaction: newTx,
    assessment,
    caseId: createdCase?.id ?? null,
  });
});

// 5. Dashboard Summary Metrics
app.get('/api/v1/dashboard/summary', (_req: Request, res: Response) => {
  const totalTransactions24h = transactions.length;
  let totalAmountProcessed = 0;
  let flaggedCount = 0;
  let blockedCount = 0;
  let approvedCount = 0;
  let totalScoreSum = 0;

  const distribution = { critical: 0, high: 0, medium: 0, low: 0 };

  transactions.forEach((tx) => {
    totalAmountProcessed += tx.amount;
    const a = getOrComputeAssessment(tx);
    totalScoreSum += a.combinedScore;

    if (a.status === 'BLOCKED') blockedCount++;
    else if (a.status === 'FLAGGED') flaggedCount++;
    else approvedCount++;

    if (a.riskLevel === 'CRITICAL') distribution.critical++;
    else if (a.riskLevel === 'HIGH') distribution.high++;
    else if (a.riskLevel === 'MEDIUM') distribution.medium++;
    else distribution.low++;
  });

  const fraudRate = totalTransactions24h > 0
    ? parseFloat((((flaggedCount + blockedCount) / totalTransactions24h) * 100).toFixed(1))
    : 0;

  // Compute shared device syndicates
  const deviceCounts = new Map<string, Set<string>>();
  transactions.forEach((t) => {
    if (!deviceCounts.has(t.deviceId)) deviceCounts.set(t.deviceId, new Set());
    deviceCounts.get(t.deviceId)!.add(t.accountId);
  });
  let activeSyndicates = 0;
  deviceCounts.forEach((accs) => {
    if (accs.size >= 2) activeSyndicates++;
  });

  const summary: DashboardSummary = {
    totalTransactions24h,
    totalAmountProcessed: Math.round(totalAmountProcessed),
    flaggedTransactionsCount: flaggedCount,
    blockedTransactionsCount: blockedCount,
    approvedTransactionsCount: approvedCount,
    fraudRatePercent: fraudRate,
    openCasesCount: cases.filter((c) => c.status === 'OPEN' || c.status === 'INVESTIGATING').length,
    avgRiskScore: Math.round(totalScoreSum / (totalTransactions24h || 1)),
    activeSyndicatesCount: activeSyndicates,
    riskDistribution: distribution,
    hourlyTrends: [
      { hour: '00:00', total: 18, flagged: 1, volume: 8200 },
      { hour: '01:00', total: 24, flagged: 2, volume: 11400 },
      { hour: '02:00', total: 32, flagged: 6, volume: 24500 },
      { hour: '03:00', total: 14, flagged: 1, volume: 6800 },
      { hour: '04:00', total: 10, flagged: 0, volume: 3900 },
      { hour: '05:00', total: 28, flagged: 3, volume: 14200 },
    ],
  };

  res.json(summary);
});

// 6. Cases List & Filters
app.get('/api/v1/cases', (req: Request, res: Response) => {
  const { status, priority } = req.query;
  let filtered = [...cases];

  if (status && typeof status === 'string' && status !== 'ALL') {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (priority && typeof priority === 'string' && priority !== 'ALL') {
    filtered = filtered.filter((c) => c.priority === priority);
  }

  res.json(filtered);
});

// 7. Case Status Update (Analyst Action)
app.patch('/api/v1/cases/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resolution, actor = 'analyst.current_user' } = req.body;

  const caseIndex = cases.findIndex((c) => c.id === id);
  if (caseIndex === -1) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const prevStatus = cases[caseIndex].status;
  cases[caseIndex].status = status;
  cases[caseIndex].updatedAt = new Date().toISOString();
  if (resolution) cases[caseIndex].resolution = resolution;

  cases[caseIndex].notes.push({
    id: `note-${Date.now()}`,
    author: actor,
    createdAt: new Date().toISOString(),
    content: `Status updated from [${prevStatus}] to [${status}]. ${resolution ? `Disposition: ${resolution}` : ''}`,
    isSystemGenerated: false,
  });

  logAudit(actor, 'UPDATE_CASE_STATUS', 'CASE', id, {
    previousStatus: prevStatus,
    newStatus: status,
    resolution,
  });

  res.json(cases[caseIndex]);
});

// 8. Add Note to Case
app.post('/api/v1/cases/:id/notes', (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, author = 'analyst.current_user' } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Note content cannot be empty' });
  }

  const currentCase = cases.find((c) => c.id === id);
  if (!currentCase) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const newNote = {
    id: `note-${Date.now()}`,
    author,
    createdAt: new Date().toISOString(),
    content: content.trim(),
    isSystemGenerated: false,
  };

  currentCase.notes.push(newNote);
  currentCase.updatedAt = new Date().toISOString();

  logAudit(author, 'ADD_CASE_NOTE', 'CASE', id, {
    noteLength: content.length,
  });

  res.status(201).json(newNote);
});

// 9. Network Graph Data
app.get('/api/v1/graph', (_req: Request, res: Response) => {
  const graph = generateNetworkGraphData(transactions);
  res.json(graph);
});

// 10. Rules & Weights Configuration
app.get('/api/v1/rules', (_req: Request, res: Response) => {
  res.json(rulesConfig);
});

app.put('/api/v1/rules', (req: Request, res: Response) => {
  const newConfig: Partial<RulesConfig> = req.body;
  rulesConfig = {
    ...rulesConfig,
    ...newConfig,
    enabledRules: {
      ...rulesConfig.enabledRules,
      ...(newConfig.enabledRules || {}),
    },
  };

  // Clear assessment cache so transactions recalculate with new rules/weights
  assessmentsMap.clear();
  transactions.forEach((tx) => getOrComputeAssessment(tx));

  logAudit('analyst.current_user', 'UPDATE_RULES_CONFIG', 'RULE_CONFIG', 'CONFIG-v1', {
    newConfig: rulesConfig,
  });

  res.json(rulesConfig);
});

// 11. Model Benchmarks & Metrics
app.get('/api/v1/model/metrics', (_req: Request, res: Response) => {
  res.json(BENCHMARK_MODEL_METRICS);
});

// 12. Audit Log
app.get('/api/v1/audit', (_req: Request, res: Response) => {
  res.json(auditEvents);
});

// 13. AI Investigation Assistant (Server-side Gemini Integration)
app.post('/api/v1/ai/investigate', async (req: Request, res: Response) => {
  const { transactionId } = req.body;

  const tx = transactions.find((t) => t.id === transactionId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const assessment = getOrComputeAssessment(tx);
  const relatedTxs = transactions.filter((t) => t.deviceId === tx.deviceId && t.id !== tx.id);
  const sharedAccounts = Array.from(new Set(relatedTxs.map((t) => t.accountId)));

  // Grounded context strictly from recorded evidence
  const evidenceContext = {
    transaction: {
      id: tx.id,
      amount: `$${tx.amount.toFixed(2)} ${tx.currency}`,
      accountId: tx.accountId,
      accountName: tx.accountName,
      merchant: `${tx.merchantName} (${tx.merchantCategory})`,
      deviceId: tx.deviceId,
      deviceType: tx.deviceType,
      ipAddress: tx.ipAddress,
      country: tx.country,
      channel: tx.channel,
      timestamp: tx.timestamp,
    },
    scoring: {
      ruleScore: assessment.ruleScore,
      modelScore: assessment.modelScore,
      modelProbability: `${(assessment.modelProbability * 100).toFixed(1)}%`,
      combinedScore: assessment.combinedScore,
      riskLevel: assessment.riskLevel,
      status: assessment.status,
    },
    ruleSignals: assessment.signals.map((s) => ({
      code: s.code,
      name: s.name,
      severity: s.severity,
      evidence: s.evidence,
      contribution: `+${s.scoreContribution} pts`,
    })),
    featureContributions: assessment.featureContributions.map((fc) => ({
      feature: fc.label,
      impact: fc.impact,
      description: fc.description,
    })),
    networkEvidence: {
      isSharedDevice: sharedAccounts.length > 0,
      sharedWithAccounts: sharedAccounts,
      deviceTotalTransactionsCount: relatedTxs.length + 1,
    },
  };

  // Attempt Gemini API call if key is set
  if (apiKey) {
    try {
      const prompt = `You are the Lead Financial Fraud Intelligence Analyst at FraudShield AI.
Review the following deterministic evidence collected by our Rules Engine, Machine Learning model, and Entity Network Graph:

=== VERIFIED TRANSACTION EVIDENCE ===
${JSON.stringify(evidenceContext, null, 2)}

INSTRUCTIONS:
1. Provide an objective, strictly evidence-grounded investigation briefing.
2. DO NOT invent or assume any facts not stated in the evidence above.
3. Explicitly explain why the transaction received its score based on the baseline deviation, velocity, device fingerprint, and network relationships.
4. Formulate an actionable hypothesis (e.g. Account Takeover, Syndicate Device Ring, Card Testing, or Legitimate Surge).
5. State the level of uncertainty (LOW, MEDIUM, HIGH).
6. Recommend 3-4 specific investigative actions for the human analyst.

Return your response in clean JSON matching this exact structure:
{
  "summary": "Concise 2-sentence executive summary of the alert",
  "keyDrivers": ["Driver 1", "Driver 2", "Driver 3"],
  "evidencePoints": ["Specific evidence fact with exact numbers", "Specific evidence fact"],
  "syndicateHypothesis": "Synthesized risk thesis based on network and device patterns",
  "uncertaintyRating": "LOW" | "MEDIUM" | "HIGH",
  "recommendedActions": ["Action 1", "Action 2", "Action 3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2, // Low temperature for factual precision
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);

      const aiExplanation: AIExplanation = {
        summary: parsed.summary || 'Transaction flagged by rules and ML ensemble based on detected anomalies.',
        keyDrivers: parsed.keyDrivers || assessment.signals.map((s) => s.name),
        evidencePoints: parsed.evidencePoints || assessment.signals.map((s) => s.evidence),
        syndicateHypothesis: parsed.syndicateHypothesis || (sharedAccounts.length > 0 ? `Device ${tx.deviceId} linked to ${sharedAccounts.length + 1} distinct customer accounts.` : 'No syndicate device sharing detected.'),
        uncertaintyRating: parsed.uncertaintyRating || (assessment.combinedScore > 80 ? 'LOW' : 'MEDIUM'),
        recommendedActions: parsed.recommendedActions || [
          'Contact account holder via out-of-band SMS verification',
          'Freeze transaction settlement pending ID verification',
          'Inspect other accounts sharing hardware token ' + tx.deviceId,
        ],
        generatedAt: new Date().toISOString(),
        modelUsed: 'gemini-3.8-flash (Evidence Grounded)',
      };

      assessment.aiExplanation = aiExplanation;
      return res.json(aiExplanation);
    } catch (err: unknown) {
      console.warn('Gemini API call failed or timed out, synthesizing deterministic evidence briefing:', (err as Error)?.message);
    }
  }

  // Fallback: Deterministic Evidence Synthesis (100% reliable, zero hallucination)
  const isSyndicate = sharedAccounts.length > 0;
  const topSignals = assessment.signals;

  const fallbackExplanation: AIExplanation = {
    summary: `Transaction ${tx.id} ($${tx.amount.toFixed(2)}) on account ${tx.accountId} scored ${assessment.combinedScore}/100 [${assessment.riskLevel}] due to ${topSignals.map((s) => s.name).slice(0, 2).join(' and ')}.`,
    keyDrivers: topSignals.map((s) => s.name).slice(0, 4),
    evidencePoints: [
      ...topSignals.map((s) => s.evidence),
      isSyndicate
        ? `Hardware token ${tx.deviceId} is co-utilized across ${sharedAccounts.length + 1} distinct accounts (${sharedAccounts.slice(0, 3).join(', ')})`
        : `Transaction initiated via channel [${tx.channel}] with card ending *${tx.cardLast4}`,
    ],
    syndicateHypothesis: isSyndicate
      ? `High probability of organized fraud ring using shared emulator/hardware ${tx.deviceId} to execute coordinated transactions across synthetic identities.`
      : assessment.ruleScore > 70
      ? `Sudden single-account anomaly indicating potential credentials compromise or high-ticket account takeover.`
      : `Moderate risk pattern warranting step-up 2FA or merchant verification.`,
    uncertaintyRating: assessment.combinedScore >= 80 ? 'LOW' : 'MEDIUM',
    recommendedActions: [
      `Initiate out-of-band customer challenge (SMS/App Push) for Account ${tx.accountId}`,
      isSyndicate ? `Place temporary security hold on all accounts sharing device ${tx.deviceId}` : `Review merchant dispute rate for ${tx.merchantName}`,
      `Inspect IP reputation for ${tx.ipAddress} (${tx.country})`,
      assessment.status === 'BLOCKED' ? 'Confirm funds reversal in settlement gateway' : 'Tag case for Tier 2 fraud squad investigation',
    ],
    generatedAt: new Date().toISOString(),
    modelUsed: 'Rule & Feature Synthesizer v2.4 (Evidence Engine)',
  };

  assessment.aiExplanation = fallbackExplanation;
  res.json(fallbackExplanation);
});

// 14. Transaction Simulation Trigger (Normal or Attack Ring)
app.post('/api/v1/simulator/trigger', (req: Request, res: Response) => {
  const { type = 'BURST_ATTACK' } = req.body;

  if (type === 'SYNDICATE_RING') {
    // Generate 3 coordinated transactions across accounts using DEV-204
    const newTxs: Transaction[] = [
      {
        id: `TXN-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
        accountId: 'ACC-1007',
        accountName: 'Ananya Patel',
        accountTier: 'STANDARD',
        amount: Math.round(1800 + Math.random() * 2500),
        currency: 'USD',
        merchantCategory: 'electronics',
        merchantName: 'CryptoGear Online Store',
        deviceId: 'DEV-204',
        deviceType: 'desktop_windows',
        ipAddress: '198.51.100.44',
        country: 'US',
        cardLast4: '4892',
        timestamp: new Date().toISOString(),
        idempotencyKey: `idem-sim-${Date.now()}-1`,
        channel: 'WEB',
      },
      {
        id: `TXN-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
        accountId: 'ACC-3108',
        accountName: 'Elena Rostova',
        accountTier: 'STANDARD',
        amount: Math.round(2100 + Math.random() * 2000),
        currency: 'USD',
        merchantCategory: 'wire_transfer',
        merchantName: 'SwiftRemit Global Wire',
        deviceId: 'DEV-204',
        deviceType: 'desktop_windows',
        ipAddress: '198.51.100.44',
        country: 'US',
        cardLast4: '3319',
        timestamp: new Date().toISOString(),
        idempotencyKey: `idem-sim-${Date.now()}-2`,
        channel: 'WEB',
      },
    ];

    newTxs.forEach((t) => {
      transactions.unshift(t);
      const a = getOrComputeAssessment(t);
      if (a.status !== 'APPROVED') {
        cases.unshift({
          id: `CASE-${cases.length + 101}`,
          transactionId: t.id,
          transaction: t,
          riskAssessment: a,
          status: 'OPEN',
          priority: 'P1_CRITICAL',
          assignedTo: 'Automated Syndicate Triage',
          openedAt: t.timestamp,
          updatedAt: t.timestamp,
          tags: a.signals.map((s) => s.code),
          notes: [
            {
              id: `note-sim-${Date.now()}`,
              author: 'Simulation Bot',
              createdAt: new Date().toISOString(),
              content: 'Simulated coordinated syndicate burst transaction injected.',
              isSystemGenerated: true,
            },
          ],
        });
      }
    });

    logAudit('simulator.bot', 'INJECT_SYNDICATE_BURST', 'TRANSACTION', 'BATCH', {
      count: newTxs.length,
      deviceId: 'DEV-204',
    });

    return res.json({ injectedCount: newTxs.length, transactions: newTxs });
  }

  // Regular benign retail transaction
  const benignTx: Transaction = {
    id: `TXN-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
    accountId: 'ACC-8902',
    accountName: 'Aiden Wright',
    accountTier: 'STANDARD',
    amount: parseFloat((18.5 + Math.random() * 65.0).toFixed(2)),
    currency: 'USD',
    merchantCategory: 'grocery',
    merchantName: 'Trader Joe’s Market',
    deviceId: 'DEV-PHONE-8902',
    deviceType: 'mobile_ios',
    ipAddress: '73.189.22.4',
    country: 'US',
    cardLast4: '3411',
    timestamp: new Date().toISOString(),
    idempotencyKey: `idem-sim-${Date.now()}`,
    channel: 'POS',
  };

  transactions.unshift(benignTx);
  getOrComputeAssessment(benignTx);

  logAudit('simulator.bot', 'INJECT_BENIGN_TRANSACTION', 'TRANSACTION', benignTx.id, {
    amount: benignTx.amount,
  });

  res.json({ injectedCount: 1, transactions: [benignTx] });
});

// ==========================================
// VITE DEV SERVER / STATIC ASSETS MOUNTING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FraudShield AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
