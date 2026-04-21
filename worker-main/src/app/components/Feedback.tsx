import { useState, useEffect } from 'react';
import { Send, MessageCircle, Bug, Lightbulb, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api';

interface Feedback {
  id: number; subject: string; message: string; type: string;
  status: string; admin_reply: string | null; created_at: string;
}

const typeOptions = [
  { value: 'general', label: 'General', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'bg-red-100 text-red-700' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'complaint', label: 'Complaint', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700' },
];

const statusIcon = (s: string) => {
  switch (s) {
    case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
    case 'reviewed': return <MessageCircle className="w-4 h-4 text-blue-600" />;
    case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
    default: return null;
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'reviewed': return 'bg-blue-100 text-blue-700';
    case 'resolved': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(false);

  const fetch = async () => { try { setFeedbacks(await api.get('/feedbacks')); } catch { /* empty */ } };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/feedbacks', { subject, message, type });
      setSubject(''); setMessage(''); setType('general'); setShowForm(false);
      fetch();
    } catch { alert('Failed to submit feedback'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">Feedback</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          {showForm ? 'Cancel' : 'Send Feedback'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl mb-6">Submit Feedback</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {typeOptions.map(t => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${type === t.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief summary of your feedback" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe your feedback in detail..." />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Send className="w-5 h-5" />{loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl mb-6">Your Feedback History</h2>
        {feedbacks.length > 0 ? (
          <div className="space-y-4">
            {feedbacks.map(f => {
              const typeOpt = typeOptions.find(t => t.value === f.type);
              return (
                <div key={f.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                    <div>
                      <h3 className="font-medium mb-1">{f.subject}</h3>
                      <div className="flex items-center gap-2">
                        {typeOpt && <span className={`px-2 py-0.5 rounded-full text-xs ${typeOpt.color}`}>{typeOpt.label}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusColor(f.status)}`}>
                          {statusIcon(f.status)}{f.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{f.message}</p>
                  {f.admin_reply && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-xs text-indigo-600 mb-1 font-medium">Admin Reply:</p>
                      <p className="text-sm text-gray-700">{f.admin_reply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No feedback submitted yet</p>
            <p className="text-sm mt-2">Share your thoughts to help us improve</p>
          </div>
        )}
      </div>
    </div>
  );
};
