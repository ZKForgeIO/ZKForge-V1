import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/authService';
import { ZKAuthService } from '../lib/zkAuth';
import { SolanaWalletService } from '../lib/solanaWallet';

export default function Username() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [zkSecretKey, setZkSecretKey] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');
  const [copiedZK, setCopiedZK] = useState(false);
  const [copiedSolana, setCopiedSolana] = useState(false);
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 50) + 1;
    const num2 = Math.floor(Math.random() * 50) + 1;
    setCaptchaNum1(num1);
    setCaptchaNum2(num2);
    setCaptchaAnswer('');
    setCaptchaError(false);
  };

  useEffect(() => {
    const checkExistingAuth = async () => {
      if (AuthService.isAuthenticated()) {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser?.success && currentUser.username) {
          navigate('/dapp/chat');
        }
      }
    };
    checkExistingAuth();
    generateCaptcha();
  }, [navigate]);

  const handleCopy = async (text: string, type: 'zk' | 'solana') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'zk') {
        setCopiedZK(true);
        setTimeout(() => setCopiedZK(false), 2000);
      } else {
        setCopiedSolana(true);
        setTimeout(() => setCopiedSolana(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

const handleDownloadKeys = () => {
  // ensure we always write the canonical 0x + 128-hex
  const normalizedZK = ZKAuthService.normalizeTo0xHex(zkSecretKey || '');
  const zkPublicKey = ZKAuthService.derivePublicKeyFromSecret(normalizedZK);

  const keysData = {
    username,
    zkSecretKey: normalizedZK,              // <- canonical format
    zkPublicKey,                            // base58 (handy for verification)
    solanaAddress,
    createdAt: new Date().toISOString(),
    format: '0x + 128-hex (64-byte expanded Ed25519 secret)', // doc
    version: 1,
    warning:
      'KEEP THIS FILE SECURE! Your ZK secret key is the only way to access your account.',
  };

  const blob = new Blob([JSON.stringify(keysData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zkforge-keys-${username}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    const correctAnswer = captchaNum1 + captchaNum2;
    const userAnswer = parseInt(captchaAnswer);

    if (isNaN(userAnswer) || userAnswer !== correctAnswer) {
      setCaptchaError(true);
      setError('Incorrect CAPTCHA answer. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await AuthService.signUp(username);

      if (result.success) {
        const normalized = ZKAuthService.normalizeTo0xHex(result.zkSecretKey || '');
  setZkSecretKey(normalized);
  setSolanaAddress(result.solanaAddress || '');
  setShowKeys(true);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToChat = () => {
    navigate('/dapp/chat');
  };

  if (showKeys) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#17ff9a] rounded-full blur-[200px] opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#10b981] rounded-full blur-[180px] opacity-15" />

        <div className="w-full max-w-2xl relative z-10">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(23,255,154,0.1),transparent_60%)]" />

            <div className="relative p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0d3d2a] border border-[#17ff9a]/30 mb-4">
                  <svg className="w-8 h-8 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Account Created Successfully!</h1>
                <p className="text-sm text-gray-400">Save your credentials securely. You will need them to sign in.</p>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-[#17ff9a]/10 border-2 border-[#17ff9a] rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-[#17ff9a] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-base font-bold text-[#17ff9a] mb-1">Critical: Save Your Keys</h3>
                      <p className="text-sm text-white font-medium">
                        Your ZK secret key is the ONLY way to access your account. We cannot recover it if lost. Save it in a secure location.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <div className="px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl">
                    <p className="text-white font-medium">{username}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ZK Secret Key</label>
                  <div className="relative">
                    <div className="px-4 py-3 pr-12 bg-[#0f0f0f] border border-[#17ff9a]/30 rounded-xl">
                      <p className="text-[#17ff9a] font-mono text-xs break-all">
                        {ZKAuthService.formatSecretKeyForDisplay(zkSecretKey)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(zkSecretKey, 'zk')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#17ff9a] transition-colors"
                    >
                      {copiedZK ? (
                        <svg className="w-5 h-5 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Use this key to sign in to your account</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Solana Wallet Address</label>
                  <div className="relative">
                    <div className="px-4 py-3 pr-12 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl">
                      <p className="text-white font-mono text-xs break-all">{solanaAddress}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(solanaAddress, 'solana')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#17ff9a] transition-colors"
                    >
                      {copiedSolana ? (
                        <svg className="w-5 h-5 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Your blockchain wallet address (derived from ZK key)</p>
                </div>

                <button
                  onClick={handleDownloadKeys}
                  className="w-full py-3 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-semibold rounded-xl hover:border-[#17ff9a]/50 hover:bg-[#1f1f1f] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Keys as File
                </button>

                <button
                  onClick={handleContinueToChat}
                  className="w-full py-3.5 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(23,255,154,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue to Chat
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-[#17ff9a]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Your identity is protected by zkSTARK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#17ff9a] rounded-full blur-[200px] opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#10b981] rounded-full blur-[180px] opacity-15" />

      <div className="w-full max-w-md relative z-10">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(23,255,154,0.1),transparent_60%)]" />

          <div className="relative p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0d3d2a] border border-[#17ff9a]/30 mb-4">
                <svg className="w-8 h-8 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Choose Your Username</h1>
              <p className="text-sm text-gray-400">This will be your identity in the private network</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
                />
                <p className="mt-2 text-xs text-gray-500">3-20 characters, letters, numbers, and underscores only</p>
              </div>

              <div>
                <label htmlFor="captcha" className="block text-sm font-medium text-gray-300 mb-2">
                  Security Check
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 px-4 py-3 bg-[#0d3d2a]/30 border border-[#17ff9a]/30 rounded-xl">
                    <p className="text-white text-center font-mono text-lg">
                      {captchaNum1} + {captchaNum2} = ?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-[#17ff9a]/50 transition-all text-gray-400 hover:text-[#17ff9a]"
                    title="Generate new problem"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <input
                  id="captcha"
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => {
                    setCaptchaAnswer(e.target.value);
                    setCaptchaError(false);
                    setError('');
                  }}
                  required
                  placeholder="Enter your answer"
                  className={`w-full px-4 py-3 bg-[#0f0f0f] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    captchaError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#2a2a2a] focus:border-[#17ff9a] focus:ring-[#17ff9a]/20'
                  }`}
                />
                <p className="mt-2 text-xs text-gray-500">Solve the math problem to verify you're human</p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="p-4 bg-[#0d3d2a]/20 border border-[#17ff9a]/20 rounded-xl space-y-2">
                <h3 className="text-sm font-semibold text-[#17ff9a]">What happens next:</h3>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#17ff9a] mt-0.5">•</span>
                    <span>A quantum-resistant ZK secret key will be generated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#17ff9a] mt-0.5">•</span>
                    <span>A Solana wallet will be created and linked to your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#17ff9a] mt-0.5">•</span>
                    <span>You must save your secret key to access your account</span>
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || username.length < 3 || !captchaAnswer}
                className="w-full py-3.5 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(23,255,154,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-[#17ff9a]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your identity is protected by zkSTARK</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dapp/auth')}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
