import { useAuth } from '../../context/AuthContext';
import { BarChart3, Briefcase, DollarSign, Star, TrendingUp } from 'lucide-react';

export const ProviderOverview = () => {
  const { user } = useAuth();

  const stats = [
    { icon: Star, label: 'Rating', value: Number(user?.rating || 0).toFixed(2), color: 'bg-yellow-500' },
    { icon: Briefcase, label: 'Jobs Done', value: user?.jobs_done || 0, color: 'bg-blue-500' },
    { icon: DollarSign, label: 'Total Earned', value: `LRs ${user?.earned || 0}`, color: 'bg-green-500' },
    { icon: TrendingUp, label: 'Hourly Rate', value: `LRs ${user?.hourly_rate || 0}/hr`, color: 'bg-indigo-500' },
  ];

  const sections = [
    { title: 'Dashboard', description: 'View your stats and performance', icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
    { title: 'My Jobs', description: 'Manage incoming requests', icon: Briefcase, color: 'bg-green-100 text-green-600' },
    { title: 'Reviews', description: 'See what customers say about you', icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  ];

  return (
    <div>
      <h1 className="text-3xl mb-8">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4"><div className={`${s.color} p-3 rounded-lg`}><s.icon className="w-6 h-6 text-white" /></div></div>
            <p className="text-gray-600 text-sm mb-1">{s.label}</p><p className="text-2xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map((s) => (
            <div key={s.title} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className={`${s.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}><s.icon className="w-6 h-6" /></div>
              <h3 className="mb-2">{s.title}</h3><p className="text-sm text-gray-600">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl mb-4">Recent Activity</h2>
        <div className="text-center py-12 text-gray-500"><p>No recent activity to display</p><p className="text-sm mt-2">Start accepting jobs to see your activity here</p></div>
      </div>
    </div>
  );
};
