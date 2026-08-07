import React, { useState } from 'react';
import { Send, Key, ShieldCheck, CheckCircle2, Code2, Play } from 'lucide-react';

export const WebhookTester: React.FC = () => {
  const [webhookBody, setWebhookBody] = useState<string>(
    JSON.stringify(
      {
        event_type: 'customer.payment_dispute',
        account_id: 'ACC_enterprise_99120',
        amount: 1450.00,
        currency: 'USD',
        customer_phone: '+14155552671',
        dispute_reason: 'Unrecognized enterprise charge',
        timestamp: new Date().toISOString()
      },
      null,
      2
    )
  );

  const [hmacSecret, setHmacSecret] = useState<string>('hmac_sha256_sec_77182903');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [responseResult, setResponseResult] = useState<any>(null);

  const handleSendWebhook = async () => {
    setIsSending(true);
    setResponseResult(null);

    try {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(webhookBody);
      } catch {
        parsedBody = { raw: webhookBody };
      }

      const res = await fetch('/api/cpaas/webhook-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CPaaS-Signature': `sha256_sig_mock_${Math.random().toString(36).substring(2, 8)}`,
          'X-CPaaS-Secret': hmacSecret
        },
        body: JSON.stringify(parsedBody)
      });

      const data = await res.json();
      setResponseResult({
        httpStatus: res.status,
        data
      });
    } catch (err: any) {
      setResponseResult({
        httpStatus: 500,
        error: err.message
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg font-bold">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              Enterprise Webhook Ingestion Gateway Simulator
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-bold">
                HMAC-SHA256 Authenticated
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Dispatches authenticated HTTP POST webhooks to test real-time signature verification & async event bus ingestion.
            </p>
          </div>
        </div>

        <button
          onClick={handleSendWebhook}
          disabled={isSending}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
          <span>{isSending ? 'Dispatching Webhook...' : 'Send Signed Webhook'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Webhook Payload & Headers Config */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">Target Ingestion Endpoint</span>
            <div className="font-mono text-xs text-indigo-700 font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
              POST /api/cpaas/webhook-ingest
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              HMAC Signature Secret Key
            </label>
            <input
              type="text"
              value={hmacSecret}
              onChange={(e) => setHmacSecret(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-amber-800 font-mono text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inbound JSON Webhook Body
            </label>
            <textarea
              rows={10}
              value={webhookBody}
              onChange={(e) => setWebhookBody(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs rounded-lg p-3 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Right: Live Ingestion Response */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-3">
            <Code2 className="w-4 h-4 text-indigo-600" />
            Gateway Response Inspector
          </h3>

          {responseResult ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-semibold">HTTP Status:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-md ${
                    responseResult.httpStatus === 200
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {responseResult.httpStatus} OK
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1 tracking-wider">
                  JSON Response Body
                </span>
                <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-200 text-xs overflow-x-auto">
                  {JSON.stringify(responseResult.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs font-mono border border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50">
              <Send className="w-8 h-8 mb-2 text-indigo-600 animate-bounce" />
              <span>Click "Send Signed Webhook" to execute an inbound gateway post and observe HMAC validation.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
