import { useState, useEffect } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { api } from '../../api';

interface Review { id: number; reviewer_name: string; reviewee_name: string; rating: number; comment: string; service: string; created_at: string; }

export const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => { setLoading(true); try { setReviews(await api.get('/admin/reviews')); } catch { /* empty */ } finally { setLoading(false); } };
  useEffect(() => { fetch(); }, []);

  const deleteReview = async (id: number) => { if (confirm('Delete this review?')) { await api.del(`/admin/reviews/${id}`); fetch(); } };

  return (
    <div>
      <h1 className="text-3xl mb-8">Manage Reviews</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        {loading ? <p className="text-center py-8 text-gray-500">Loading...</p> : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">{r.reviewer_name}</span> → <span className="font-medium text-gray-800">{r.reviewee_name}</span></p>
                    <p className="text-xs text-gray-500">{r.service}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    <button onClick={() => deleteReview(r.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                  </div>
                </div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}
                </div>
                <p className="text-sm text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-center py-8 text-gray-500">No reviews found</p>}
      </div>
    </div>
  );
};
