import { useState, useEffect, useRef } from 'react';
import { Image, Send, X, Trash2 } from 'lucide-react';
import { api, SERVER_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';

interface Promotion {
  id: number; title: string; description: string; price: number;
  images: string | string[] | null; provider_name: string; provider_image: string | null;
  created_at: string;
}

export const Promote = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPromotions = async () => {
    try { setPromotions(await api.get<Promotion[]>('/promotions')); } catch { /* empty */ }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(newFiles);
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    const newFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(newFiles);
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('price', price);
      selectedFiles.forEach(f => fd.append('images', f));
      await api.upload('/promotions', fd);
      setTitle(''); setDescription(''); setPrice('');
      previews.forEach(p => URL.revokeObjectURL(p));
      setSelectedFiles([]); setPreviews([]);
      if (fileRef.current) fileRef.current.value = '';
      fetchPromotions();
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const imgUrl = (src: string) => src.startsWith('http') ? src : `${SERVER_BASE}${src}`;

  const parseImages = (images: string | string[] | null): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try { return JSON.parse(images); } catch { return []; }
  };

  const profileImgUrl = user?.profile_image
    ? (user.profile_image.startsWith('http') ? user.profile_image : `${SERVER_BASE}${user.profile_image}`)
    : null;

  return (
    <div>
      <h1 className="text-3xl mb-8">Promote Your Services</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl mb-6">Create a Post</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Service Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Expert Computer Repair Service" required />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe your service in detail..." required />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Price (LRs)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1500" required />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Add Images (max 5)</label>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click to upload images</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
              {previews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={src} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      <button type="button" onClick={() => removeFile(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Send className="w-5 h-5" />{loading ? 'Publishing...' : 'Publish Post'}
            </button>
          </form>
        </div>
        <div>
          <h2 className="text-xl mb-4">Your Posts</h2>
          {promotions.length > 0 ? (
            <div className="space-y-4">
              {promotions.map((p) => {
                const postImages = parseImages(p.images);
                const provImg = p.provider_image
                  ? (p.provider_image.startsWith('http') ? p.provider_image : `${SERVER_BASE}${p.provider_image}`)
                  : profileImgUrl;
                return (
                  <div key={p.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {provImg ? (
                        <img src={provImg} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
                          {(p.provider_name || user?.name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{p.provider_name || user?.name}</p>
                        <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <h3 className="text-lg mb-1">{p.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                    {postImages.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto">
                        {postImages.map((img, i) => (
                          <img key={i} src={imgUrl(img)} alt="" className="w-32 h-24 rounded-lg object-cover shrink-0" />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-600 font-medium">LRs {p.price}</span>
                      <button onClick={async () => {
                        if (!confirm('Delete this promotion?')) return;
                        try { await api.del(`/promotions/${p.id}`); fetchPromotions(); } catch { alert('Failed to delete'); }
                      }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-gray-500 text-center py-8">No posts yet. Create your first promotion!</p>}
        </div>
      </div>
    </div>
  );
};
