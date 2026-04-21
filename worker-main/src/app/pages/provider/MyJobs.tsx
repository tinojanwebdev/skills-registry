import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../api';

type JobStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed';

interface Job {
  id: number;
  title: string;
  client_name: string;
  amount: number;
  status: Exclude<JobStatus, 'all'>;
  created_at: string;
  description: string;
}

export const MyJobs = () => {
  const [activeTab, setActiveTab] = useState<JobStatus>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await api.get<Job[]>(`/jobs?status=${activeTab}`);
      setJobs(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); fetchJobs(); }, [activeTab]);

  // Check if provider has an active (accepted or in_progress) job
  const hasActiveJob = jobs.some(j => j.status === 'accepted' || j.status === 'in_progress');

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/jobs/${id}/status`, { status });
      fetchJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const tabs: { id: JobStatus; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: AlertCircle },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'accepted', label: 'Accepted', icon: CheckCircle },
    { id: 'in_progress', label: 'In Progress', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <h1 className="text-3xl mb-8">My Jobs</h1>

      {hasActiveJob && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-700">You have an active job. Complete it before accepting new ones. Other pending jobs are in waiting queue.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex flex-wrap border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {loading ? <p className="text-center py-12 text-gray-500">Loading...</p> : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => {
                const isWaiting = job.status === 'pending' && hasActiveJob;
                return (
                  <div key={job.id} className={`border rounded-lg p-4 transition-shadow ${isWaiting ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200 hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg mb-1">{job.title}</h3>
                        <p className="text-sm text-gray-600">Client: {job.client_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isWaiting && (
                          <span className="px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-700">⏳ Waiting</span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{job.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{new Date(job.created_at).toLocaleDateString()}</span>
                      <span className="text-lg text-indigo-600">LRs {job.amount}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {job.status === 'pending' && !hasActiveJob && (<>
                        <button onClick={() => updateStatus(job.id, 'accepted')} className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Accept</button>
                        <button onClick={() => updateStatus(job.id, 'cancelled')} className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Decline</button>
                      </>)}
                      {job.status === 'pending' && hasActiveJob && (
                        <div className="w-full text-center py-2 px-4 rounded-lg bg-orange-100 text-orange-700 text-sm">
                          ⏳ In queue — complete your current job to accept this one
                        </div>
                      )}
                      {job.status === 'accepted' && (
                        <button onClick={() => updateStatus(job.id, 'in_progress')} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Start Job</button>
                      )}
                      {job.status === 'in_progress' && (
                        <button onClick={() => updateStatus(job.id, 'completed')} className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Mark as Completed</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No {activeTab !== 'all' ? activeTab.replace('_', ' ') : ''} jobs found</p>
              <p className="text-sm mt-2">New job requests will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
