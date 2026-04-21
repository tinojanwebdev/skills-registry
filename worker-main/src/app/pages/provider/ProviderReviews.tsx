import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { api } from '../../api';

interface Review { id: number; reviewer_name: string; rating: number; comment: string; created_at: string; service: string; }

export const ProviderReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => { api.get<Review[]>('/reviews').then(setReviews).catch(() => {}); }, []);

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div>
      <h1 className="text-3xl mb-8">Reviews</h1>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <div className="text-5xl mb-2">{avg}</div>
            <div className="flex justify-center mb-2">{renderStars(Math.round(parseFloat(avg)))}</div>
            <p className="text-sm text-gray-600">{reviews.length} reviews</p>
          </div>
          <div className="flex-1">
            <h2 className="text-xl mb-4">Rating Distribution</h2>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter(r => r.rating === stars).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 mb-2">
                  <span className="text-sm w-12">{stars} stars</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                  <span className="text-sm w-8 text-gray-600">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl mb-6">Customer Reviews</h2>
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
