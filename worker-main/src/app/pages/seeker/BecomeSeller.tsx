import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Wrench, Send, Search } from 'lucide-react';

export const BecomeSeller = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<{ id: number; name: string; icon: string }[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    business_name: '',
    bio: '',
    hourly_rate: '',
    experience: '',
    skill_level: 'Beginner',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
  });

  useEffect(() => { api.get<any[]>('/categories').then(setCategories).catch(() => {}); }, []);

  const toggleCategory = (id: number) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setAddingCategory(true);
    try {
      const res = await api.post<{ id: number }>('/categories/suggest', { name: newCategory.trim() });
      const added = { id: res.id, name: newCategory.trim(), icon: '📌' };
      setCategories(prev => [...prev, added]);
      setSelectedCategories(prev => [...prev, res.id]);
      setNewCategory('');
    } catch (err: any) { alert(err.message || 'Failed to add category'); }
    finally { setAddingCategory(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedCategories.length === 0) { setError('Please select at least one service category'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: any }>('/auth/become-provider', {
        business_name: form.business_name,
        bio: form.bio,
        hourly_rate: parseFloat(form.hourly_rate),
        experience: parseInt(form.experience),
        skill_level: form.skill_level,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        category_ids: selectedCategories,
      });
      localStorage.setItem('token', res.token);
      window.location.href = '/provider/service-area?new=1';
    } catch (err: any) {
      setError(err.message || 'Failed to create seller account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-600 p-2 rounded-lg"><Wrench className="w-6 h-6 text-white" /></div>
          <h1 className="text-3xl">Become a Seller</h1>
        </div>
        <p className="text-gray-600">Start offering your services and earn money on Worker</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
        <h2 className="text-xl mb-6">Service Provider Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Service Categories */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">Service Category * <span className="text-gray-400">(select one or more)</span></label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={categorySearch} onChange={e => setCategorySearch(e.target.value)}
                placeholder="Search categories..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filteredCategories.map(c => (
                <button key={c.id} type="button" onClick={() => toggleCategory(c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategories.includes(c.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <span>{c.icon}</span><span>{c.name}</span>
                </button>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <p className="text-xs text-indigo-600 mt-2">{selectedCategories.length} selected: {selectedCategories.map(id => categories.find(c => c.id === id)?.name).join(', ')}</p>
            )}
            <div className="mt-2 flex gap-2">
              <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                placeholder="Can't find yours? Type to add..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={handleAddCategory} disabled={addingCategory || !newCategory.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0">
                {addingCategory ? 'Adding...' : '+ Add'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-700">Business / Service Name *</label>
            <input type="text" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Expert Plumber, IT Technician" />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-700">About Your Service *</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe what services you offer..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Hourly Rate (LRs) *</label>
              <input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1500" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Experience (years) *</label>
              <input type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="3" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Skill Level *</label>
              <select value={form.skill_level} onChange={e => setForm({ ...form, skill_level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+94 77 123 4567" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">City</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">State</label>
              <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Address</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Send className="w-5 h-5" />
              {loading ? 'Creating Seller Account...' : 'Start Selling'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
