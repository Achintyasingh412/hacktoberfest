import React, { useState } from 'react';
import {
  getGemmaConfig,
  saveGemmaConfig,
  checkGemmaHealth,
  GemmaConfig,
  GemmaProvider,
  GemmaModelPreset,
} from '../services/gemmaService';
import { X, Server, RefreshCw, CheckCircle2, AlertCircle, Terminal, Cpu, Cloud, Sparkles } from 'lucide-react';

interface GemmaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const GemmaConfigModal: React.FC<GemmaConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [config, setConfig] = useState<GemmaConfig>(getGemmaConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    available: boolean;
    provider: GemmaProvider;
    model: string;
    latencyMs?: number;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await checkGemmaHealth(config);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        available: false,
        provider: config.provider,
        model: config.model,
        message: e.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGemmaConfig(config);
    onConfigUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#874F41] border border-[#90AEAD] shadow-2xl rounded-sm p-6 text-[#FBE9D0] max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#FBE9D0]/70 hover:text-[#FBE9D0] transition-colors p-1"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#90AEAD]/40 pb-4 mb-4">
          <div className="text-[11px] font-mono tracking-widest text-[#90AEAD] uppercase flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#E64833]" />
            <span>GOOGLE GEMMA OPEN-WEIGHT ARCHITECTURE</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#FBE9D0] mt-1">
            Gemma Model Runtime & Provider Setup
          </h2>
          <p className="text-xs text-[#FBE9D0]/80 mt-1">
            Hostel Nexus runs on Google's <strong>Gemma</strong> open-weight models. You can run Gemma locally on your hardware, serve it through Google Cloud / Vertex AI, or use the built-in zero-latency engine.
          </p>
        </div>

        {/* Status result */}
        {testResult && (
          <div
            className={`mb-4 p-3 rounded-sm text-xs font-mono border flex items-start gap-2.5 ${
              testResult.available
                ? 'bg-[#244855] border-emerald-400 text-emerald-300'
                : 'bg-[#244855] border-[#E64833] text-[#FBE9D0]'
            }`}
          >
            {testResult.available ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#E64833] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                {testResult.available
                  ? `Live Gemma Server Connected (${testResult.model})`
                  : 'Demo Mode Active (Pre-scripted Responses)'}
              </div>
              <div className="text-[11px] opacity-90 mt-0.5">
                {testResult.message}
                {testResult.latencyMs !== undefined && (
                  <span className="block text-[10px] text-[#90AEAD] mt-0.5">
                    Benchmark Round-Trip Latency: {testResult.latencyMs}ms
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Runtime Provider Selection */}
          <div>
            <label className="block text-xs font-mono text-[#90AEAD] mb-1.5 uppercase">
              1. INFERENCE RUNTIME PROVIDER
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'built-in-gemma' as GemmaProvider,
                  name: 'Built-In Gemma Engine',
                  desc: 'Zero-setup, ultra-responsive collegiate arbiter',
                  icon: <Sparkles className="w-3.5 h-3.5 text-[#E64833]" />,
                },
                {
                  id: 'local-open-weight' as GemmaProvider,
                  name: 'Local Gemma Inference',
                  desc: 'vLLM, llama.cpp, or local daemon on port 8080/11434',
                  icon: <Terminal className="w-3.5 h-3.5 text-[#90AEAD]" />,
                },
                {
                  id: 'google-cloud' as GemmaProvider,
                  name: 'Google Cloud / Vertex AI',
                  desc: 'Host Gemma weights via Google Cloud Model Garden',
                  icon: <Cloud className="w-3.5 h-3.5 text-blue-300" />,
                },
                {
                  id: 'huggingface' as GemmaProvider,
                  name: 'Hugging Face Endpoint',
                  desc: 'Hugging Face Inference API / Dedicated Endpoint',
                  icon: <Server className="w-3.5 h-3.5 text-amber-300" />,
                },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setConfig({ ...config, provider: p.id })}
                  className={`p-2.5 rounded-sm border text-left transition-all ${
                    config.provider === p.id
                      ? 'bg-[#244855] border-[#E64833] ring-1 ring-[#E64833]'
                      : 'bg-[#244855]/60 border-[#90AEAD]/30 hover:border-[#90AEAD]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FBE9D0]">
                    {p.icon}
                    <span>{p.name}</span>
                  </div>
                  <div className="text-[10px] text-[#FBE9D0]/70 mt-1 leading-snug">
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Model Weights Preset */}
          <div>
            <label className="block text-xs font-mono text-[#90AEAD] mb-1 uppercase">
              2. GEMMA OPEN-WEIGHT MODEL
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value as GemmaModelPreset })}
              className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-xs text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
            >
              <option value="gemma-2-9b-it">Google Gemma 2 9B Instruct (Recommended Flagship)</option>
              <option value="gemma-2-27b-it">Google Gemma 2 27B Instruct (Advanced Reasoning & Negotiation)</option>
              <option value="gemma-2b-it">Google Gemma 2B Instruct (Ultra-Fast Edge Model)</option>
              <option value="gemma-7b-it">Google Gemma 7B Classic Open-Weight</option>
            </select>
          </div>

          {/* Endpoint (shown for external/local providers) */}
          {config.provider !== 'built-in-gemma' && (
            <div>
              <label className="block text-xs font-mono text-[#90AEAD] mb-1 uppercase">
                3. INFERENCE ENDPOINT URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.endpoint}
                  onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                  placeholder={
                    config.provider === 'local-open-weight'
                      ? 'http://localhost:8080 or http://localhost:11434'
                      : 'https://your-gemma-endpoint.cloud.run.app'
                  }
                  className="flex-1 px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-xs text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="px-3 py-2 bg-[#244855] hover:bg-[#874F41] border border-[#90AEAD] rounded-sm text-xs font-mono text-[#FBE9D0] transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                  <span>Test Ping</span>
                </button>
              </div>
            </div>
          )}

          {/* API Key / Token (for Google Cloud or HuggingFace) */}
          {(config.provider === 'google-cloud' || config.provider === 'huggingface') && (
            <div>
              <label className="block text-xs font-mono text-[#90AEAD] mb-1 uppercase">
                BEARER TOKEN / API KEY (OPTIONAL)
              </label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Bearer token for cloud inference gateway"
                className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-xs text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
              />
            </div>
          )}

          {/* Local Serving / Fine-Tuning Command Reference */}
          <div className="p-3 bg-[#244855]/70 border border-[#90AEAD]/30 rounded-sm text-xs space-y-1.5">
            <div className="text-[11px] font-mono text-[#90AEAD] uppercase font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>How to serve Google Gemma open weights locally:</span>
            </div>
            <pre className="bg-[#1b3742] p-2 rounded-sm text-[10.5px] font-mono text-emerald-300 overflow-x-auto select-all">
              python -m vllm.entrypoints.openai.api_server --model google/gemma-2-9b-it --port 8080
            </pre>
            <p className="text-[10px] text-[#FBE9D0]/70">
              Gemma models are open-weight and can also be fine-tuned via Hugging Face TRL or KerasNLP.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#90AEAD]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-mono text-[#FBE9D0]/70 hover:text-[#FBE9D0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] text-xs font-medium rounded-sm transition-colors shadow-sm"
            >
              Save Gemma Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
