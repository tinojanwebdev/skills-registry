import { useState, useEffect } from 'react';
import { MessageCircle, Trash2, Send, X, Bug, Lightbulb, AlertTriangle } from 'lucide-react';
import { api } from '../../api';

interface FeedbackItem {
  id: number; user_name: string; user_email: string; user_type: string;
  subject: string; message: string; type: string; status: string;
  admin_reply: string | null; created_at: string;
}

const typeColor = (t: string) => {
  switch (t) { case 'bug': return 'bg-red-100 text-red-700'; case 'feature': return 'bg-yellow-100 text-yellow-700'; case 'complaint': return 'bg-orange-100 text-orange-700'; default: return 'bg-blue-100 text-blue-700'; }
};
const statusColor = (s: string) => {
  switch (s) { case 'pending': return 'bg-yellow-100 text-yellow-700'; case 'reviewed': return 'bg-blue-100 text-blue-700'; case 'resolved': return 'bg-green-100 text-green-700'; default: return 'bg-gray-100 text-gray-700'; }
};

export const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { setFeedbacks(await api.get(`/admin/feedbacks?status=${filter}`)); } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const updateStatus = async (id: number, status: string) => {
    await api.patch(`/admin/feedbacks/${id}`, { status });
    fetch();
  };

  const submitReply = async (id: number) => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      await api.patch(`/admin/feedbacks/${id}`, { admin_reply: replyText, status: 'reviewed' });
      setReplyId(null); setReplyText('');
      fetch();
    } catch { alert('Failed to send reply'); }
    finally { setReplyLoading(false); }
  };

  const deleteFeedback = async (id: number) => {
    if (!confirm('Delete this feedback?')) return;
    await api.del(`/admin/feedbacks/${id}`);
    fetch();
  };

  return (
    <div>
      <h1 className="text-3xl mb-8">Manage Feedback</h1>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending', 'reviewed', 'resolved'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <p className="text-center py-8 text-gray-500">Loading...</p> : feedbacks.length > 0 ? (
          <div className="space-y-4">
            {feedbacks.map(f => (
              <div key={f.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                  <div>
                    <h3 className="font-medium mb-1">{f.subject}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-600">{f.user_name} ({f.user_email})</span>
                      <span className={`px-2 py-0.5 rounded-full ${f.user_type === 'provider' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>{f.user_type}</span>
                      <span className={`px-2 py-0.5 rounded-full ${typeColor(f.type)}`}>{f.type}</span>
                      <span className={`px-2 py-0.5 rounded-full ${statusColor(f.status)}`}>{f.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{new Date(f.created_at).toLocaleDateString()}</span>
                    <button onClick={() => deleteFeedback(f.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{f.message}</p>

                {f.admin_reply && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-3">
                    <p className="text-xs text-indigo-600 mb-1 font-medium">Your Reply:</p>
                    <p className="text-sm text-gray-700">{f.admin_reply}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {f.status !== 'resolved' && (
                    <select value={f.status} onChange={e => updateStatus(f.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  )}
                  {replyId === f.id ? (
                    <div className="flex-1 flex gap-2">
                      <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply..." className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      <button onClick={() => submitReply(f.id)} disabled={replyLoading}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"><Send className="w-4 h-4" /></button>
                      <button onClick={() => { setReplyId(null); setReplyText(''); }}
                        className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setReplyId(f.id); setReplyText(f.admin_reply || ''); }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />{f.admin_reply ? 'Edit Reply' : 'Reply'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-center py-8 text-gray-500">No feedback found</p>}
      </div>
    </div>
  );
};
