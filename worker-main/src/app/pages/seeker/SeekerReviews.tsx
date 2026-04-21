import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { api } from '../../api';

interface Review { id: number; reviewer_name: string; service: string; rating: number; comment: string; created_at: string; }

export const SeekerReviews = () => {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [revieweeId, setRevieweeId] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Review[]>('/reviews').then(setReviews).catch(() => {});
    api.get<any[]>('/providers').then(setProviders).catch(() => {});
  }, []);

  const renderStars = (r: number, interactive = false, onRate?: (v: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => interactive && onRate?.(s)} disabled={!interactive} className={interactive ? 'cursor-pointer' : ''}>
          <Star className={`w-6 h-6 ${s <= r ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revieweeId || !rating) return;
    setLoading(true);
    try {
      await api.post('/reviews', { reviewee_id: parseInt(revieweeId), rating, comment, service: providers.find(p => p.id === parseInt(revieweeId))?.business_name || '' });
      setShowForm(false); setRating(0); setComment(''); setRevieweeId('');
      api.get<Review[]>('/reviews').then(setReviews);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">My Reviews</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          {showForm ? 'Cancel' : 'Write Review'}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl mb-6">Write a Review</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Service Provider</label>
              <select value={revieweeId} onChange={(e) => setRevieweeId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select a provider</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name} - {p.business_name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm mb-2 text-gray-700">Rating</label>{renderStars(rating, true, setRating)}</div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Your Review</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Share your experience..." required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl mb-6">Your Reviews</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div><p className="font-medium">{r.reviewer_name}</p><p className="text-sm text-gray-600">{r.service}</p></div>
                  <span className="text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mb-2">{renderStars(r.rating)}</div>
                <p className="text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-12 text-gray-500"><p>No reviews yet</p></div>}
      </div>
    </div>
  );
};
