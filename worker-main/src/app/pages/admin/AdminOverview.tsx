import { useState, useEffect } from 'react';
import { Users, Briefcase, Star, DollarSign, MessageCircleHeart } from 'lucide-react';
import { api } from '../../api';

export const AdminOverview = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { api.get('/admin/stats').then(setStats).catch(() => {}); }, []);

  if (!stats) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const cards = [
    { label: 'Total Users', value: stats.users?.total || 0, sub: `${stats.users?.providers || 0} providers · ${stats.users?.seekers || 0} seekers`, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Jobs', value: stats.jobs?.total || 0, sub: `${stats.jobs?.pending || 0} pending · ${stats.jobs?.in_progress || 0} active`, icon: Briefcase, color: 'bg-green-500' },
    { label: 'Reviews', value: stats.reviews?.total || 0, sub: `Avg rating: ${Number(stats.reviews?.avg_rating || 0).toFixed(1)}`, icon: Star, color: 'bg-yellow-500' },
    { label: 'Revenue', value: `LRs ${Number(stats.revenue?.total || 0).toLocaleString()}`, sub: `From ${stats.jobs?.completed || 0} completed jobs`, icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Feedback', value: stats.feedbacks?.total || 0, sub: `${stats.feedbacks?.pending || 0} pending`, icon: MessageCircleHeart, color: 'bg-pink-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl mb-8">Admin Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4"><div className={`${c.color} p-3 rounded-lg`}><c.icon className="w-6 h-6 text-white" /></div></div>
            <p className="text-gray-600 text-sm mb-1">{c.label}</p>
            <p className="text-2xl mb-1">{c.value}</p>
            <p className="text-xs text-gray-500">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
