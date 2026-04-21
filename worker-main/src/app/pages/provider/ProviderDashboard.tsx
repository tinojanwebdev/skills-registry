import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { LayoutDashboard, Briefcase, TrendingUp, MessageSquare, User, MapPin, Star, LogOut, Menu, X, ArrowRightLeft, MessageCircleHeart } from 'lucide-react';

export const ProviderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path: string) => {
    if (path === '/provider' && location.pathname === '/provider') return true;
    if (path !== '/provider' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/provider', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/provider/jobs', icon: Briefcase, label: 'My Jobs' },
    { path: '/provider/promote', icon: TrendingUp, label: 'Promote' },
    { path: '/provider/inbox', icon: MessageSquare, label: 'Inbox' },
    { path: '/provider/profile', icon: User, label: 'Profile' },
    { path: '/provider/service-area', icon: MapPin, label: 'Service Area' },
    { path: '/provider/reviews', icon: Star, label: 'Reviews' },
    { path: '/provider/feedback', icon: MessageCircleHeart, label: 'Feedback' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Top - Fixed */}
      <div className="shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-indigo-600">Worker</h1>
              <p className="text-sm text-gray-600 mt-1">Service Provider</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.business_name}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>⭐ {Number(user?.rating || 0).toFixed(1)}</span>
            <span>📋 {user?.jobs_done || 0} jobs</span>
            <span className="text-indigo-600">LRs {user?.hourly_rate || 0}/hr</span>
          </div>
        </div>
      </div>

      {/* Middle - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive(item.path) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}>
            <item.icon className="w-5 h-5" /><span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom - Fixed */}
      <div className="shrink-0 border-t p-4">
        <button onClick={async () => {
          try {
            const res = await api.post<{ token: string }>('/auth/switch-type', { target_type: 'seeker' });
            localStorage.setItem('token', res.token);
            window.location.href = '/seeker';
          } catch { alert('No seeker account found'); }
        }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
          <ArrowRightLeft className="w-5 h-5" /><span>Switch to Seeker</span>
        </button>
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
          <h1 className="text-xl text-indigo-600">Worker</h1>
        </div>
        <div className="p-4 sm:p-6 lg:p-8"><Outlet /></div>
      </main>
    </div>
  );
};
