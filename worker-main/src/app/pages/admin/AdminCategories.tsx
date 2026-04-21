import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../api';

interface Category { id: number; name: string; icon: string; }

export const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch = async () => { try { setCategories(await api.get('/categories')); } catch { /* empty */ } };
  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await api.post('/admin/categories', { name, icon: icon || '📌' }); setName(''); setIcon(''); fetch(); } catch { /* empty */ } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => { if (confirm('Delete this category?')) { await api.del(`/admin/categories/${id}`); fetch(); } };

  return (
    <div>
      <h1 className="text-3xl mb-8">Manage Categories</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl mb-6">Add Category</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Category Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="e.g., Plumber" required />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Icon (emoji)</label>
              <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="🔧" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Plus className="w-5 h-5" />{loading ? 'Adding...' : 'Add Category'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl mb-6">Existing Categories ({categories.length})</h2>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3"><span className="text-2xl">{c.icon}</span><span>{c.name}</span></div>
                <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
