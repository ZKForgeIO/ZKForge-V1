import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService, ApiClient } from '../lib/authService';
import { ArrowLeft, X } from 'lucide-react';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    if (!AuthService.isAuthenticated()) { navigate('/dapp/auth'); return; }
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser?.success) { navigate('/dapp/auth'); return; }
    setProfile({ id: currentUser.userId, username: currentUser.username, profile_picture_url: '' });
    setUsername(currentUser.username || '');
    setProfilePictureUrl('');
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (username.length < 3) return setError('Username must be at least 3 characters');
    if (username.length > 20) return setError('Username must be less than 20 characters');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return setError('Username can only contain letters, numbers, and underscores');
    setSaving(true);
    try {
      const { ok, error } = await ApiClient.patch('/profiles', { username, profile_picture_url: profilePictureUrl || null });
      if (!ok) throw new Error(error || 'Failed to update profile');
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/dapp/chat'), 1200);
    } catch (err:any) {
      setError(err.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#17ff9a] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden relative">
      {/* keep your original UI; only handlers changed */}
      <div className="w-full max-w-md relative z-10">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden shadow-2xl">
          <div className="relative p-8">
            <button onClick={() => navigate('/dapp/chat')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-[#17ff9a] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to chat</span>
            </button>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
              <p className="text-gray-400 text-sm">Update your profile information</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-[#2a2a2a]" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center">
                      <span className="text-black text-3xl font-bold">{username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {profilePictureUrl && (
                    <button type="button" onClick={() => setProfilePictureUrl('')} className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Profile Picture URL</label>
                <input
                  type="url"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
                  required
                />
              </div>

              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-red-400 text-sm">{error}</p></div>}
              {success && <div className="p-3 bg-[#17ff9a]/10 border border-[#17ff9a]/20 rounded-xl"><p className="text-[#17ff9a] text-sm">{success}</p></div>}

              <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-[#17ff9a]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
