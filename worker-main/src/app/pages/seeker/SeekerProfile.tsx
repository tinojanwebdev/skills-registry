import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, SERVER_BASE } from '../../api';
import { Save, X, Camera } from 'lucide-react';

export const SeekerProfile = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '', phone: user?.phone || '', address: user?.address || '', city: user?.city || '', state: user?.state || '',
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await api.upload('/users/me/avatar', fd);
      await refreshUser();
    } catch { alert('Failed to upload image'); }
    finally { setUploading(false); }
  };

  const profileImgUrl = user?.profile_image
    ? (user.profile_image.startsWith('http') ? user.profile_image : `${SERVER_BASE}${user.profile_image}`)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await updateProfile(formData); setIsEditing(false); } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', city: user?.city || '', state: user?.state || '' });
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">My Profile</h1>
        {!isEditing && <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Edit Profile</button>}
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            {profileImgUrl ? (
              <img src={profileImgUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl">{formData.name.charAt(0).toUpperCase()}</div>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {uploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
          </div>
          <div><h2 className="text-2xl mb-1">{formData.name}</h2><p className="text-gray-600">{user?.email}</p></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[['Full Name', 'name', 'text'], ['Phone', 'phone', 'tel'], ['City', 'city', 'text'], ['State', 'state', 'text'], ['Address', 'address', 'text']].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-sm mb-2 text-gray-700">{label}</label>
                <input type={type} value={(formData as any)[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-4">
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="w-5 h-5" />{saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleCancel} className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                <X className="w-5 h-5" />Cancel
              </button>
            </div>
          )}
        </form>
      </div>
      <div className="mt-6 bg-white rounded-xl shadow-md p-6 max-w-3xl">
        <h2 className="text-xl mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Account Type</span><span>Service Seeker</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Member Since</span><span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-600">Account Status</span><span className="text-green-600">Active</span></div>
        </div>
      </div>
    </div>
  );
};
