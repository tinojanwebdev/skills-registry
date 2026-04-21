import React, { useState } from 'react';
import { Phone, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { dbService } from '../../services/database.service';

interface AuthScreenProps {
  role: 'buyer' | 'seller';
  onAuth: (data: { email?: string; phone?: string }) => void;
  onBack: () => void;
}

export function AuthScreen({ role, onAuth, onBack }: AuthScreenProps) {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (authMethod === 'phone') {
        setError('Phone OTP login is not available yet. Please use email login.');
        return;
      }

      if (isLogin) {
        // Login with email
        const result = await dbService.login(email, password);
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('user_id', result.user.id.toString());
        localStorage.setItem('user_role', result.user.role === 'seller' ? 'seller' : 'buyer');
        onAuth({ email });
      } else {
        // Register with email
        const result = await dbService.register({
          email,
          password,
          full_name: fullName,
          role,
        });
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('user_id', result.user.id.toString());
        localStorage.setItem('user_role', result.user.role === 'seller' ? 'seller' : 'buyer');
        onAuth({ email });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-6 pt-12 pb-24">
        <button
          onClick={onBack}
          className="mb-8 p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {`Sign ${isLogin ? 'in' : 'up'} as ${role === 'buyer' ? 'Buyer' : 'Worker'}`}
            </h2>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Welcome back! Sign in to continue'
                : 'Create an account to get started'}
            </p>
          </div>
          
          <div className="flex bg-secondary rounded-lg p-1">
            <button
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                authMethod === 'phone' ? 'bg-white shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Phone (Soon)
            </button>
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                authMethod === 'email' ? 'bg-white shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Email
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMethod === 'phone' ? (
              <Input
                type="tel"
                label="Phone Number"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="w-5 h-5" />}
                required
              />
            ) : (
              <>
                {!isLogin && (
                  <Input
                    type="text"
                    label="Full Name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                )}
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                  required
                />
                <Input
                  type="password"
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </>
            )}
            
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Processing...' : (authMethod === 'phone' ? 'Send Code' : (isLogin ? 'Sign In' : 'Sign Up'))}
            </Button>
            
            {authMethod === 'email' && (
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}


