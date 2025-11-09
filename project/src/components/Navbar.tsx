import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/authService';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLaunchApp = async () => {
    if (AuthService.isAuthenticated()) {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser?.success && currentUser.username) {
        navigate('/dapp/chat');
      } else {
        navigate('/dapp/username');
      }
    } else {
      navigate('/dapp/auth');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-6">
      <div className="w-full max-w-5xl mx-auto">
        <div className="relative rounded-full bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#17ff9a]/5 via-transparent to-[#17ff9a]/5" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-[#17ff9a]/30 to-transparent" style={{ padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

          <div className="relative flex items-center justify-between px-6 py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#17ff9a]/20 blur-xl" />
                <div className="relative w-9 h-9">
                  <img src="/zk.png" alt="ZKForge" className="w-full h-full object-contain" />
                </div>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">ZKForge</span>
            </div>

            {/* Launch App Button */}
            <button
              onClick={handleLaunchApp}
              className="group relative px-6 py-2.5 rounded-full bg-gradient-to-r from-[#17ff9a] to-[#0ea674] text-black font-semibold text-sm shadow-lg hover:shadow-[#17ff9a]/50 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0ea674] to-[#17ff9a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Launch App
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
