import { useEffect, useState } from 'react';
import { Copy, Check, Code, Zap, Lock, DollarSign, Send } from 'lucide-react';
import { ApiClient } from '../lib/authService'; // adjust path if different

interface APIDocProps {
  userId: string | undefined;
  username: string;
  profilePictureUrl?: string;
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  request?: {
    headers?: Record<string, string>;
    body?: any;
  };
  response?: any;
}

const APIDoc = ({ userId, username, profilePictureUrl }: APIDocProps) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);

  const [apiKeyId, setApiKeyId] = useState<string | null>(null);
  const [apiSecret, setApiSecret] = useState<string | null>(null);
  const [isExistingKey, setIsExistingKey] = useState<boolean | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'https://api.zkforge.com';

  // --- fetch /404/keys on mount (and when user changes) ---
  useEffect(() => {
    if (!userId) return;
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchKeys() {
    try {
      setKeysLoading(true);
      setKeysError(null);

      const res = await ApiClient.get('/404/keys');
      if (!res?.ok) throw new Error(res?.error || 'Failed to fetch API keys');

      setApiKeyId(res.apiKeyId || null);
      setApiSecret(res.apiSecret || null); // only present first time / after rotate
      setIsExistingKey(!!res.existing);
    } catch (err: any) {
      setKeysError(err.message || 'Failed to load API keys');
    } finally {
      setKeysLoading(false);
    }
  }

  async function rotateKeys() {
    try {
      setRotating(true);
      setKeysError(null);

      const res = await ApiClient.post('/404/keys/rotate', {});
      if (!res?.ok) throw new Error(res?.error || 'Failed to rotate API keys');

      setApiKeyId(res.apiKeyId || null);
      setApiSecret(res.apiSecret || null); // new secret (shown once)
      setIsExistingKey(false);
    } catch (err: any) {
      setKeysError(err.message || 'Failed to rotate API keys');
    } finally {
      setRotating(false);
    }
  }

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'POST':
        return 'text-[#17ff9a] bg-[#17ff9a]/10 border-[#17ff9a]/20';
      case 'PUT':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'DELETE':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  // endpoints use real key/secret if available, otherwise placeholders
  const endpoints: ApiEndpoint[] = [
    {
      method: 'GET',
      path: '/404/keys',
      description: 'Get or automatically create your API key for 404 Payments',
      auth: true,
      request: {
        headers: {
          'Authorization': 'Bearer YOUR_SESSION_JWT'
        }
      },
      response: {
        ok: true,
        existing: true,
        apiKeyId: 'xk_abc123...',
        hasSecret: false
      }
    },
    {
      method: 'POST',
      path: '/404/keys/rotate',
      description: 'Rotate your API key + secret (invalidates old key)',
      auth: true,
      request: {
        headers: {
          'Authorization': 'Bearer YOUR_SESSION_JWT',
          'Content-Type': 'application/json'
        }
      },
      response: {
        ok: true,
        apiKeyId: 'xk_new123...',
        apiSecret: 'xs_new_secret_shown_once'
      }
    },
    {
      method: 'POST',
      path: '/404/payments/challenge',
      description: 'Create a payment challenge your frontend/wallet can use',
      auth: true,
      request: {
        headers: {
          'x-api-key': apiKeyId || 'YOUR_API_KEY',
          'x-api-secret': apiSecret || 'YOUR_API_SECRET',
          'Content-Type': 'application/json'
        },
        body: {
          resource: 'https://your-api.com/api/premium-data?plan=pro',
          method: 'GET',
          requirements: [
            {
              network: 'base',
              payTo: '0xMerchantBaseAddress...',
              asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              maxAmountRequired: '100000', // 0.1 USDC with 6 decimals
              description: 'Pro plan: 1 month access',
              maxTimeoutSeconds: 300,
              mimeType: 'application/json',
              extra: {
                plan: 'pro'
              }
            }
          ]
        }
      },
      response: {
        ok: true,
        challenge: {
          x402Version: 1,
          resource: 'https://your-api.com/api/premium-data?plan=pro',
          method: 'GET',
          accepts: [
            {
              scheme: 'exact',
              network: 'base',
              maxAmountRequired: '100000',
              resource: 'https://your-api.com/api/premium-data?plan=pro',
              description: 'Pro plan: 1 month access',
              mimeType: 'application/json',
              payTo: '0xMerchantBaseAddress...',
              maxTimeoutSeconds: 300,
              asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              outputSchema: {
                type: 'object',
                description: 'API response data'
              },
              extra: {
                plan: 'pro',
                feePayer: 'solana_fee_payer_if_applicable'
              }
            }
          ]
        }
      }
    },
    {
      method: 'POST',
      path: '/404/payments/verify-and-settle',
      description: 'Verify and settle a payment using the x-payment header from the wallet',
      auth: true,
      request: {
        headers: {
          'x-api-key': apiKeyId || 'YOUR_API_KEY',
          'x-api-secret': apiSecret || 'YOUR_API_SECRET',
          'Content-Type': 'application/json'
        },
        body: {
          paymentHeader: '<x-payment header from wallet, base64 JSON>',
          resource: 'https://your-api.com/api/premium-data?plan=pro',
          requirement: {
            network: 'base',
            payTo: '0xMerchantBaseAddress...',
            asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            maxAmountRequired: '100000',
            description: 'Pro plan: 1 month access',
            maxTimeoutSeconds: 300,
            mimeType: 'application/json',
            extra: {
              plan: 'pro'
            }
          }
        }
      },
      response: {
        ok: true,
        payment: {
          success: true,
          txHash: '0xtransaction_hash...',
          networkId: 'base',
          timestamp: '2025-11-13T10:30:00Z'
        }
      }
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="bg-gradient-to-r from-[#17ff9a]/10 to-[#0ea674]/10 border-b border-[#17ff9a]/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17ff9a] to-[#0ea674] flex items-center justify-center shadow-lg shadow-[#17ff9a]/20">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">404 Payments API</h2>
              <p className="text-xs text-gray-400">x402-compatible AI Agent Payment Gateway</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
              <div className="w-2 h-2 bg-[#17ff9a] rounded-full animate-pulse" />
              <span className="text-gray-400">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* API Keys Card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#17ff9a]/20 to-[#0ea674]/20 border border-[#17ff9a]/30 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-[#17ff9a]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-lg">Your API Keys</h3>
                {apiKeyId && (
                  <span className="text-[11px] px-2 py-1 rounded-full bg-[#0f0f0f] border border-[#2a2a2a] text-gray-400 font-mono">
                    {apiKeyId.slice(0, 6)}…{apiKeyId.slice(-4)}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-3">
                This API key is used by your backend to talk to the 404 Payments service.
                We’ll auto-create one for you if it doesn’t exist yet.
              </p>

              {keysLoading && (
                <p className="text-xs text-gray-500">Loading keys...</p>
              )}

              {keysError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                  {keysError}
                </div>
              )}

              {!keysLoading && !keysError && apiKeyId && (
                <div className="space-y-3">
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-1 font-mono">x-api-key</span>
                      <span className="text-xs md:text-sm text-[#17ff9a] font-mono break-all">
                        {apiKeyId}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(apiKeyId, 'api-key')}
                      className="flex-shrink-0 text-gray-400 hover:text-[#17ff9a] transition-colors"
                    >
                      {copiedEndpoint === 'api-key' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 mb-1 font-mono block">x-api-secret</span>
                      {apiSecret ? (
                        <>
                          <span className="text-xs md:text-sm text-[#17ff9a] font-mono break-all">
                            {apiSecret}
                          </span>
                          <p className="text-[11px] text-yellow-400 mt-1">
                            This secret is only shown <span className="font-semibold">once</span>.
                            Store it securely (env vars, secret manager, etc).
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Secret cannot be retrieved again. Rotate your key to generate a new secret.
                        </p>
                      )}
                    </div>
                    {apiSecret && (
                      <button
                        onClick={() => copyToClipboard(apiSecret, 'api-secret')}
                        className="flex-shrink-0 text-gray-400 hover:text-[#17ff9a] transition-colors mt-1"
                      >
                        {copiedEndpoint === 'api-secret' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={fetchKeys}
                      disabled={keysLoading}
                      className="px-3 py-2 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-300 hover:bg-[#252525] transition-all disabled:opacity-50"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={rotateKeys}
                      disabled={rotating}
                      className="px-3 py-2 text-xs bg-gradient-to-r from-[#17ff9a] to-[#0ea674] rounded-lg text-black font-semibold hover:shadow-lg hover:shadow-[#17ff9a]/30 transition-all disabled:opacity-50"
                    >
                      {rotating ? 'Rotating…' : 'Rotate Key'}
                    </button>
                  </div>

                  {isExistingKey && apiSecret == null && (
                    <p className="text-[11px] text-gray-500">
                      This key already existed, so we can’t show the original secret.
                      Use <span className="font-mono">Rotate Key</span> to generate a fresh
                      key + secret pair.
                    </p>
                  )}
                </div>
              )}

              {!keysLoading && !keysError && !apiKeyId && (
                <p className="text-xs text-gray-500">
                  No key available yet. Try refreshing, or check your session.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#17ff9a]/20 to-[#0ea674]/20 border border-[#17ff9a]/30 flex items-center justify-center flex-shrink-0">
              <Code className="w-6 h-6 text-[#17ff9a]" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">Getting Started</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                The 404 Payments API lets you accept onchain payments for your AI agents or APIs using
                x402-compatible payment headers. Your backend talks to 404 using simple JSON REST.
              </p>
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">Base URL</span>
                  <button
                    onClick={() => copyToClipboard(baseUrl, 'base-url')}
                    className="text-gray-400 hover:text-[#17ff9a] transition-colors"
                  >
                    {copiedEndpoint === 'base-url' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <code className="text-[#17ff9a] text-sm font-mono">{baseUrl}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-3">
          <h3 className="text-white font-bold text-lg px-1">API Endpoints</h3>
          {endpoints.map((endpoint, index) => (
            <div
              key={index}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#17ff9a]/30 transition-all group"
            >
              <button
                onClick={() =>
                  setSelectedEndpoint(
                    selectedEndpoint?.path === endpoint.path ? null : endpoint
                  )
                }
                className="w-full p-4 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${getMethodColor(
                      endpoint.method
                    )}`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-sm text-gray-300 font-mono flex-1">
                    {endpoint.path}
                  </code>
                  {endpoint.auth && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Lock className="w-3 h-3" />
                      <span>Auth</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400 pl-1">{endpoint.description}</p>
              </button>

              {selectedEndpoint?.path === endpoint.path && (
                <div className="border-t border-[#2a2a2a] p-4 space-y-4 bg-[#0f0f0f]">
                  {endpoint.request?.headers && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                        <Send className="w-3 h-3" />
                        REQUEST HEADERS
                      </h4>
                      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3">
                        <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
                          {JSON.stringify(endpoint.request.headers, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {endpoint.request?.body && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        REQUEST BODY
                      </h4>
                      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3">
                        <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
                          {JSON.stringify(endpoint.request.body, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {endpoint.response && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                        <Check className="w-3 h-3" />
                        RESPONSE (200 OK)
                      </h4>
                      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3">
                        <pre className="text-xs font-mono text-[#17ff9a] overflow-x-auto">
                          {JSON.stringify(endpoint.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      copyToClipboard(
                        `curl -X ${endpoint.method} ${baseUrl}${endpoint.path} \\\n` +
                          (endpoint.request?.headers
                            ? Object.entries(endpoint.request.headers)
                                .map(
                                  ([key, value]) => `  -H "${key}: ${value}"`
                                )
                                .join(' \\\n')
                            : '') +
                          (endpoint.request?.body
                            ? ` \\\n  -d '${JSON.stringify(
                                endpoint.request.body
                              )}'`
                            : ''),
                        endpoint.path
                      )
                    }
                    className="w-full px-4 py-2 bg-gradient-to-r from-[#17ff9a] to-[#0ea674] rounded-xl text-black font-semibold text-sm hover:shadow-lg hover:shadow-[#17ff9a]/30 transition-all flex items-center justify-center gap-2"
                  >
                    {copiedEndpoint === endpoint.path ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied to Clipboard
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy cURL Command
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Payment Flow explanation */}
        <div className="bg-gradient-to-br from-[#17ff9a]/10 to-[#0ea674]/10 border border-[#17ff9a]/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#17ff9a] to-[#0ea674] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#17ff9a]/20">
              <DollarSign className="w-6 h-6 text-black" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">Payment Flow</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#17ff9a]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#17ff9a]">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Create Challenge
                    </p>
                    <p className="text-gray-400">
                      Your backend calls <code className="font-mono text-xs">POST /404/payments/challenge</code> with
                      payment requirements (network, payTo, amount, etc).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#17ff9a]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#17ff9a]">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Wallet / Client Pays</p>
                    <p className="text-gray-400">
                      You hand the challenge to the user&apos;s wallet / client,
                      which produces an <code className="font-mono text-xs">x-payment</code> header.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#17ff9a]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#17ff9a]">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Verify &amp; Settle
                    </p>
                    <p className="text-gray-400">
                      Your backend calls{' '}
                      <code className="font-mono text-xs">
                        POST /404/payments/verify-and-settle
                      </code>{' '}
                      with the <code className="font-mono text-xs">x-payment</code>{' '}
                      header. If it succeeds, you unlock your resource.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication section */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Authentication</h3>
          <p className="text-gray-400 text-sm mb-4">
            404 Payments uses two layers:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 mb-4 space-y-1">
            <li>
              <span className="font-semibold">Dashboard Auth</span> – to manage your
              API key via <code className="font-mono text-xs">/404/keys</code>{' '}
              (uses your normal session/JWT).
            </li>
            <li>
              <span className="font-semibold">API Key Auth</span> – for your backend
              to call 404 Payments using headers:
            </li>
          </ul>

          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 space-y-2">
            <code className="text-[#17ff9a] text-sm font-mono block">
              x-api-key: {apiKeyId || 'YOUR_API_KEY'}
            </code>
            <code className="text-[#17ff9a] text-sm font-mono block">
              x-api-secret: {apiSecret ? '[hidden here, copy from above]' : 'YOUR_API_SECRET'}
            </code>
          </div>

          <p className="text-gray-500 text-xs mt-4">
            Your session in the dApp is used to manage keys. Use the key + secret above
            only in your own backend (server-side), never in client-side code.
          </p>
        </div>
      </div>
    </div>
  );
};

export default APIDoc;
