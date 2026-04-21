import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getToken } from '../api';

export interface User {
  id: number;
  name: string;
  email: string;
  type: 'provider' | 'seeker' | 'admin';
  phone?: string;
  business_name?: string;
  bio?: string;
  hourly_rate?: number;
  experience?: number;
  skill_level?: 'Beginner' | 'Intermediate' | 'Expert';
  address?: string;
  city?: string;
  state?: string;
  availability?: 'available' | 'busy' | 'offline';
  latitude?: number;
  longitude?: number;
  radius?: number;
  rating?: number;
  jobs_done?: number;
  earned?: number;
  profile_image?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userType: 'provider' | 'seeker' | null;
  setUserType: (type: 'provider' | 'seeker') => void;
  login: (email: string, password: string, type: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (email: string, password: string, name: string, type: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'provider' | 'seeker' | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const u = await api.get<User>('/users/me');
      setUser(u);
      if (u.type === 'provider' || u.type === 'seeker') setUserType(u.type);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshUser(); }, []);

  const login = async (email: string, password: string, type: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password, type });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    if (res.user.type === 'provider' || res.user.type === 'seeker') setUserType(res.user.type);
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/google', { credential });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    if (res.user.type === 'provider' || res.user.type === 'seeker') setUserType(res.user.type);
  };

  const register = async (email: string, password: string, name: string, type: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { email, password, name, type });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    if (res.user.type === 'provider' || res.user.type === 'seeker') setUserType(res.user.type);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUserType(null);
  };

  const updateProfile = async (data: Record<string, unknown>) => {
    await api.put('/users/me', data);
    await refreshUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, userType, setUserType, login, loginWithGoogle, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
