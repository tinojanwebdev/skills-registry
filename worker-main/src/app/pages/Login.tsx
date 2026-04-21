import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, LogIn } from 'lucide-react';

const GOOGLE_AUTH_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      for (const type of ['seeker', 'provider', 'admin']) {
        try {
          await login(email, password, type);
          if (type === 'admin') navigate('/admin');
          else if (type === 'provider') navigate('/provider');
          else navigate('/seeker');
          return;
        } catch { continue; }
      }
      setError('Invalid email or password');
    } catch { setError('Login failed'); }
    finally { setLoading(false); }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/seeker');
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2 text-gray-800">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue to Worker</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email" required />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your password" required />
            </div>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">Forgot Password?</Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <LogIn className="w-5 h-5" />{loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {GOOGLE_AUTH_ENABLED && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
            </div>
            <div className="mt-4 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
                size="large"
                text="signin_with"
                shape="rectangular"
                useOneTap
                ux_mode="popup"
              />
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-700">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
