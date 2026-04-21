import { useState, useEffect } from 'react';
import { api } from '../../api';

interface Job { id: number; title: string; seeker_name: string; provider_name: string; amount: number; status: string; created_at: string; }

export const AdminJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try { setJobs(await api.get(`/admin/jobs?status=${filter}`)); } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const updateStatus = async (id: number, status: string) => { await api.patch(`/admin/jobs/${id}/status`, { status }); fetch(); };

  const color = (s: string) => {
    switch (s) { case 'pending': return 'bg-yellow-100 text-yellow-700'; case 'accepted': return 'bg-blue-100 text-blue-700'; case 'in_progress': return 'bg-purple-100 text-purple-700'; case 'completed': return 'bg-green-100 text-green-700'; case 'cancelled': return 'bg-red-100 text-red-700'; default: return 'bg-gray-100 text-gray-700'; }
  };

  return (
    <div>
      <h1 className="text-3xl mb-8">Manage Jobs</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        {loading ? <p className="text-center py-8 text-gray-500">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-600">
                <th className="pb-3 pr-4">Title</th><th className="pb-3 pr-4">Seeker</th><th className="pb-3 pr-4">Provider</th>
                <th className="pb-3 pr-4">Amount</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Date</th><th className="pb-3">Actions</th>
              </tr></thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 pr-4">{j.title}</td>
                    <td className="py-3 pr-4">{j.seeker_name}</td>
                    <td className="py-3 pr-4">{j.provider_name}</td>
                    <td className="py-3 pr-4">LRs {j.amount}</td>
                    <td className="py-3 pr-4"><span className={`px-2 py-1 rounded-full text-xs ${color(j.status)}`}>{j.status.replace('_', ' ')}</span></td>
                    <td className="py-3 pr-4 text-gray-500">{new Date(j.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <select value={j.status} onChange={(e) => updateStatus(j.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs">
                        <option value="pending">Pending</option><option value="accepted">Accepted</option>
                        <option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && <p className="text-center py-8 text-gray-500">No jobs found</p>}
          </div>
        )}
      </div>
    </div>
  );
};
