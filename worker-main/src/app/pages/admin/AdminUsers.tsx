import { useState, useEffect } from 'react';
import { Search, UserX, UserCheck, Trash2 } from 'lucide-react';
import { api } from '../../api';

interface UserRow { id: number; name: string; email: string; type: string; phone: string; business_name: string; rating: number; jobs_done: number; earned: number; is_active: boolean; created_at: string; }

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (search) params.set('search', search);
    try { setUsers(await api.get(`/admin/users?${params}`)); } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [typeFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetch(); };

  const toggleUser = async (id: number) => { await api.patch(`/admin/users/${id}/toggle`, {}); fetch(); };
  const deleteUser = async (id: number) => { if (confirm('Delete this user permanently?')) { await api.del(`/admin/users/${id}`); fetch(); } };

  return (
    <div>
      <h1 className="text-3xl mb-8">Manage Users</h1>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Search</button>
          </form>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="">All Types</option><option value="provider">Providers</option><option value="seeker">Seekers</option>
          </select>
        </div>
        {loading ? <p className="text-center py-8 text-gray-500">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-600">
                <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Rating</th><th className="pb-3 pr-4">Jobs</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 pr-4">{u.name}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                    <td className="py-3 pr-4"><span className={`px-2 py-1 rounded-full text-xs ${u.type === 'provider' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>{u.type}</span></td>
                    <td className="py-3 pr-4">{Number(u.rating).toFixed(1)}</td>
                    <td className="py-3 pr-4">{u.jobs_done}</td>
                    <td className="py-3 pr-4"><span className={`px-2 py-1 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td className="py-3 flex gap-2">
                      <button onClick={() => toggleUser(u.id)} className="p-1 hover:bg-gray-200 rounded" title={u.is_active ? 'Disable' : 'Enable'}>
                        {u.is_active ? <UserX className="w-4 h-4 text-orange-600" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                      </button>
                      <button onClick={() => deleteUser(u.id)} className="p-1 hover:bg-gray-200 rounded" title="Delete"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-center py-8 text-gray-500">No users found</p>}
          </div>
        )}
      </div>
    </div>
  );
};
