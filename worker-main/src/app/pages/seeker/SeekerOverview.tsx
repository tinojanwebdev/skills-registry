import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Map, Calendar, MessageSquare, Star, Search, TrendingUp } from 'lucide-react';
import { api } from '../../api';

export const SeekerOverview = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{ id: number; name: string; icon: string }[]>([]);

  useEffect(() => { api.get<any[]>('/categories').then(setCategories).catch(() => {}); }, []);

  const quickActions = [
    { title: 'Find Services', description: 'Browse available service providers', icon: Map, color: 'bg-blue-500', path: '/seeker/map' },
    { title: 'My Bookings', description: 'View and manage your bookings', icon: Calendar, color: 'bg-green-500', path: '/seeker/bookings' },
    { title: 'Messages', description: 'Chat with service providers', icon: MessageSquare, color: 'bg-purple-500', path: '/seeker/inbox' },
    { title: 'Reviews', description: 'Rate your experience', icon: Star, color: 'bg-yellow-500', path: '/seeker/reviews' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Welcome Back!</h1>
        <p className="text-gray-600">Find and book professional services in your area</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Search className="w-6 h-6 text-gray-400 hidden sm:block" />
          <input type="text" placeholder="Search for services..." className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => navigate('/seeker/map')} />
          <button onClick={() => navigate('/seeker/map')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Search</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickActions.map((a) => (
          <button key={a.title} onClick={() => navigate(a.path)} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left">
            <div className={`${a.color} p-3 rounded-lg inline-block mb-4`}><a.icon className="w-6 h-6 text-white" /></div>
            <h3 className="mb-2">{a.title}</h3><p className="text-sm text-gray-600">{a.description}</p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="text-xl">Service Categories</h2><TrendingUp className="w-5 h-5 text-blue-600" /></div>
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/seeker/map')}>
                <div className="flex items-center gap-3"><span className="text-2xl">{c.icon}</span><span>{c.name}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl mb-6">Recent Activity</h2>
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No recent bookings</p><p className="text-sm mt-2">Start booking services to see your activity here</p>
          </div>
        </div>
      </div>
    </div>
  );
};
