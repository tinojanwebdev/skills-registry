import React, { useState, useEffect } from 'react';
import { Clock, MapPin, DollarSign, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { dbService } from '../../services/database.service';
import { BookingWithDetails } from '../../types/database';

interface SellerJobManagementProps {
  onNavigate: (page: string) => void;
}

export function SellerJobManagement({ onNavigate }: SellerJobManagementProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed'>('all');
  const [selectedJob, setSelectedJob] = useState<BookingWithDetails | null>(null);
  const [jobs, setJobs] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingReviewJobId, setSendingReviewJobId] = useState<number | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('user_id');
        if (userId) {
          const seller = await dbService.getSellerProfileByUser(parseInt(userId));
          const data = await dbService.getSellerBookings(seller.id);
          setJobs(data);
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setError('Failed to fetch jobs.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(job => job.status === filter);

  const handleAcceptJob = async (jobId: number) => {
    try {
      await dbService.updateBookingStatus(jobId, 'accepted');
      setJobs(jobs.map(job =>
        job.id === jobId ? { ...job, status: 'accepted' } : job
      ));
      setSelectedJob(null);
    } catch (err) {
      console.error('Failed to accept job:', err);
      setError('Failed to accept job.');
    }
  };

  const handleRejectJob = async (jobId: number) => {
    try {
      await dbService.updateBookingStatus(jobId, 'rejected');
      setJobs(jobs.filter(job => job.id !== jobId));
      setSelectedJob(null);
    } catch (err) {
      console.error('Failed to reject job:', err);
      setError('Failed to reject job.');
    }
  };

  const handleRequestCompletion = async (jobId: number) => {
    try {
      await dbService.updateBookingStatus(jobId, 'in_progress');
      setJobs(jobs.map(job =>
        job.id === jobId ? { ...job, status: 'in_progress' } : job
      ));
      setSelectedJob((prev) => (prev && prev.id === jobId ? { ...prev, status: 'in_progress' } : prev));
    } catch (err) {
      console.error('Failed to request completion:', err);
      setError('Failed to request completion.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-accent/10 text-accent';
      case 'accepted':
        return 'bg-primary/10 text-primary';
      case 'in_progress':
        return 'bg-primary/10 text-primary';
      case 'completed':
        return 'bg-[#10B981]/10 text-[#10B981]';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  const getReviewData = (job: BookingWithDetails) => {
    const anyJob = job as any;
    const rating = anyJob.review_rating ?? job.review?.rating;
    const comment = anyJob.review_comment ?? job.review?.comment;
    return {
      hasReview: Number.isFinite(Number(rating)),
      rating: Number(rating || 0),
      comment: comment || '',
    };
  };

  const handleSendReviewToBuyer = async (job: BookingWithDetails) => {
    try {
      const anyJob = job as any;
      const buyerUserId = Number(anyJob.buyer_id || job.buyer?.id);
      if (!Number.isInteger(buyerUserId) || buyerUserId <= 0) {
        setError('Unable to find buyer to send review.');
        return;
      }

      const review = getReviewData(job);
      if (!review.hasReview) {
        setError('No review available to send.');
        return;
      }

      setError('');
      setSendingReviewJobId(job.id);

      const conversation = await dbService.getOrCreateConversation(buyerUserId, job.id);
      const reviewText = review.comment?.trim() || 'No written comment provided.';
      await dbService.sendMessage({
        conversation_id: conversation.id,
        sender_id: parseInt(localStorage.getItem('user_id') || '0', 10),
        message_text: `Buyer review received for "${job.title}": ${review.rating}/5 stars. Comment: ${reviewText}`,
        message_type: 'text',
      });
      onNavigate('messages');
    } catch (err) {
      console.error('Failed to send review to buyer:', err);
      setError('Failed to send review to buyer.');
    } finally {
      setSendingReviewJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-secondary pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6">
        <h1 className="text-2xl font-bold mb-1">Job Management</h1>
        <p className="text-white/90">Manage your job requests</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'accepted', 'in_progress', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize whitespace-nowrap ${
                filter === tab
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center text-muted-foreground">No jobs found.</div>
          ) : filteredJobs.map((job) => {
            const buyerName = (job as any).buyer_name || job.buyer?.full_name || 'Client';
            const location = job.location_address || '';
            const scheduledDate = job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : '';
            const scheduledTime = job.scheduled_time || '';
            const amount = job.total_amount || 0;
            const requestedAt = (job as any).created_at ? new Date((job as any).created_at).toLocaleString() : '';
            const reviewData = getReviewData(job);
            return (
              <Card key={job.id} hover onClick={() => setSelectedJob(job)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{requestedAt}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
                    <p className="text-sm font-medium mb-2">Client: {buyerName}</p>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {location && (
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {location}
                        </span>
                      )}
                      {scheduledDate && (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {scheduledDate}
                        </span>
                      )}
                      {scheduledTime && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {scheduledTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">LRs {amount}</div>
                  </div>
                </div>

                {job.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="success"
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptJob(job.id);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button variant="outline" size="sm" fullWidth>
                      Counter Offer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectJob(job.id);
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {job.status === 'accepted' && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('messages');
                      }}
                    >
                      Message Client
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestCompletion(job.id);
                      }}
                    >
                      Request Completion
                    </Button>
                  </div>
                )}

                {job.status === 'in_progress' && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="text-sm font-medium text-primary">
                      Completion requested. Waiting for buyer approval.
                    </span>
                  </div>
                )}

                {job.status === 'completed' && (
                  <div className="mt-4 p-3 bg-[#10B981]/5 rounded-lg border border-[#10B981]/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#10B981]">Completed</span>
                      <div className="flex gap-2">
                        {reviewData.hasReview && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReviewToBuyer(job);
                            }}
                            disabled={sendingReviewJobId === job.id}
                          >
                            {sendingReviewJobId === job.id ? 'Sending...' : 'Send Review to Buyer'}
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          View Invoice
                        </Button>
                      </div>
                    </div>
                    {reviewData.hasReview && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Review: {reviewData.rating}/5{reviewData.comment ? ` - ${reviewData.comment}` : ''}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Calendar View Button */}
        <Button variant="outline" fullWidth>
          <Calendar className="w-5 h-5 mr-2" />
          Switch to Calendar View
        </Button>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title="Job Details"
          size="lg"
        >
          <div className="p-6 space-y-4">
            <div className={`inline-block px-3 py-1 rounded-full capitalize ${getStatusColor(selectedJob.status)}`}>
              {selectedJob.status}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">{selectedJob.title}</h3>
              <p className="text-muted-foreground">{selectedJob.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{(selectedJob as any).buyer_name || selectedJob.buyer?.full_name || 'Client'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{selectedJob.location_address || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">
                  {selectedJob.scheduled_date ? new Date(selectedJob.scheduled_date).toLocaleDateString() : '-'}
                  {selectedJob.scheduled_time ? ` at ${selectedJob.scheduled_time}` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Price</span>
                <span className="text-2xl font-bold text-primary">LRs {selectedJob.total_amount || 0}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedJob(null)} fullWidth>
                Close
              </Button>
              {selectedJob.status === 'pending' && (
                <Button variant="success" fullWidth onClick={() => handleAcceptJob(selectedJob.id)}>
                  Accept Job
                </Button>
              )}
              {selectedJob.status === 'accepted' && (
                <Button variant="success" fullWidth onClick={() => handleRequestCompletion(selectedJob.id)}>
                  Request Completion
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


