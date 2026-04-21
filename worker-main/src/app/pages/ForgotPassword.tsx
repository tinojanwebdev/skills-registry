import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, Send, KeyRound, Lock, CheckCircle } from 'lucide-react';
import { api } from '../api';

export const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1=email, 2=otp, 3=new password, 4=done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  // Resend OTP
  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setError('');
      setOtp('');
      alert('New OTP sent to your email!');
    } catch (err: any) {
      setError(err.message || 'Failed to resend');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">

        {/* Progress */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        {/* Step 1: Email */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <Mail className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h1 className="text-2xl mb-2 text-gray-800">Forgot Password?</h1>
              <p className="text-gray-600 text-sm">Enter your email to receive a verification code</p>
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your email" required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Send className="w-5 h-5" />{loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <KeyRound className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h1 className="text-2xl mb-2 text-gray-800">Enter OTP</h1>
              <p className="text-gray-600 text-sm">We sent a 6-digit code to <span className="font-medium">{email}</span></p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">OTP Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000" maxLength={6} required />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <div className="text-center">
                <button type="button" onClick={handleResend} disabled={loading}
                  className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
                  Didn't receive? Resend OTP
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h1 className="text-2xl mb-2 text-gray-800">New Password</h1>
              <p className="text-gray-600 text-sm">Create a strong new password</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter new password" required />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Confirm new password" required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl mb-2 text-gray-800">Password Reset!</h1>
            <p className="text-gray-600 text-sm mb-6">Your password has been updated for all your accounts.</p>
            <Link to="/login"
              className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors inline-block">
              Go to Login
            </Link>
          </div>
        )}

        {/* Back to login */}
        {step < 4 && (
          <div className="mt-6 text-center">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" />Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
