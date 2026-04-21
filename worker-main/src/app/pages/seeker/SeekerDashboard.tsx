import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { LayoutDashboard, Map, MessageSquare, Calendar, Star, User, LogOut, Menu, X, Wrench, ArrowRightLeft, MessageCircleHeart } from 'lucide-react';

export const SeekerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasProviderAccount, setHasProviderAccount] = useState(false);

  const checkProvider = useCallback(() => {
    if (user?.email) {
      api.get<any>(`/auth/check-provider?email=${encodeURIComponent(user.email)}`)
        .then(res => setHasProviderAccount(res.exists)).catch(() => {});
    }
  }, [user?.email]);

  useEffect(() => { checkProvider(); }, [checkProvider]);
  useEffect(() => { if (sidebarOpen) checkProvider(); }, [sidebarOpen, checkProvider]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSwitchToProvider = async () => {
    if (!user) return;
    try {
      const res = await api.post<{ token: string; user: any }>('/auth/switch-type', { target_type: 'provider' });
      localStorage.setItem('token', res.token);
      window.location.href = '/provider';
    } catch { alert('Failed to switch account'); }
  };

  const isActive = (path: string) => {
    if (path === '/seeker' && location.pathname === '/seeker') return true;
    if (path !== '/seeker' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/seeker/map', icon: Map, label: 'Find Services' },
    { path: '/seeker/inbox', icon: MessageSquare, label: 'Messages' },
    { path: '/seeker/bookings', icon: Calendar, label: 'My Bookings' },
    { path: '/seeker/reviews', icon: Star, label: 'Reviews' },
    { path: '/seeker/overview', icon: LayoutDashboard, label: 'Overview' },
    { path: '/seeker/profile', icon: User, label: 'Profile' },
    { path: '/seeker/feedback', icon: MessageCircleHeart, label: 'Feedback' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Top - Fixed */}
      <div className="shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-blue-600">Worker</h1>
              <p className="text-sm text-gray-600 mt-1">Service Seeker</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}>
            <item.icon className="w-5 h-5" /><span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom - Fixed */}
      <div className="shrink-0 border-t p-4">
        {hasProviderAccount ? (
          <button onClick={handleSwitchToProvider}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
            <ArrowRightLeft className="w-5 h-5" /><span>Switch to Seller</span>
          </button>
        ) : (
          <Link to="/seeker/become-seller" onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Wrench className="w-5 h-5" /><span>Become a Seller</span>
          </Link>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" /><span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className="hidden lg:flex w-64 bg-white shadow-lg shrink-0 h-screen sticky top-0">{sidebarContent}</aside>
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebarContent}</aside>
      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 p-4 bg-white shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg"><Menu className="w-6 h-6" /></button>
          <h1 className="text-xl text-blue-600">Worker</h1>
        </div>
        <div className="p-4 sm:p-6 lg:p-8"><Outlet /></div>
      </main>
    </div>
  );
};
