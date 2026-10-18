import React, { useState } from 'react';
import {
  Sliders,
  Brain,
  Cpu,
  CheckCircle,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Scale,
} from 'lucide-react';
import type { RulesConfig, ModelPerformanceMetrics } from '../types/fraud.ts';

interface RulesAndModelLabProps {
  currentRulesConfig: RulesConfig;
  onUpdateRulesConfig: (config: RulesConfig) => Promise<void>;
  modelMetrics: ModelPerformanceMetrics | null;
}

export const RulesAndModelLab: React.FC<RulesAndModelLabProps> = ({
  currentRulesConfig,
  onUpdateRulesConfig,
  modelMetrics,
}) => {
  const [config, setConfig] = useState<RulesConfig>(currentRulesConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleRuleToggle = (ruleKey: keyof RulesConfig['enabledRules']) => {
    setConfig((prev) => ({
      ...prev,
      enabledRules: {
        ...prev.enabledRules,
        [ruleKey]: !prev.enabledRules[ruleKey],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateRulesConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white">Scoring Policy &amp; Machine Learning Engine Lab</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Live Thresholds &amp; Weights
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Dynamically configure deterministic rule limits, ensemble blending weights, and inspect model precision/recall.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Saved &amp; Recalculated!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Recalculating...' : 'Apply & Recalculate'}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Configurable Policy & Thresholds */}
        <div className="space-y-6">
          {/* Ensemble Blending Slider */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">Ensemble Weight Allocation</h4>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Rule: {Math.round(config.ruleWeight * 100)}% | ML: {Math.round(config.mlWeight * 100)}%
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Control the relative influence of deterministic business rules versus the statistical ML model in calculating final combined scores.
            </p>

            <div className="space-y-2">
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={config.ruleWeight}
                onChange={(e) => {
                  const rWeight = parseFloat(e.target.value);
                  const mWeight = parseFloat((1 - rWeight).toFixed(2));
                  setConfig((prev) => ({
                    ...prev,
                    ruleWeight: rWeight,
                    mlWeight: mWeight,
                  }));
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Rule-Heavy (90/10)</span>
                <span className="text-slate-300 font-bold">50 / 50 Balanced</span>
                <span>ML-Heavy (10/90)</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, ruleWeight: 0.5, mlWeight: 0.5 }))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                50/50 Balanced
              </button>
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, ruleWeight: 0.7, mlWeight: 0.3 }))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                70/30 Rule-First
              </button>
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, ruleWeight: 0.3, mlWeight: 0.7 }))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                30/70 ML-First
              </button>
            </div>
          </div>

          {/* Action Thresholds */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-semibold text-white pb-3 border-b border-slate-800">
              Decisioning Action Thresholds
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-amber-400 font-semibold block">Flag For Review Threshold</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="40"
                    max="90"
                    value={config.flagThreshold}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, flagThreshold: parseInt(e.target.value, 10) || 65 }))
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono font-bold text-sm"
                  />
                  <span className="text-slate-400">/ 100</span>
                </div>
                <p className="text-[10px] text-slate-500">Payments above this score trigger analyst triage.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-rose-400 font-semibold block">Auto-Block Threshold</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={config.blockThreshold}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, blockThreshold: parseInt(e.target.value, 10) || 85 }))
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono font-bold text-sm"
                  />
                  <span className="text-slate-400">/ 100</span>
                </div>
                <p className="text-[10px] text-slate-500">Payments above this score are blocked instantly.</p>
              </div>
            </div>
          </div>

          {/* Deterministic Rule Limits & Toggles */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-semibold text-white pb-3 border-b border-slate-800">
              Deterministic Rules Configuration
            </h4>

            <div className="space-y-3 text-xs">
              {/* Baseline Multiplier */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-semibold text-slate-200">Historical Baseline Multiplier</p>
                  <p className="text-[10px] text-slate-400">Flags transactions exceeding N times account average</p>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.5"
                    min="1.5"
                    max="10"
                    value={config.amountBaselineMultiplier}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        amountBaselineMultiplier: parseFloat(e.target.value) || 3.0,
                      }))
                    }
                    className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono font-semibold"
                  />
                  <span className="text-slate-400 font-mono">x</span>
                </div>
              </div>

              {/* Velocity Window Minutes */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-semibold text-slate-200">Rapid Velocity Window (Minutes)</p>
                  <p className="text-[10px] text-slate-400">Rolling time window to evaluate burst payments</p>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={config.rapidTransactionWindowMinutes}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        rapidTransactionWindowMinutes: parseInt(e.target.value, 10) || 10,
                      }))
                    }
                    className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono font-semibold"
                  />
                  <span className="text-slate-400 font-mono">min</span>
                </div>
              </div>

              {/* Shared Device Threshold */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-semibold text-slate-200">Shared Device Syndicate Threshold</p>
                  <p className="text-[10px] text-slate-400">Accounts on single device before flagging ring</p>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={config.sharedDeviceAccountThreshold}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        sharedDeviceAccountThreshold: parseInt(e.target.value, 10) || 2,
                      }))
                    }
                    className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono font-semibold"
                  />
                  <span className="text-slate-400 font-mono">acc</span>
                </div>
              </div>

              {/* Rule Toggles */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                {Object.entries(config.enabledRules).map(([key, enabled]) => (
                  <label
                    key={key}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                      enabled
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleRuleToggle(key as any)}
                      className="rounded accent-blue-500"
                    />
                    <span className="text-[11px] capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Model Performance Monitoring */}
        {modelMetrics && (
          <div className="space-y-6">
            {/* Model Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-semibold text-white">Model Performance &amp; Evaluation</h4>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                  {modelMetrics.version}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">Precision</span>
                  <p className="text-lg font-bold font-mono text-white">
                    {(modelMetrics.precision * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-500">Low false alerts</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">Recall</span>
                  <p className="text-lg font-bold font-mono text-emerald-400">
                    {(modelMetrics.recall * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-500">Fraud captured</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">F1-Score</span>
                  <p className="text-lg font-bold font-mono text-purple-400">
                    {(modelMetrics.f1Score * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-500">Harmonic mean</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">PR-AUC</span>
                  <p className="text-lg font-bold font-mono text-cyan-400">
                    {modelMetrics.aucPr.toFixed(3)}
                  </p>
                  <p className="text-[10px] text-slate-500">Imbalanced metric</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">ROC-AUC</span>
                  <p className="text-lg font-bold font-mono text-amber-400">
                    {modelMetrics.rocAuc.toFixed(3)}
                  </p>
                  <p className="text-[10px] text-slate-500">Discrimination</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">Inference Latency</span>
                  <p className="text-lg font-bold font-mono text-white">
                    {modelMetrics.averageInferenceLatencyMs} ms
                  </p>
                  <p className="text-[10px] text-slate-500">Real-time p99</p>
                </div>
              </div>
            </div>

            {/* Confusion Matrix Visual */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-white">Test Confusion Matrix (142,500 Holdout Samples)</h4>
              <p className="text-xs text-slate-400">
                Demonstrates high discrimination with minimal false positive rate ({(modelMetrics.falsePositiveRate * 100).toFixed(2)}%)
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase">True Positives (TP)</span>
                  <p className="text-xl font-bold font-mono text-white mt-1">
                    {modelMetrics.confusionMatrix.truePositives.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-400">Correctly intercepted fraud</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-amber-300 font-bold uppercase">False Positives (FP)</span>
                  <p className="text-xl font-bold font-mono text-slate-300 mt-1">
                    {modelMetrics.confusionMatrix.falsePositives.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-amber-400">Legitimate transactions flagged</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-rose-300 font-bold uppercase">False Negatives (FN)</span>
                  <p className="text-xl font-bold font-mono text-rose-400 mt-1">
                    {modelMetrics.confusionMatrix.falseNegatives.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-rose-400">Missed fraud attempts</p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase">True Negatives (TN)</span>
                  <p className="text-xl font-bold font-mono text-white mt-1">
                    {modelMetrics.confusionMatrix.trueNegatives.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-400">Correctly passed normal traffic</p>
                </div>
              </div>
            </div>

            {/* Feature Importance Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-white">Global Feature Importance (Gini Impurity)</h4>
              <div className="space-y-2 pt-1 text-xs">
                {modelMetrics.featuresImportance.map((feat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{feat.feature}</span>
                      <span className="font-mono text-slate-400">{Math.round(feat.importance * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${feat.importance * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
