import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Star, X, Send, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../../api';
import { LocationInput } from '../../components/LocationInput';
import { ReactNode } from 'react';

interface Booking {
  id: number; title: string; client_name: string; provider_id: number; amount: number; status: string;
  scheduled_date: string; scheduled_time: string; location: string; description: string;
  provider_busy?: boolean;
}

export const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Rebook modal
  const [rebookBooking, setRebookBooking] = useState<Booking | null>(null);
  const [rebookTitle, setRebookTitle] = useState('');
  const [rebookDesc, setRebookDesc] = useState('');
  const [rebookDate, setRebookDate] = useState('');
  const [rebookTime, setRebookTime] = useState('');
  const [rebookLocation, setRebookLocation] = useState('');
  const [rebookLoading, setRebookLoading] = useState(false);

  const fetchBookings = async () => {
    try { setBookings(await api.get<Booking[]>('/jobs')); } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const cancelBooking = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/jobs/${id}/cancel`, {});
      fetchBookings();
    } catch (err: any) { alert(err.message || 'Failed to cancel'); }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking || !reviewRating) return;
    setReviewLoading(true);
    try {
      await api.post('/reviews', {
        reviewee_id: reviewBooking.provider_id,
        job_id: reviewBooking.id,
        rating: reviewRating,
        comment: reviewComment,
        service: reviewBooking.title,
      });
      setReviewBooking(null);
      setReviewRating(0);
      setReviewComment('');
      alert('Review submitted!');
    } catch (err: any) { alert(err.message || 'Failed to submit review'); }
    finally { setReviewLoading(false); }
  };

  const submitRebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rebookBooking) return;
    setRebookLoading(true);
    try {
      await api.post('/jobs', {
        title: rebookTitle,
        description: rebookDesc,
        provider_id: rebookBooking.provider_id,
        amount: rebookBooking.amount,
        scheduled_date: rebookDate || null,
        scheduled_time: rebookTime || null,
        location: rebookLocation || rebookBooking.location || 'Home Visit',
      });
      setRebookBooking(null);
      setRebookTitle(''); setRebookDesc(''); setRebookDate(''); setRebookTime(''); setRebookLocation('');
      fetchBookings();
      alert('Booking request sent!');
    } catch (err: any) { alert(err.message || 'Failed to rebook'); }
    finally { setRebookLoading(false); }
  };

  const openRebook = (b: Booking) => {
    setRebookBooking(b);
    setRebookTitle(b.title);
    setRebookDesc(b.description || '');
    setRebookLocation(b.location || '');
  };

  const color = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const actions = (b: Booking): ReactNode => {
    switch (b.status) {
      case 'pending': return (
        <button onClick={() => cancelBooking(b.id)} className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Cancel Booking</button>
      );
      case 'accepted': return (<>
        <div className="flex-1 text-center py-2 px-4 rounded-lg bg-blue-50 text-blue-700 text-sm">Provider accepted — waiting to start</div>
        <button onClick={() => cancelBooking(b.id)} className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Cancel</button>
      </>);
      case 'in_progress': return (
        <div className="w-full text-center py-2 px-4 rounded-lg bg-purple-50 text-purple-700 text-sm">Service in progress</div>
      );
      case 'completed': return (<>
        <button onClick={() => { setReviewBooking(b); setReviewRating(0); setReviewComment(''); }}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
          <Star className="w-4 h-4" />Leave Review
        </button>
        <button onClick={() => openRebook(b)}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" />Book Again
        </button>
      </>);
      default: return null;
    }
  };

  const group = (status: string) => bookings.filter(b => b.status === status);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl mb-8">My Bookings</h1>

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewBooking(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl">Leave a Review</h2>
              <button onClick={() => setReviewBooking(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">For: {reviewBooking.title} — {reviewBooking.client_name}</p>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setReviewRating(s)} className="cursor-pointer">
                      <Star className={`w-8 h-8 ${s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Your Review</label>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Share your experience..." required />
              </div>
              <button type="submit" disabled={reviewLoading || !reviewRating}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Send className="w-5 h-5" />{reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rebook Modal */}
      {rebookBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRebookBooking(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl">Book Again</h2>
              <button onClick={() => setRebookBooking(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Provider: {rebookBooking.client_name}</p>
            <form onSubmit={submitRebook} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700">Service Title</label>
                <input type="text" value={rebookTitle} onChange={e => setRebookTitle(e.target.value)} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700">Description</label>
                <textarea value={rebookDesc} onChange={e => setRebookDesc(e.target.value)} rows={3} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what you need..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Date</label>
                  <input type="date" value={rebookDate} onChange={e => setRebookDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Time</label>
                  <input type="time" value={rebookTime} onChange={e => setRebookTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700">Location</label>
                <LocationInput value={rebookLocation} onChange={setRebookLocation} placeholder="Search location or type address" />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <span className="text-gray-600">Rate:</span> <span className="text-blue-600 font-medium">LRs {rebookBooking.amount}/hr</span>
              </div>
              <button type="submit" disabled={rebookLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Calendar className="w-5 h-5" />{rebookLoading ? 'Sending...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map(s => {
        const items = group(s);
        if (!items.length) return null;
        return (
          <div key={s} className="mb-8">
            <h2 className="text-xl mb-4 capitalize">{s.replace('_', ' ')} Bookings</h2>
            <div className="space-y-4">
              {items.map(b => (
                <div key={b.id} className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                    <div>
                      <h3 className="text-lg mb-2">{b.title}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>{b.client_name}</span></div>
                        {b.scheduled_date && <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{b.scheduled_date}</span></div>}
                        {b.scheduled_time && <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{b.scheduled_time}</span></div>}
                        {b.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{b.location}</span></div>}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xl sm:text-2xl text-blue-600 mb-2">LRs {b.amount}</p>
                      <div className="flex flex-wrap gap-1 justify-start sm:justify-end">
                        {b.status === 'pending' && b.provider_busy && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-700">⏳ Waiting</span>
                        )}
                        <span className={`inline-block px-3 py-1 rounded-full text-xs ${color(b.status)}`}>{b.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  {b.status === 'pending' && b.provider_busy && (
                    <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                      The provider is currently working on another job. Your request is in their queue.
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">{actions(b)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {bookings.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" /><p className="mb-2">No bookings yet</p>
        </div>
      )}
    </div>
  );
};
