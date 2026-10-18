import React, { useState } from 'react';
import { Zap, X, AlertTriangle, CheckCircle, ShieldCheck, ShieldAlert, Ban } from 'lucide-react';
import type { MerchantCategory, Transaction, RiskAssessment } from '../types/fraud.ts';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTransaction: (txData: Partial<Transaction>) => Promise<{
    transaction: Transaction;
    assessment: RiskAssessment;
    caseId: string | null;
  }>;
  onInspectResult: (txId: string) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmitTransaction,
  onInspectResult,
}) => {
  const [accountId, setAccountId] = useState('ACC-1007');
  const [accountName, setAccountName] = useState('Ananya Patel');
  const [amount, setAmount] = useState('4850.00');
  const [currency, setCurrency] = useState('USD');
  const [merchantCategory, setMerchantCategory] = useState<MerchantCategory>('electronics');
  const [merchantName, setMerchantName] = useState('Apex Digital Tech');
  const [deviceId, setDeviceId] = useState('DEV-204');
  const [deviceType, setDeviceType] = useState<Transaction['deviceType']>('desktop_windows');
  const [ipAddress, setIpAddress] = useState('198.51.100.44');
  const [country, setCountry] = useState('US');
  const [cardLast4, setCardLast4] = useState('4892');
  const [channel, setChannel] = useState<Transaction['channel']>('WEB');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    transaction: Transaction;
    assessment: RiskAssessment;
    caseId: string | null;
  } | null>(null);

  if (!isOpen) return null;

  // Preset Scenario Handlers
  const applyPreset = (preset: 'SYNDICATE' | 'BASELINE_SURGE' | 'GEO_VELOCITY' | 'NORMAL') => {
    setResult(null);
    if (preset === 'SYNDICATE') {
      setAccountId('ACC-9920');
      setAccountName('Julian Cross');
      setAmount('3200.00');
      setCurrency('USD');
      setMerchantCategory('crypto_exchange');
      setMerchantName('PrimeCoin Global Liquidity');
      setDeviceId('DEV-204');
      setDeviceType('desktop_windows');
      setIpAddress('198.51.100.44');
      setCountry('US');
      setCardLast4('9012');
      setChannel('WEB');
    } else if (preset === 'BASELINE_SURGE') {
      setAccountId('ACC-1007');
      setAccountName('Ananya Patel');
      setAmount('4950.00');
      setCurrency('USD');
      setMerchantCategory('electronics');
      setMerchantName('BestBuy Flagship Direct');
      setDeviceId('DEV-PHONE-1007');
      setDeviceType('mobile_ios');
      setIpAddress('68.105.12.9');
      setCountry('US');
      setCardLast4('4892');
      setChannel('WEB');
    } else if (preset === 'GEO_VELOCITY') {
      setAccountId('ACC-7891');
      setAccountName('Lucas Silva');
      setAmount('1450.00');
      setCurrency('GBP');
      setMerchantCategory('luxury_goods');
      setMerchantName('Harrods London Knightsbridge');
      setDeviceId('DEV-PHONE-GEO-NEW');
      setDeviceType('mobile_android');
      setIpAddress('81.2.69.142');
      setCountry('GB');
      setCardLast4('6523');
      setChannel('POS');
    } else {
      // Normal
      setAccountId('ACC-8902');
      setAccountName('Aiden Wright');
      setAmount('42.50');
      setCurrency('USD');
      setMerchantCategory('grocery');
      setMerchantName('Trader Joe’s Market');
      setDeviceId('DEV-PHONE-8902');
      setDeviceType('mobile_ios');
      setIpAddress('73.189.22.4');
      setCountry('US');
      setCardLast4('3411');
      setChannel('POS');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await onSubmitTransaction({
        accountId,
        accountName,
        amount: parseFloat(amount),
        currency,
        merchantCategory,
        merchantName,
        deviceId,
        deviceType,
        ipAddress,
        country,
        cardLast4,
        channel,
      });
      setResult(res);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Submit Test Transaction</h3>
              <p className="text-xs text-slate-400">
                Trigger real-time multi-layer assessment across Rules and ML models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300">Quick Test Scenarios:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('SYNDICATE')}
              className="p-2 text-left bg-slate-950 hover:bg-slate-800 border border-rose-500/30 rounded-lg text-xs transition"
            >
              <span className="text-rose-400 font-bold block">Syndicate Ring</span>
              <span className="text-[10px] text-slate-400">Uses shared DEV-204</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('BASELINE_SURGE')}
              className="p-2 text-left bg-slate-950 hover:bg-slate-800 border border-amber-500/30 rounded-lg text-xs transition"
            >
              <span className="text-amber-400 font-bold block">Baseline Surge</span>
              <span className="text-[10px] text-slate-400">$4,950 vs $145 mean</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('GEO_VELOCITY')}
              className="p-2 text-left bg-slate-950 hover:bg-slate-800 border border-purple-500/30 rounded-lg text-xs transition"
            >
              <span className="text-purple-400 font-bold block">Impossible Travel</span>
              <span className="text-[10px] text-slate-400">UK vs JP in 20 mins</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('NORMAL')}
              className="p-2 text-left bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 rounded-lg text-xs transition"
            >
              <span className="text-emerald-400 font-bold block">Normal Retail</span>
              <span className="text-[10px] text-slate-400">$42.50 grocery</span>
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Account ID</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Customer Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Amount</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:border-blue-500"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Merchant Category</label>
              <select
                value={merchantCategory}
                onChange={(e) => setMerchantCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500"
              >
                <option value="electronics">Electronics</option>
                <option value="crypto_exchange">Crypto Exchange</option>
                <option value="wire_transfer">Wire Transfer</option>
                <option value="luxury_goods">Luxury Goods</option>
                <option value="gaming">Gaming</option>
                <option value="grocery">Grocery</option>
                <option value="travel">Travel</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Merchant Name</label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Hardware Device ID</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">IP Address &amp; Country</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500"
                />
                <input
                  type="text"
                  value={country}
                  maxLength={2}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-mono text-center uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Card Last 4 &amp; Channel</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-center"
                />
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  <option value="WEB">WEB</option>
                  <option value="MOBILE_APP">MOBILE_APP</option>
                  <option value="API">API</option>
                  <option value="POS">POS</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Evaluating Pipeline...' : 'Submit & Assess Transaction'}
            </button>
          </div>
        </form>

        {/* Live Result Callout */}
        {result && (
          <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white font-mono">
                Assessed: {result.transaction.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                  result.assessment.status === 'BLOCKED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : result.assessment.status === 'FLAGGED'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {result.assessment.status} ({result.assessment.combinedScore}/100)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400">Rule Score</span>
                <p className="font-mono font-bold text-amber-400 text-sm">
                  {result.assessment.ruleScore}
                </p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400">ML Model Score</span>
                <p className="font-mono font-bold text-purple-400 text-sm">
                  {result.assessment.modelScore}
                </p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400">Risk Band</span>
                <p className="font-mono font-bold text-white text-sm">
                  {result.assessment.riskLevel}
                </p>
              </div>
            </div>

            <p className="text-slate-300">
              Triggered <strong>{result.assessment.signals.length} rules</strong>.
              {result.caseId && (
                <span> Auto-opened investigation case: <strong className="text-purple-300">{result.caseId}</strong>.</span>
              )}
            </p>

            <button
              onClick={() => {
                onClose();
                onInspectResult(result.transaction.id);
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition"
            >
              Open in Investigation Workspace →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
