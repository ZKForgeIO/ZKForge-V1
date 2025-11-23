import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/authService';
import { ZKAuthService } from '../lib/zkAuth';

export default function Auth() {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(false);
  const [zkSecretKey, setZkSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');

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
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanedSecret = ZKAuthService.unformatSecretKey(zkSecretKey.trim());

      if (!ZKAuthService.validateSecretKeyFormat(cleanedSecret)) {
        setError('Invalid secret key format. Please ensure it starts with 0x and is 128 hexadecimal characters long.');
        setLoading(false);
        return;
      }

      const result = await AuthService.signIn(username.trim(), cleanedSecret);

      if (result.success) {
        navigate('/dapp/chat');
      } else {
        setError(result.error || 'Sign in failed');
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

  const handleStartSignUp = () => {
    navigate('/dapp/username');
  };

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
                <svg
                  className="w-8 h-8 text-[#17ff9a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isSignIn ? 'Welcome Back' : 'Zero-Knowledge Authentication'}
              </h1>
              <p className="text-sm text-gray-400">
                {isSignIn
                  ? 'Enter your ZK secret key to access your account'
                  : 'Sign up to create your quantum-resistant identity'}
              </p>
            </div>

            {isSignIn ? (
              <form onSubmit={handleSignIn} className="space-y-5">
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
                    placeholder="your_username"
                    className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="zkSecret" className="block text-sm font-medium text-gray-300 mb-2">
                    ZK Secret Key
                  </label>
                  <div className="relative">
                    <input
                      id="zkSecret"
                      type={showSecret ? 'text' : 'password'}
                      value={zkSecretKey}
                      onChange={(e) => setZkSecretKey(e.target.value)}
                      required
                      placeholder="0x..."
                      className="w-full px-4 py-3 pr-12 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#17ff9a] transition-colors"
                    >
                      {showSecret ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Enter your ZK secret key in format: 0x... (hexadecimal)
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(23,255,154,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    'Sign In with ZK Proof'
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="p-4 bg-[#0d3d2a]/30 border border-[#17ff9a]/20 rounded-xl">
                  <h3 className="text-sm font-semibold text-[#17ff9a] mb-2">No Email Required</h3>
                  <p className="text-xs text-gray-400">
                    Your identity is secured by zkSTARK proofs. A unique secret key and Solana wallet will be generated for you.
                  </p>
                </div>

                <button
                  onClick={handleStartSignUp}
                  className="w-full py-3.5 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(23,255,154,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create New Account
                </button>

                <div className="space-y-3 text-xs text-gray-500">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#17ff9a] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Quantum-resistant zkSTARK authentication</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#17ff9a] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Automatic Solana wallet generation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#17ff9a] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Private keys never stored in database</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-[#2a2a2a] text-center">
              <button
                onClick={() => {
                  setIsSignIn(!isSignIn);
                  setError('');
                  setZkSecretKey('');
                }}
                className="text-sm text-gray-400 hover:text-[#17ff9a] transition-colors"
              >
                {isSignIn
                  ? "Don't have an account? Sign up"
                  : 'Already have a secret key? Sign in'}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-[#17ff9a]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secured with zkSTARK proofs</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
