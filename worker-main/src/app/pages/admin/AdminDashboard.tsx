import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Briefcase, Star, Tag, LogOut, Menu, X, Shield, MessageCircleHeart } from 'lucide-react';

export const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/admin/reviews', icon: Star, label: 'Reviews' },
    { path: '/admin/categories', icon: Tag, label: 'Categories' },
    { path: '/admin/feedback', icon: MessageCircleHeart, label: 'Feedback' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Top - Fixed */}
      <div className="shrink-0 p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            <div><h1 className="text-2xl text-red-600">Admin</h1><p className="text-sm text-gray-600">Control Panel</p></div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Middle - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive(item.path) ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-100'}`}>
            <item.icon className="w-5 h-5" /><span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom - Fixed */}
      <div className="shrink-0 border-t p-4">
        <button onClick={() => { logout(); navigate('/'); }}
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
          <h1 className="text-xl text-red-600">Admin Panel</h1>
        </div>
        <div className="p-4 sm:p-6 lg:p-8"><Outlet /></div>
      </main>
    </div>
  );
};
